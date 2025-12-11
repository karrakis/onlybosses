class GameController < ApplicationController
  skip_before_action :verify_authenticity_token
  
  # POST /take_action
  def take_action
    permitted_params = action_params
    action_name = permitted_params[:game_action]
    game_status = permitted_params[:game_status]
    
    puts "Action name: #{action_name.inspect}"
    puts "Game status: #{game_status.inspect}"
    
    # Call the action as a private method if it exists
    if respond_to?(action_name, true)
      result = send(action_name, game_status)
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

  def attack(game_status)
    boss = game_status['boss']
    damage = game_status['player']['stats']['damage']
    game_status['bossLife'] -= damage
    game_status['bossLife'] = 0 if game_status['bossLife'] < 0
    
    game_status
  end

end
