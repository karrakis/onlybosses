class PlayerFactory
  BASE_LIFE = 100
  BASE_STAMINA = 100
  BASE_MANA = 100
  BASE_DAMAGE = 10
  
  STAT_INCREASE_PER_BOSS = 10
  
  # Initialize or get player from session
  def self.get_player(session)
    if session[:player]
      session[:player]
    else
      create_new_player
    end
  end
  
  # Create a new player with base stats
  def self.create_new_player
    {
      name: 'Hero',
      keywords: [],
      bosses_defeated: 0,
      max_life: BASE_LIFE,
      max_stamina: BASE_STAMINA,
      max_mana: BASE_MANA,
      life: BASE_LIFE,
      stamina: BASE_STAMINA,
      mana: BASE_MANA,
      damage: BASE_DAMAGE,
      actions: ['attack']
    }
  end
  
  # Save player to session
  def self.save_player(session, player_data)
    session[:player] = player_data
  end
  
  # Add a keyword to the player and recalculate stats
  def self.add_keyword(player, keyword)
    return player if player[:keywords].include?(keyword)
    
    player[:keywords] << keyword
    recalculate_stats(player)
  end
  
  # Called when player defeats a boss
  def self.level_up(player)
    player[:bosses_defeated] += 1
    
    # Increase base stats
    player[:max_life] += STAT_INCREASE_PER_BOSS
    player[:max_stamina] += STAT_INCREASE_PER_BOSS
    player[:max_mana] += STAT_INCREASE_PER_BOSS
    
    # Fully heal
    player[:life] = player[:max_life]
    player[:stamina] = player[:max_stamina]
    player[:mana] = player[:max_mana]
    
    recalculate_stats(player)
  end
  
  # Recalculate all stats based on keywords
  def self.recalculate_stats(player)
    # Start with base damage
    total_damage = BASE_DAMAGE
    
    # Apply keyword bonuses
    player[:keywords].each do |keyword|
      keyword_data = BossKeyword.find_by(name: keyword)
      next unless keyword_data
      
      # Parse properties JSON if it exists
      if keyword_data.properties
        props = keyword_data.properties
        total_damage += props['damage_bonus'].to_i if props['damage_bonus']
      end
    end
    
    player[:damage] = total_damage
    player
  end
  
  # Reset player (new run)
  def self.reset_player(session)
    session[:player] = create_new_player
  end
end
