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
    player = PlayerFactory.get_player(session)
    render json: player
  end
  
  # POST /set_boss
  def set_boss
    boss_data = params[:boss]
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
    action_name = params[:game_action]
    
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
    if respond_to?(action_name, true)
      game_status = send(action_name, game_status, 'player', 'boss')
      
      # Update player state in session after player action
      player['life'] = game_status['playerLife']
      player['stamina'] = game_status['playerStamina']
      player['mana'] = game_status['playerMana']
      
      # Update boss state in session after player action
      boss['life'] = game_status['bossLife']
      boss['stamina'] = game_status['bossStamina']
      boss['mana'] = game_status['bossMana']
      
      # Boss takes a turn in response (if boss is still alive)
      if game_status['bossLife'] && game_status['bossLife'] > 0
        boss_action = choose_boss_action(game_status)
        
        if respond_to?(boss_action, true)
          game_status = send(boss_action, game_status, 'boss', 'player')
          
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
    # Get action_taker's damage stat (handle different structures for player vs boss)
    action_taker_data = game_status[action_taker]
    
    # Player has flat structure with 'damage' at top level
    # Boss has nested structure with stats.base_stats.damage
    if action_taker == 'boss' && action_taker_data['stats'] && action_taker_data['stats']['base_stats']
      damage = action_taker_data['stats']['base_stats']['damage']
    else
      # For player, damage is at the top level
      damage = action_taker_data['damage']
    end
    
    # Deal damage to target's life
    life_key = "#{target}Life"
    game_status[life_key] -= damage
    game_status[life_key] = 0 if game_status[life_key] < 0
    
    game_status
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
