class PlayerFactory
  BASE_LIFE = 100
  BASE_STAMINA = 100
  BASE_MANA = 100
  BASE_DAMAGE = 10

  STAT_INCREASE_PER_BOSS = 10
  DEFAULT_MAX_HANDS = 2
  DEFAULT_MAX_RACE_SLOTS = 1

  # Initialize or get player from session, migrating old flat-keyword players on the fly
  def self.get_player(session)
    player = session[:player] || create_new_player

    # Migrate players created before the explicit/derived split
    if player['explicit_keywords'].nil?
      player['explicit_keywords'] = player['keywords'] || []
      refresh_derived_keywords(player)
      rebuild_keywords(player)
    end

    player
  end

  # Create a new player with base stats
  def self.create_new_player
    {
      'name'                    => 'Hero',
      'explicit_keywords'       => [],
      'derived_keywords'        => [],
      'keywords'                => [],
      'bosses_defeated'         => 0,
      'turns_since_mana_cost'   => 0,
      'turns_since_stamina_cost'=> 0,
      'active_buffs'            => {},
      'active_debuffs'          => {},
      'cooldowns'               => {},
      'max_life'                => BASE_LIFE,
      'max_stamina'             => BASE_STAMINA,
      'max_mana'                => BASE_MANA,
      'life'                    => BASE_LIFE,
      'stamina'                 => BASE_STAMINA,
      'mana'                    => BASE_MANA,
      'damage'                  => BASE_DAMAGE,
      'actions'                 => ['attack'],
      'max_hands'               => DEFAULT_MAX_HANDS,
      'equipped_hands'          => 0,
      'max_race_slots'          => DEFAULT_MAX_RACE_SLOTS,
      'race_count'              => 0
    }
  end

  # Save player to session
  def self.save_player(session, player_data)
    session[:player] = player_data
  end

  # Add a keyword to the player's explicit list.
  # Passive keywords are stackable — acquiring the same passive multiple times stacks its
  # effects multiplicatively (via the normal keyword iteration in recalculate_stats /
  # DamageCalculator). All other categories guard against duplicates.
  def self.add_keyword(player, keyword)
    explicit = player['explicit_keywords'] || []
    kw = BossKeyword.find_by(name: keyword)
    return player if explicit.include?(keyword) && kw&.category != 'passive'

    player['explicit_keywords'] = explicit + [keyword]
    refresh_derived_keywords(player)
    rebuild_keywords(player)
    recalculate_stats(player)
  end

  # Remove one copy of a keyword from the player's explicit list
  def self.remove_keyword(player, keyword)
    explicit = player['explicit_keywords'] || []
    idx = explicit.index(keyword)
    return player unless idx

    new_explicit = explicit.dup
    new_explicit.delete_at(idx)
    player['explicit_keywords'] = new_explicit
    refresh_derived_keywords(player)
    rebuild_keywords(player)
    recalculate_stats(player)
  end

  # Called when player defeats a boss
  def self.level_up(player)
    player['bosses_defeated'] = (player['bosses_defeated'] || 0) + 1
    # recalculate_stats uses bosses_defeated in the base calculation, so call it first,
    # then fully heal to the newly computed maxima.
    recalculate_stats(player)
    player['life']    = player['max_life']
    player['stamina'] = player['max_stamina']
    player['mana']    = player['max_mana']
    player
  end

  # Reset player (new run)
  def self.reset_player(session)
    session[:player] = create_new_player
  end

  # ─── private helpers ───────────────────────────────────────────────────────

  # Re-derive sub-keywords from the current explicit keyword list.
  # Each explicit keyword that lists a passive contributes one copy of that
  # passive to derived_keywords, so holding skeleton + golem (both derive
  # "armoured") results in two copies stacking multiplicatively in the
  # damage calculator.  Passives already held explicitly are NOT excluded —
  # they represent an additional stack on top of any derived ones.
  def self.refresh_derived_keywords(player)
    explicit = player['explicit_keywords'] || []
    derived  = []

    explicit.each do |kw_name|
      kw = BossKeyword.find_by(name: kw_name)
      next unless kw&.properties

      (kw.properties['passives'] || []).each do |passive_name|
        derived << passive_name
      end

      (kw.properties['abilities'] || []).each do |ability_name|
        derived << ability_name
      end
    end

    player['derived_keywords'] = derived
  end

  # Rebuild the combined keywords list (explicit + derived) used by the
  # damage calculator and all existing game logic.
  def self.rebuild_keywords(player)
    player['keywords'] = (player['explicit_keywords'] || []) + (player['derived_keywords'] || [])
  end

  # Recalculate all derived stats from the keyword list.
  # Base resource values scale with bosses_defeated so level_up bonuses are
  # never accidentally overwritten.
  def self.recalculate_stats(player)
    bosses_defeated = player['bosses_defeated'] || 0
    base_life    = BASE_LIFE    + bosses_defeated * STAT_INCREASE_PER_BOSS
    base_stamina = BASE_STAMINA + bosses_defeated * STAT_INCREASE_PER_BOSS
    base_mana    = BASE_MANA    + bosses_defeated * STAT_INCREASE_PER_BOSS

    life_mult    = 1.0
    stamina_mult = 1.0
    mana_mult    = 1.0

    chimerism_count  = 0
    race_count       = 0
    max_hands_from_races = nil   # nil until at least one creature keyword is seen

    (player['keywords'] || []).each do |kw_name|
      kw = BossKeyword.find_by(name: kw_name)
      next unless kw

      props = kw.properties || {}

      if props['multipliers']
        m = props['multipliers']
        life_mult    *= (m['life']    || 1.0)
        stamina_mult *= (m['stamina'] || 1.0)
        mana_mult    *= (m['mana']    || 1.0)
      end

      chimerism_count += 1 if kw_name == 'chimerism'

      if kw.category == 'creature'
        race_count += 1
        creature_hands = props['max_hands']
        unless creature_hands.nil?
          max_hands_from_races = (max_hands_from_races || 0) + creature_hands
        end
      end
    end

    player['max_life']    = (base_life    * life_mult).ceil
    player['max_stamina'] = (base_stamina * stamina_mult).ceil
    player['max_mana']    = (base_mana    * mana_mult).ceil

    player['life']    = [[player['life']    || 0, 0].max, player['max_life']].min
    player['stamina'] = [[player['stamina'] || 0, 0].max, player['max_stamina']].min
    player['mana']    = [[player['mana']    || 0, 0].max, player['max_mana']].min

    # Weapon slots: sum hands of explicitly equipped weapons
    player['equipped_hands'] = (player['explicit_keywords'] || []).sum do |kw_name|
      kw = BossKeyword.find_by(name: kw_name)
      next 0 unless kw&.category == 'weapon'
      kw.properties&.dig('hands') || 1
    end

    # Hand capacity: from race keywords if present, otherwise human default
    player['max_hands']      = max_hands_from_races.nil? ? DEFAULT_MAX_HANDS : max_hands_from_races
    player['max_race_slots'] = DEFAULT_MAX_RACE_SLOTS + chimerism_count
    player['race_count']     = race_count

    player
  end
end
