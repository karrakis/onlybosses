class RunSimulatorService
  MAX_DEPTH           = 50
  MAX_TURNS_PER_FIGHT = 300  # safety valve — prevents infinite loops

  # Simulate one full run. Returns the depth reached (integer).
  # keyword_registry: hash of name => BossKeyword, preloaded once by the caller.
  def self.simulate_run(keyword_registry)
    non_passive = keyword_registry.values.reject { |k| k.category == 'passive' }
    rarity1     = non_passive.select { |k| k.rarity == 1 }
    return 0 if rarity1.length < 2

    # Player starts with 1 rarity-1 creature + 1 rarity-1 characteristic (mirrors the UI)
    creatures       = rarity1.select { |k| k.category == 'creature' }
    characteristics = non_passive.select { |k| k.category == 'characteristic' }
    if creatures.any? && characteristics.any?
      player_start_names = [creatures.sample.name, characteristics.sample.name]
    else
      player_start_names = rarity1.sample(2).map(&:name)
    end

    player = PlayerFactory.create_new_player
    player_start_names.each { |kw| PlayerFactory.add_keyword(player, kw) }

    # Boss starts with 2 random non-passive rarity-1 keywords
    boss_base_names = rarity1.sample(2).map(&:name)

    run = Run.create!(session_id: "sim-#{SecureRandom.uuid}", started_at: Time.current)
    depth = 1

    loop do
      break if depth > MAX_DEPTH

      boss_all_names = expand_keywords(boss_base_names, keyword_registry)
      boss_entity    = build_boss_entity(boss_all_names, keyword_registry)

      # Record snapshot before fight (boss_all_names mirrors real game's boss.keywords)
      SnapshotService.record_snapshot_for_run(
        run,
        player,
        { 'keywords' => boss_all_names },
        depth,
        registry: keyword_registry
      )

      result = simulate_fight(
        JSON.parse(player.to_json),
        boss_entity,
        keyword_registry
      )

      if result == :player_died
        run.update!(ended_at: Time.current, final_depth: depth, outcome: 'died')
        return depth
      end

      # Boss died — steal a random keyword, level up, evolve boss keywords
      stealable = boss_base_names.reject { |n| player['keywords'].include?(n) }
      stolen    = stealable.sample
      PlayerFactory.add_keyword(player, stolen) if stolen
      PlayerFactory.level_up(player)

      boss_base_names = boss_base_names.reject { |n| n == stolen }
      available = keyword_registry.values
                    .select { |k| k.rarity <= depth + 1 }
                    .reject { |k| boss_base_names.include?(k.name) }
                    .map(&:name)
      boss_base_names = (boss_base_names + available.sample(2)).uniq

      depth += 1
    end

    # Reached MAX_DEPTH without dying
    run.update!(ended_at: Time.current, final_depth: MAX_DEPTH, outcome: 'died')
    MAX_DEPTH
  end

  # ── private ────────────────────────────────────────────────────────────────
  private_class_method def self.expand_keywords(kw_names, registry)
    expanded = kw_names.dup
    kw_names.each do |name|
      kw = registry[name]
      next unless kw&.properties&.dig('passives')
      # Allow stacking — multiple primaries granting the same passive each contribute
      # a separate copy so their multipliers compound correctly.
      kw.properties['passives'].each { |p| expanded << p }
    end
    expanded
  end

  private_class_method def self.build_boss_entity(all_kw_names, registry)
    life_mult = stamina_mult = mana_mult = 1.0
    all_kw_names.each do |name|
      kw    = registry[name]
      next unless kw
      mults = kw.properties&.dig('multipliers') || {}
      life_mult    *= (mults['life']    || 1.0)
      stamina_mult *= (mults['stamina'] || 1.0)
      mana_mult    *= (mults['mana']    || 1.0)
    end
    max_life    = [(100 * life_mult).ceil,     1].max
    max_stamina = [(100 * stamina_mult).ceil, 10].max
    max_mana    = [(100 * mana_mult).ceil,     0].max
    {
      'keywords'    => all_kw_names,
      'life'        => max_life,    'max_life'    => max_life,
      'stamina'     => max_stamina, 'max_stamina' => max_stamina,
      'mana'        => max_mana,    'max_mana'    => max_mana,
    }
  end

  private_class_method def self.simulate_fight(player_e, boss_e, registry)
    # Initialise regen accumulators expected by CombatService.apply_regeneration
    player_e['turns_since_mana_cost']    ||= 0
    player_e['turns_since_stamina_cost'] ||= 0
    boss_e['turns_since_mana_cost']      ||= 0
    boss_e['turns_since_stamina_cost']   ||= 0

    # Forced-action state mirrors session[:player/boss_forced_next_action] in the live game
    player_forced = nil
    boss_forced   = nil

    MAX_TURNS_PER_FIGHT.times do
      gs = build_game_status(player_e, boss_e)

      # ── Player turn ──────────────────────────────────────────────────────
      player_action = player_forced || 'attack'
      player_forced = nil
      player_stamina_before = gs['playerStamina']
      player_mana_before    = gs['playerMana']

      gs = CombatService.apply_action(gs, player_action, 'player', 'boss')

      # Capture forced follow-up (e.g. smash → guard)
      if gs['playerForcedNextAction']
        player_forced = gs.delete('playerForcedNextAction')
      end

      sync_entities(gs, player_e, boss_e)
      return :boss_died if dead?(boss_e, registry)

      # ── Boss turn ────────────────────────────────────────────────────────
      boss_action = boss_forced || CombatService.choose_boss_action(gs)
      boss_forced = nil
      boss_stamina_before = gs['bossStamina']
      boss_mana_before    = gs['bossMana']

      gs = CombatService.apply_action(gs, boss_action, 'boss', 'player')

      if gs['bossForcedNextAction']
        boss_forced = gs.delete('bossForcedNextAction')
      end

      # ── End-of-turn regeneration (boss first, then player — mirrors live game) ──
      boss_mana_cost    = gs['bossMana']    < boss_mana_before
      boss_stamina_cost = gs['bossStamina'] < boss_stamina_before
      gs = CombatService.apply_regeneration(gs, 'boss',   mana_cost: boss_mana_cost,   stamina_cost: boss_stamina_cost)

      player_mana_cost    = gs['playerMana']    < player_mana_before
      player_stamina_cost = gs['playerStamina'] < player_stamina_before
      gs = CombatService.apply_regeneration(gs, 'player', mana_cost: player_mana_cost, stamina_cost: player_stamina_cost)

      sync_entities(gs, player_e, boss_e)
      return :player_died if dead?(player_e, registry)
    end

    # Turn limit hit — whoever has more % of their life resource remaining wins
    life_pct(player_e, registry) >= life_pct(boss_e, registry) ? :boss_died : :player_died
  end

  # Build the game_status hash format that CombatService expects.
  # The entity objects are embedded by reference so apply_regeneration's
  # internal sync-back writes persist into player_e / boss_e automatically.
  private_class_method def self.build_game_status(player_e, boss_e)
    {
      'playerLife'    => player_e['life'],
      'playerStamina' => player_e['stamina'],
      'playerMana'    => player_e['mana'],
      'bossLife'      => boss_e['life'],
      'bossStamina'   => boss_e['stamina'],
      'bossMana'      => boss_e['mana'],
      'player'        => player_e,
      'boss'          => boss_e,
    }
  end

  # Copy flat resource keys from game_status back into the entity objects.
  private_class_method def self.sync_entities(gs, player_e, boss_e)
    player_e['life']    = gs['playerLife']
    player_e['stamina'] = gs['playerStamina']
    player_e['mana']    = gs['playerMana']
    boss_e['life']      = gs['bossLife']
    boss_e['stamina']   = gs['bossStamina']
    boss_e['mana']      = gs['bossMana']
  end

  private_class_method def self.dead?(entity, registry)
    kws     = (entity['keywords'] || []).filter_map { |n| registry[n] }
    res_key = kws.find { |k| k.properties&.dig('life_resource') }&.properties&.dig('life_resource') == 'mana' ? 'mana' : 'life'
    entity[res_key].to_f <= 0
  end

  private_class_method def self.life_pct(entity, registry)
    kws     = (entity['keywords'] || []).filter_map { |n| registry[n] }
    res_key = kws.find { |k| k.properties&.dig('life_resource') }&.properties&.dig('life_resource') == 'mana' ? 'mana' : 'life'
    max     = entity["max_#{res_key}"].to_f
    max.zero? ? 0.0 : entity[res_key].to_f / max
  end
end
