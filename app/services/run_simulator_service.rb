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
      kw.properties['passives'].each { |p| expanded << p unless expanded.include?(p) }
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
    MAX_TURNS_PER_FIGHT.times do
      attack(player_e, boss_e, registry)
      return :boss_died   if dead?(boss_e,   registry)
      attack(boss_e,   player_e, registry)
      return :player_died if dead?(player_e, registry)
      apply_regen(player_e)
      apply_regen(boss_e)
    end
    # Turn limit hit: whoever has more % of their life resource remaining wins
    life_pct(player_e, registry) >= life_pct(boss_e, registry) ? :boss_died : :player_died
  end

  private_class_method def self.attack(attacker, defender, registry)
    return if attacker['stamina'].to_f < 10

    attacker['stamina'] -= 10
    attacker_kws = (attacker['keywords'] || []).filter_map { |n| registry[n] }
    defender_kws = (defender['keywords'] || []).filter_map { |n| registry[n] }

    result   = calc_damage(attacker_kws, defender_kws, { 'physical' => 10.0 })
    total    = result[:total_damage].ceil
    res_key  = result[:life_resource] == 'mana' ? 'mana' : 'life'
    defender[res_key] = [(defender[res_key].to_f - total), 0].max

    # Lifesteal
    ls = attacker_kws.sum { |k| k.properties&.dig('lifesteal').to_f }
    if ls > 0
      healing       = (total * ls).ceil
      a_res         = get_life_resource(attacker_kws)
      a_key         = a_res == 'mana' ? 'mana' : 'life'
      attacker[a_key] = [attacker[a_key].to_f + healing, attacker["max_#{a_key}"].to_f].min
    end
  end

  # Flat +5 stamina and mana per turn (simplified from the real regen-scale system)
  private_class_method def self.apply_regen(entity)
    entity['stamina'] = [(entity['stamina'].to_f + 5), entity['max_stamina'].to_f].min
    entity['mana']    = [(entity['mana'].to_f + 5),    entity['max_mana'].to_f   ].min
  end

  private_class_method def self.dead?(entity, registry)
    kws     = (entity['keywords'] || []).filter_map { |n| registry[n] }
    res_key = get_life_resource(kws) == 'mana' ? 'mana' : 'life'
    entity[res_key].to_f <= 0
  end

  private_class_method def self.life_pct(entity, registry)
    kws     = (entity['keywords'] || []).filter_map { |n| registry[n] }
    res     = get_life_resource(kws)
    res_key = res == 'mana' ? 'mana' : 'life'
    max     = entity["max_#{res_key}"].to_f
    max.zero? ? 0.0 : entity[res_key].to_f / max
  end

  private_class_method def self.get_life_resource(keyword_objects)
    keyword_objects.each do |kw|
      lr = kw.properties&.dig('life_resource')
      return lr if lr
    end
    'life'
  end

  private_class_method def self.calc_damage(attacker_kws, defender_kws, base_damage)
    d = base_damage.transform_values(&:to_f)

    # Weapon base damage
    attacker_kws.select { |k| k.category == 'weapon' }.each do |wk|
      (wk.properties['base_damage_by_type'] || {}).each { |t, a| d[t] = (d[t] || 0.0) + a }
    end

    # Weapon multipliers
    attacker_kws.select { |k| k.category == 'weapon' }.each do |wk|
      applies = wk.properties['applies_to'] || []
      mult    = wk.properties['damage_multiplier'] || 1.0
      d.each { |t, a| d[t] = a * mult if applies.include?(t) }
    end

    # Damage output modifiers
    out = {}
    attacker_kws.each { |k| (k.properties['damage_output_by_type'] || {}).each { |t, m| out[t] = (out[t] || 1.0) * m } }
    d.each { |t, a| d[t] = a * (out[t] || 1.0) }

    # Global amplification
    amp = attacker_kws.reduce(1.0) { |a, k| a * (k.properties['damage_amplification'] || 1.0) }
    d.transform_values! { |v| v * amp }

    # Damage reduction
    red = {}
    defender_kws.each { |k| (k.properties['damage_reduction_by_type'] || {}).each { |t, m| red[t] = (red[t] || 1.0) * m } }
    d.each { |t, a| d[t] = a * (red[t] || 1.0) }

    { total_damage: d.values.sum, life_resource: get_life_resource(defender_kws) }
  end
end
