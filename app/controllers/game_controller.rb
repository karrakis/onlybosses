class GameController < ApplicationController
  skip_before_action :verify_authenticity_token
  
  # GET /get_player
  def get_player
    player = PlayerFactory.get_player(session)
    render json: player
  end
  
  # GET /get_game_state
  def get_game_state
    player = PlayerFactory.get_player(session)
    boss = get_current_boss
    
    render json: {
      player: player,
      boss: boss,
      turnToken: session[:turn_token]
    }
  end
  
  # POST /reset_player
  def reset_player
    outcome = params[:outcome]
    SnapshotService.close_run(session, outcome || 'quit') if session[:run_id]
    PlayerFactory.reset_player(session)
    session[:current_boss] = nil
    player = PlayerFactory.get_player(session)
    render json: player
  end
  
  # POST /set_boss
  def set_boss
    boss_data = params[:boss]
    if boss_data
      boss_data = boss_data.to_unsafe_h if boss_data.is_a?(ActionController::Parameters)
      boss_data['turns_since_mana_cost'] ||= 0
      boss_data['turns_since_stamina_cost'] ||= 0
    end
    save_current_boss(boss_data)
    render json: { success: true }
  end
  
  # POST /add_keyword
  def add_keyword
    keyword = params[:keyword]
    depth   = params[:depth].to_i
    player  = PlayerFactory.get_player(session)
    PlayerFactory.add_keyword(player, keyword)
    PlayerFactory.level_up(player)
    PlayerFactory.save_player(session, player)
    SnapshotService.record_snapshot(session, player, get_current_boss, depth) if depth > 0
    render json: player
  end

  # POST /skip_keyword
  # Called when the player discards a boss keyword without taking it (e.g. hate-draft keep-race).
  # Still levels up and records a snapshot so depth progression is preserved.
  def skip_keyword
    depth  = params[:depth].to_i
    player = PlayerFactory.get_player(session)
    PlayerFactory.level_up(player)
    PlayerFactory.save_player(session, player)
    SnapshotService.record_snapshot(session, player, get_current_boss, depth) if depth > 0
    render json: player
  end

  # POST /swap_weapons
  # Removes each weapon in old_keywords, then adds new_keyword, levels up once.
  def swap_weapons
    new_keyword  = params[:new_keyword]
    old_keywords = Array(params[:old_keywords])
    depth        = params[:depth].to_i
    player       = PlayerFactory.get_player(session)
    old_keywords.each { |kw| PlayerFactory.remove_keyword(player, kw) }
    PlayerFactory.add_keyword(player, new_keyword)
    PlayerFactory.level_up(player)
    PlayerFactory.save_player(session, player)
    SnapshotService.record_snapshot(session, player, get_current_boss, depth) if depth > 0
    render json: player
  end

  # POST /swap_race
  # Atomically removes old_keyword and adds new_keyword, then levels up once.
  def swap_race
    new_keyword = params[:new_keyword]
    old_keyword = params[:old_keyword]
    depth       = params[:depth].to_i
    player      = PlayerFactory.get_player(session)
    PlayerFactory.remove_keyword(player, old_keyword)
    PlayerFactory.add_keyword(player, new_keyword)
    PlayerFactory.level_up(player)
    PlayerFactory.save_player(session, player)
    SnapshotService.record_snapshot(session, player, get_current_boss, depth) if depth > 0
    render json: player
  end

  # POST /remove_keyword
  def remove_keyword
    keyword = params[:keyword]
    depth   = params[:depth].to_i
    player  = PlayerFactory.get_player(session)
    PlayerFactory.remove_keyword(player, keyword)
    PlayerFactory.level_up(player)
    PlayerFactory.save_player(session, player)
    SnapshotService.record_snapshot(session, player, get_current_boss, depth) if depth > 0
    render json: player
  end

  # POST /record_snapshot
  def record_snapshot
    depth  = params[:depth].to_i
    player = PlayerFactory.get_player(session)
    SnapshotService.record_snapshot(session, player, get_current_boss, depth) if depth > 0
    render json: { success: true }
  end
  
  # POST /take_action
  def take_action
    action_name = params[:game_action].to_s
    base_action, action_payload = action_name.split(':', 2)
    
    # Load player and boss from session
    player = PlayerFactory.get_player(session)
    boss = get_current_boss
    
    # Check if boss exists
    if boss.blank? || boss['life'].nil?
      render json: { error: 'No active boss found' }, status: :bad_request
      return
    end

    # Expand boss keywords to include derived passives.  Stacking is intentional —
    # multiple primaries granting the same passive each add an independent copy so
    # multipliers compound, exactly as RunSimulatorService.expand_keywords does.
    boss_expanded = boss.dup
    boss_expanded_keywords = (boss['keywords'] || []).dup
    (boss['keywords'] || []).each do |kw_name|
      kw = BossKeyword.find_by(name: kw_name)
      (kw&.properties&.dig('passives') || []).each do |passive_name|
        boss_expanded_keywords << passive_name   # no dedup: intentional stacking
      end
    end
    boss_expanded['keywords'] = boss_expanded_keywords

    # Convert player hash with symbol keys to string keys for consistency
    player_with_string_keys = player.deep_stringify_keys

    # Ensure transient effect fields exist on both entities (defensive for pre-existing sessions)
    player_with_string_keys['active_buffs']   ||= {}
    player_with_string_keys['active_debuffs'] ||= {}
    player_with_string_keys['cooldowns']      ||= {}
    boss_expanded['active_buffs']             ||= {}
    boss_expanded['active_debuffs']           ||= {}
    boss_expanded['cooldowns']                ||= {}
    
    # Build game_status from session data
    game_status = {
      'playerLife' => player['life'],
      'playerStamina' => player['stamina'],
      'playerMana' => player['mana'],
      'bossLife' => boss['life'],
      'bossStamina' => boss['stamina'],
      'bossMana' => boss['mana'],
      'player' => player_with_string_keys,
      'boss' => boss_expanded
    }

    player_mana_turn_start    = game_status['playerMana']
    player_stamina_turn_start = game_status['playerStamina']

    # Override player action if previous turn set a forced follow-up (e.g. smash → guard)
    if session[:player_forced_next_action]
      base_action    = session.delete(:player_forced_next_action)
      action_payload = nil
    end

    # Process player action
    if CombatService.known_action?(base_action)
      game_status = CombatService.apply_action(game_status, base_action, 'player', 'boss', action_payload)

      # Persist forced next action to session if the player action set one
      if game_status['playerForcedNextAction']
        session[:player_forced_next_action] = game_status.delete('playerForcedNextAction')
      end

      # Capture player state after player's action (for showing lifesteal)
      player_after_player_action = player.deep_dup
      player_after_player_action['life'] = game_status['playerLife']
      player_after_player_action['stamina'] = game_status['playerStamina']
      player_after_player_action['mana'] = game_status['playerMana']
      
      # Determine which resource is the boss's life resource.
      # boss_expanded['keywords'] already includes derived passives, so a simple scan suffices.
      boss_life_resource = 'life'
      (boss_expanded['keywords'] || []).each do |keyword_name|
        keyword = BossKeyword.find_by(name: keyword_name)
        if keyword&.properties&.dig('life_resource')
          boss_life_resource = keyword.properties['life_resource']
          break
        end
      end
      
      # Check the appropriate resource to see if boss is alive
      boss_current_life = boss_life_resource == 'mana' ? game_status['bossMana'] : game_status['bossLife']
      
      # Boss takes a turn in response (if boss is still alive)
      if boss_current_life && boss_current_life > 0
        boss_action = if session[:boss_forced_next_action]
          session.delete(:boss_forced_next_action)
        else
          choose_boss_action(game_status)
        end
        
        if CombatService.known_action?(boss_action)
          # Capture boss resources immediately before the boss acts — matches simulator's
          # boss_mana_before / boss_stamina_before which are both set post-player-action.
          boss_mana_before    = game_status['bossMana']
          boss_stamina_before = game_status['bossStamina']
          game_status = CombatService.apply_action(game_status, boss_action, 'boss', 'player')
          boss_mana_cost    = game_status['bossMana']    < boss_mana_before
          boss_stamina_cost = game_status['bossStamina'] < boss_stamina_before
          game_status = CombatService.apply_regeneration(game_status, 'boss', mana_cost: boss_mana_cost, stamina_cost: boss_stamina_cost)

          # Persist boss forced next action if set
          if game_status['bossForcedNextAction']
            session[:boss_forced_next_action] = game_status.delete('bossForcedNextAction')
          end

          # Update player state in session after boss action
          player['life'] = game_status['playerLife']
          player['stamina'] = game_status['playerStamina']
          player['mana'] = game_status['playerMana']
        end

        # Apply player regeneration after the full turn, so incoming mana damage also interrupts it
        player_mana_cost    = game_status['playerMana']    < player_mana_turn_start
        player_stamina_cost = game_status['playerStamina'] < player_stamina_turn_start
        game_status = CombatService.apply_regeneration(game_status, 'player', mana_cost: player_mana_cost, stamina_cost: player_stamina_cost)

        # End-of-round: tick buff/debuff/cooldown counters for both entities
        game_status = CombatService.tick_entity_effects(game_status, 'player')
        game_status = CombatService.tick_entity_effects(game_status, 'boss')

        # Sync latest resources + transient effects back to session entities
        player['life']           = game_status['playerLife']
        player['stamina']        = game_status['playerStamina']
        player['mana']           = game_status['playerMana']
        player['active_buffs']   = game_status['player']['active_buffs']   || {}
        player['active_debuffs'] = game_status['player']['active_debuffs'] || {}
        player['cooldowns']      = game_status['player']['cooldowns']      || {}
        boss['life']             = game_status['bossLife']
        boss['stamina']          = game_status['bossStamina']
        boss['mana']             = game_status['bossMana']
        boss['active_buffs']     = game_status['boss']['active_buffs']     || {}
        boss['active_debuffs']   = game_status['boss']['active_debuffs']   || {}
        boss['cooldowns']        = game_status['boss']['cooldowns']        || {}
        
        # Save updated states to session
        PlayerFactory.save_player(session, player)
        save_current_boss(boss)
        
        # Update game_status with latest data (player needs symbol keys for frontend)
        game_status['player'] = player
        game_status['playerAfterPlayerAction'] = player_after_player_action
        game_status['boss'] = boss
        
        # Generate new token for next turn
        new_token = SecureRandom.uuid
        session[:turn_token] = new_token
        
        # Return metadata about both actions
        result = {
          playerAction: action_name,
          bossAction: boss_action,
          gameState: game_status,
          turnToken: new_token,
          forcedPlayerAction: session[:player_forced_next_action],
          playerDied: player_dead?(game_status)
        }
      else
        # Boss is defeated, no boss action
        player_mana_cost    = game_status['playerMana']    < player_mana_turn_start
        player_stamina_cost = game_status['playerStamina'] < player_stamina_turn_start
        game_status = CombatService.apply_regeneration(game_status, 'player', mana_cost: player_mana_cost, stamina_cost: player_stamina_cost)

        # Still tick effects even when boss dies (cooldowns tick, buffs expire normally)
        game_status = CombatService.tick_entity_effects(game_status, 'player')
        game_status = CombatService.tick_entity_effects(game_status, 'boss')

        player['life']           = game_status['playerLife']
        player['stamina']        = game_status['playerStamina']
        player['mana']           = game_status['playerMana']
        player['active_buffs']   = game_status['player']['active_buffs']   || {}
        player['active_debuffs'] = game_status['player']['active_debuffs'] || {}
        player['cooldowns']      = game_status['player']['cooldowns']      || {}
        boss['life']             = game_status['bossLife']
        boss['stamina']          = game_status['bossStamina']
        boss['mana']             = game_status['bossMana']

        PlayerFactory.save_player(session, player)
        save_current_boss(boss)

        # Boss died — the cost of smash is absorbed, no combat turn to guard against
        session.delete(:player_forced_next_action)

        # Update game_status with latest data (player needs symbol keys for frontend)
        game_status['player'] = player
        game_status['boss'] = boss

        new_token = SecureRandom.uuid
        session[:turn_token] = new_token

        result = {
          playerAction: action_name,
          bossAction: nil,
          gameState: game_status,
          turnToken: new_token,
          forcedPlayerAction: nil
        }
      end
      
      render json: result
    else
      render json: { success: false, error: "Unknown action: #{action_name}" }, status: :bad_request
    end
  end

  private

  def get_current_boss
    session[:current_boss] || {}
  end

  def save_current_boss(boss_data)
    session[:current_boss] = boss_data.is_a?(ActionController::Parameters) ? boss_data.to_unsafe_h : boss_data
  end

  # Delegate to CombatService — kept here only as a private wrapper so choose_boss_action
  # can still be called within this controller without the class prefix.
  def choose_boss_action(game_status)
    CombatService.choose_boss_action(game_status)
  end

  # Returns true if the player's life resource is at 0 or below.
  # Checks player['keywords'] (which includes derived passives) for any keyword
  # that overrides the life resource (e.g. ethereal → mana).
  def player_dead?(game_status)
    player_data = game_status['player']
    return false unless player_data
    kw_names   = player_data['keywords'] || []
    res_key    = 'life'
    kw_names.each do |name|
      kw = BossKeyword.find_by(name: name)
      if kw&.properties&.dig('life_resource')
        res_key = kw.properties['life_resource']
        break
      end
    end
    game_status["player#{res_key.capitalize}"].to_f <= 0
  end

end
