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
    PlayerFactory.reset_player(session)
    session[:current_boss] = nil  # Clear boss from session
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
    player = PlayerFactory.get_player(session)
    PlayerFactory.add_keyword(player, keyword)
    PlayerFactory.level_up(player)
    PlayerFactory.save_player(session, player)
    render json: player
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
    
    # Convert player hash with symbol keys to string keys for consistency
    player_with_string_keys = player.deep_stringify_keys
    
    # Build game_status from session data
    game_status = {
      'playerLife' => player['life'],
      'playerStamina' => player['stamina'],
      'playerMana' => player['mana'],
      'bossLife' => boss['life'],
      'bossStamina' => boss['stamina'],
      'bossMana' => boss['mana'],
      'player' => player_with_string_keys,
      'boss' => boss
    }
    
    # Process player action
    if respond_to?(base_action, true)
      player_mana_before = game_status['playerMana']
      player_stamina_before = game_status['playerStamina']

      if base_action == 'cast'
        game_status = send(base_action, game_status, 'player', 'boss', action_payload)
      else
        game_status = send(base_action, game_status, 'player', 'boss')
      end

      player_mana_cost = game_status['playerMana'] < player_mana_before
      player_stamina_cost = game_status['playerStamina'] < player_stamina_before
      game_status = apply_regeneration(game_status, 'player', mana_cost: player_mana_cost, stamina_cost: player_stamina_cost)
      
      # Update player state in session after player action
      player['life'] = game_status['playerLife']
      player['stamina'] = game_status['playerStamina']
      player['mana'] = game_status['playerMana']
      
      # Update boss state in session after player action
      boss['life'] = game_status['bossLife']
      boss['stamina'] = game_status['bossStamina']
      boss['mana'] = game_status['bossMana']
      
      # Capture player state after player's action (for showing lifesteal)
      player_after_player_action = player.deep_dup
      
      # Determine which resource is the boss's life resource
      boss_life_resource = 'life'
      if boss['keywords']
        boss['keywords'].each do |keyword_name|
          keyword = BossKeyword.find_by(name: keyword_name)
          if keyword && keyword.properties['life_resource']
            boss_life_resource = keyword.properties['life_resource']
            break
          end
        end
      end
      
      # Check the appropriate resource to see if boss is alive
      boss_current_life = boss_life_resource == 'mana' ? game_status['bossMana'] : game_status['bossLife']
      
      # Boss takes a turn in response (if boss is still alive)
      if boss_current_life && boss_current_life > 0
        boss_action = choose_boss_action(game_status)
        
        if respond_to?(boss_action, true)
          boss_mana_before = game_status['bossMana']
          boss_stamina_before = game_status['bossStamina']
          game_status = send(boss_action, game_status, 'boss', 'player')
          boss_mana_cost = game_status['bossMana'] < boss_mana_before
          boss_stamina_cost = game_status['bossStamina'] < boss_stamina_before
          game_status = apply_regeneration(game_status, 'boss', mana_cost: boss_mana_cost, stamina_cost: boss_stamina_cost)
          
          # Update player state in session after boss action
          player['life'] = game_status['playerLife']
          player['stamina'] = game_status['playerStamina']
          player['mana'] = game_status['playerMana']
        end
        
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
          turnToken: new_token
        }
      else
        # Boss is defeated, no boss action
        PlayerFactory.save_player(session, player)
        save_current_boss(boss)
        
        # Update game_status with latest data (player needs symbol keys for frontend)
        game_status['player'] = player
        game_status['boss'] = boss
        
        new_token = SecureRandom.uuid
        session[:turn_token] = new_token
        
        result = {
          playerAction: action_name,
          bossAction: nil,
          gameState: game_status,
          turnToken: new_token
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
    # Convert ActionController::Parameters to hash if needed
    session[:current_boss] = boss_data.is_a?(ActionController::Parameters) ? boss_data.to_unsafe_h : boss_data
  end
  
  def choose_boss_action(game_status)
    # For now, boss only knows attack
    # Later this can be expanded to check boss abilities
    available_actions = ['attack']
    available_actions.sample
  end
  
  def attack(game_status, action_taker = 'player', target = 'boss')
    # Basic attack has physical damage
    ability_damage = { 'physical' => 10 }

    stamina_cost = 10
    stamina_key = "#{action_taker}Stamina"
    if game_status[stamina_key]
      game_status[stamina_key] -= stamina_cost
      game_status[stamina_key] = 0 if game_status[stamina_key] < 0
    end
    
    # Get attacker and defender data
    attacker_data = game_status[action_taker]
    defender_data = game_status[target]
    
    # Calculate damage using the typed damage system
    damage_result = DamageCalculator.calculate_damage(attacker_data, defender_data, ability_damage)
    
    total_damage = damage_result[:total_damage].ceil
    life_resource = damage_result[:life_resource]
    
    # Apply damage to the appropriate resource
    resource_key = "#{target}#{life_resource.capitalize}"
    game_status[resource_key] -= total_damage
    game_status[resource_key] = 0 if game_status[resource_key] < 0
    
    # Check for lifesteal on attacker
    lifesteal_amount = 0
    if attacker_data['keywords']
      attacker_data['keywords'].each do |keyword_name|
        keyword = BossKeyword.find_by(name: keyword_name)
        if keyword && keyword.properties && keyword.properties['lifesteal']
          lifesteal_amount += keyword.properties['lifesteal']
        end
      end
    end
    
    # Apply lifesteal healing if attacker has it
    if lifesteal_amount > 0
      healing = (total_damage * lifesteal_amount).ceil
      
      # Determine attacker's life resource
      attacker_life_resource = 'life'
      if attacker_data['keywords']
        attacker_data['keywords'].each do |keyword_name|
          keyword = BossKeyword.find_by(name: keyword_name)
          if keyword && keyword.properties['life_resource']
            attacker_life_resource = keyword.properties['life_resource']
            break
          end
        end
      end
      
      # Apply healing to attacker's life resource
      attacker_resource_key = "#{action_taker}#{attacker_life_resource.capitalize}"
      attacker_max_key = "max_#{attacker_life_resource}"
      
      game_status[attacker_resource_key] += healing
      
      # Cap at max resource value
      if attacker_data[attacker_max_key]
        game_status[attacker_resource_key] = [game_status[attacker_resource_key], attacker_data[attacker_max_key]].min
      end
    end
    
    game_status
  end

  def cast(game_status, action_taker = 'player', target = 'boss', spell_name = nil)
    # Basic cast uses magic damage and mana cost
    base_damage = 12
    if spell_name.present?
      case spell_name
      when 'magic_missile'
        base_damage = 12
      when 'firebolt', 'fire_bolt'
        base_damage = 14
      when 'lightning_strike'
        base_damage = 15
      else
        base_damage = 12
      end
    end

    mana_cost = 10
    mana_key = "#{action_taker}Mana"
    if game_status[mana_key].nil? || game_status[mana_key] < mana_cost
      return game_status
    end

    game_status[mana_key] -= mana_cost

    ability_damage = { 'magic' => base_damage }

    attacker_data = game_status[action_taker]
    defender_data = game_status[target]

    damage_result = DamageCalculator.calculate_damage(attacker_data, defender_data, ability_damage)
    total_damage = damage_result[:total_damage].ceil
    life_resource = damage_result[:life_resource]

    resource_key = "#{target}#{life_resource.capitalize}"
    game_status[resource_key] -= total_damage
    game_status[resource_key] = 0 if game_status[resource_key] < 0

    game_status
  end

  def apply_regeneration(game_status, entity_key, mana_cost:, stamina_cost:)
    entity_data = game_status[entity_key]
    return game_status unless entity_data

    entity_data['turns_since_mana_cost'] ||= 0
    entity_data['turns_since_stamina_cost'] ||= 0

    if mana_cost
      entity_data['turns_since_mana_cost'] = 0
    else
      entity_data['turns_since_mana_cost'] += 1
      base_regen = [5 * entity_data['turns_since_mana_cost'], 25].min
      regen_multiplier = mana_regen_multiplier(entity_data)
      mana_regen = (base_regen * regen_multiplier).floor
      if mana_regen > 0
        mana_key = "#{entity_key}Mana"
        max_mana = get_max_resource(entity_data, 'mana')
        if max_mana
          game_status[mana_key] = [game_status[mana_key] + mana_regen, max_mana].min
        else
          game_status[mana_key] += mana_regen
        end
      end
    end

    if stamina_cost
      entity_data['turns_since_stamina_cost'] = 0
    else
      entity_data['turns_since_stamina_cost'] += 1
      stamina_regen = 5 * entity_data['turns_since_stamina_cost']
      stamina_key = "#{entity_key}Stamina"
      max_stamina = get_max_resource(entity_data, 'stamina')
      if max_stamina
        game_status[stamina_key] = [game_status[stamina_key] + stamina_regen, max_stamina].min
      else
        game_status[stamina_key] += stamina_regen
      end
    end

    entity_data['mana'] = game_status["#{entity_key}Mana"]
    entity_data['stamina'] = game_status["#{entity_key}Stamina"]

    game_status
  end

  def mana_regen_multiplier(entity_data)
    keywords = entity_data['keywords'] || []
    keywords.each do |keyword_name|
      keyword = BossKeyword.find_by(name: keyword_name)
      next unless keyword

      attrs = keyword.properties || {}
      return attrs['mana_regen_multiplier'].to_f if attrs['mana_regen_multiplier']
    end

    1.0
  end

  def get_max_resource(entity_data, resource_name)
    if entity_data["max_#{resource_name}"]
      entity_data["max_#{resource_name}"]
    else
      entity_data.dig('stats', 'base_stats', resource_name)
    end
  end

  def heal(game_status, action_taker = 'player', target = 'player')    
    # Get action_taker's healing stat (handle different structures for player vs boss)
    action_taker_data = game_status[action_taker]
    if action_taker == 'boss' && action_taker_data['stats']['base_stats']
      healing = action_taker_data['stats']['base_stats']['damage'] * 2 || 0
    else
      healing = action_taker_data['stats']['damage'] * 2 || 0
    end
    
    # Check if target is undead
    target_data = game_status[target]
    is_undead = false
    
    if target_data['keywords']
      is_undead = target_data['keywords'].include?('undead')
    end
    
    life_key = "#{target}Life"
    
    if is_undead
      # Healing damages undead
      game_status[life_key] -= healing
      game_status[life_key] = 0 if game_status[life_key] < 0
    else
      # Normal healing
      game_status[life_key] += healing
    end
    
    game_status
  end

end
