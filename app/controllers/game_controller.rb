class GameController < ApplicationController
  skip_before_action :verify_authenticity_token
  
  # POST /take_action
  def take_action
    permitted_params = action_params
    action_name = permitted_params[:game_action]
    game_status = permitted_params[:game_status]
    action_taker = permitted_params[:action_taker]
    target = permitted_params[:target]
    
    puts "Action name: #{action_name.inspect}"
    puts "Game status: #{game_status.inspect}"
    puts "Action taker: #{action_taker.inspect}"
    puts "Target: #{target.inspect}"
    
    # Process player action
    if respond_to?(action_name, true)
      game_status = send(action_name, game_status, action_taker, target)
      puts "After player action: #{game_status.inspect}"
      
      # Boss takes a turn in response (if boss is still alive)
      if game_status['bossLife'] && game_status['bossLife'] > 0
        boss_action = choose_boss_action(game_status)
        puts "Boss choosing action: #{boss_action}"
        
        if respond_to?(boss_action, true)
          game_status = send(boss_action, game_status, 'boss', 'player')
          puts "After boss action: #{game_status.inspect}"
        end
        
        # Return metadata about both actions
        result = {
          playerAction: action_name,
          bossAction: boss_action,
          gameState: game_status
        }
      else
        # Boss is defeated, no boss action
        result = {
          playerAction: action_name,
          bossAction: nil,
          gameState: game_status
        }
      end
      
      render json: result
    else
      render json: { success: false, error: "Unknown action: #{action_name}" }, status: :bad_request
    end
  end

  private
  
  def choose_boss_action(game_status)
    # For now, boss only knows attack
    # Later this can be expanded to check boss abilities
    available_actions = ['attack']
    available_actions.sample
  end
  
  def action_params
    params.permit(
      :game_action,
      :action_taker,
      :target,
      game_status: [
        :playerLife, :playerStamina, :playerMana,
        :bossLife, :bossStamina, :bossMana,
        player: [:name, { actions: [] }, { stats: [:life, :stamina, :mana, :damage] }],
        boss: [
          :id, :name, :image_status, :image_url, :created_at,
          { keywords: [] },
          { stats: [
            { special: {} },
            { weapons: [] },
            { abilities: [] },
            { resistances: [] },
            { vulnerabilities: [] },
            { base_stats: [:life, :mana, :damage, :defense, :endurance] }
          ]}
        ]
      ],
      game: [
        :game_action,
        { game_status: [
          :playerLife, :playerStamina, :playerMana,
          :bossLife, :bossStamina, :bossMana,
          { player: [:name, { actions: [] }, { stats: [:life, :stamina, :mana, :damage] }] },
          { boss: [
            :id, :name, :image_status, :image_url, :created_at,
            { keywords: [] },
            { stats: [
              { special: {} },
              { weapons: [] },
              { abilities: [] },
              { resistances: [] },
              { vulnerabilities: [] },
              { base_stats: [:life, :mana, :damage, :defense, :endurance] }
            ]}
          ]}
        ]}
      ]
    )
  end

  def attack(game_status, action_taker = 'player', target = 'boss')
    # Handle nil values by using defaults
    action_taker ||= 'player'
    target ||= 'boss'
    
    # Get action_taker's damage stat (handle different structures for player vs boss)
    action_taker_data = game_status[action_taker]
    if action_taker == 'boss' && action_taker_data['stats']['base_stats']
      damage = action_taker_data['stats']['base_stats']['damage']
    else
      damage = action_taker_data['stats']['damage']
    end
    
    # Deal damage to target's life
    life_key = "#{target}Life"
    game_status[life_key] -= damage
    game_status[life_key] = 0 if game_status[life_key] < 0
    
    game_status
  end

end
