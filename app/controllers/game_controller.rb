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
    
    # Call the action as a private method if it exists
    if respond_to?(action_name, true)
      result = send(action_name, game_status, action_taker, target)
      puts "Action result: #{result.inspect}"
      render json: result
    else
      render json: { success: false, error: "Unknown action: #{action_name}" }, status: :bad_request
    end
  end

  private
  
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
    
    # Get action_taker's damage stat
    action_taker_data = game_status[action_taker]
    damage = action_taker_data['stats']['damage']
    
    # Deal damage to target's life
    life_key = "#{target}Life"
    game_status[life_key] -= damage
    game_status[life_key] = 0 if game_status[life_key] < 0
    
    game_status
  end

end
