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
      'name' => 'Hero',
      'keywords' => [],
      'bosses_defeated' => 0,
      'max_life' => BASE_LIFE,
      'max_stamina' => BASE_STAMINA,
      'max_mana' => BASE_MANA,
      'life' => BASE_LIFE,
      'stamina' => BASE_STAMINA,
      'mana' => BASE_MANA,
      'damage' => BASE_DAMAGE,
      'actions' => ['attack']
    }
  end
  
  # Save player to session
  def self.save_player(session, player_data)
    session[:player] = player_data
  end
  
  # Add a keyword to the player and recalculate stats
  def self.add_keyword(player, keyword)
    return player if player['keywords'].include?(keyword)
    
    player['keywords'] << keyword
    recalculate_stats(player)
  end
  
  # Called when player defeats a boss
  def self.level_up(player)
    player['bosses_defeated'] += 1
    
    # Increase base stats
    player['max_life'] += STAT_INCREASE_PER_BOSS
    player['max_stamina'] += STAT_INCREASE_PER_BOSS
    player['max_mana'] += STAT_INCREASE_PER_BOSS
    
    # Fully heal
    player['life'] = player['max_life']
    player['stamina'] = player['max_stamina']
    player['mana'] = player['max_mana']
    
    recalculate_stats(player)
  end
  
  # Recalculate all stats based on keywords
  def self.recalculate_stats(player)
    # Start with base values
    total_life_mult = 1.0
    total_stamina_mult = 1.0
    total_mana_mult = 1.0
    
    # Apply keyword multipliers
    player['keywords'].each do |keyword|
      keyword_data = BossKeyword.find_by(name: keyword)
      next unless keyword_data
      
      # Get multipliers from properties
      if keyword_data.properties && keyword_data.properties['multipliers']
        mults = keyword_data.properties['multipliers']
        total_life_mult *= (mults['life'] || 1.0)
        total_stamina_mult *= (mults['stamina'] || 1.0)
        total_mana_mult *= (mults['mana'] || 1.0)
      end
    end
    
    # Apply multipliers to max stats
    player['max_life'] = (BASE_LIFE * total_life_mult).ceil
    player['max_stamina'] = (BASE_STAMINA * total_stamina_mult).ceil
    player['max_mana'] = (BASE_MANA * total_mana_mult).ceil
    
    player
  end
  
  # Reset player (new run)
  def self.reset_player(session)
    session[:player] = nil  # Clear existing player
    session[:player] = create_new_player  # Create fresh player
  end
end
