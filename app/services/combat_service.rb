# CombatService owns all turn-resolution logic: action dispatch, damage application,
# boss AI, and per-turn regeneration.  Both GameController (live game) and
# RunSimulatorService (background simulation) call this service so they share one
# authoritative implementation.
#
# All methods operate on a mutable `game_status` hash with the following flat keys:
#   playerLife, playerStamina, playerMana
#   bossLife,   bossStamina,   bossMana
#   player  => full player hash (keywords, stats, …)
#   boss    => full boss hash   (keywords, stats, …)
#
# Action methods return the mutated game_status.
class CombatService
  # Damage values for each named spell.  Single source of truth — used by both
  # choose_boss_action (scoring) and cast (execution).
  SPELL_BASE_DAMAGE = {
    'magic_missile'    => { 'magic'     => 12 },
    'fire_bolt'        => { 'magic'     => 14 },
    'firebolt'         => { 'magic'     => 14 },
    'lightning_strike' => { 'lightning' => 15 },
    'light_bolt'       => { 'light'     => 12 },
  }.freeze

  # ── Public dispatch ────────────────────────────────────────────────────────

  # Dispatch any action string (including "cast:spell_name") for the given
  # action_taker against target.  Unknown action names are treated as
  # attack-category keyword lookups via execute_physical_attack; if still
  # unknown the game_status is returned unchanged.
  def self.apply_action(game_status, action_name, action_taker, target, payload = nil)
    if action_name.to_s.start_with?('cast:')
      _, spell = action_name.split(':', 2)
      return cast(game_status, action_taker, target, spell)
    end

    case action_name.to_s
    when 'cast'   then cast(game_status, action_taker, target, payload)
    when 'attack' then attack(game_status, action_taker, target)
    when 'guard'  then guard(game_status, action_taker, target)
    when 'heal'   then heal(game_status, action_taker, target)
    else
      # Handles whirlwind, stab, cleave, smash, piercing_arrow, and any future
      # attack-category keywords without needing an explicit case branch.
      execute_physical_attack(game_status, action_taker, target, action_name.to_s)
    end
  end

  # Returns true if action_name is dispatchable by apply_action.
  def self.known_action?(action_name)
    return true if action_name.to_s.start_with?('cast:')
    return true if %w[attack guard heal cast].include?(action_name.to_s)
    BossKeyword.exists?(name: action_name.to_s, category: 'attack')
  end

  # ── Boss AI ────────────────────────────────────────────────────────────────

  # Returns the action string the boss should take this turn, chosen by highest
  # expected damage across all available abilities.  Falls back to 'guard' when
  # no resource-affordable candidates exist.
  def self.choose_boss_action(game_status)
    boss_data    = game_status['boss']
    player_data  = game_status['player']
    boss_stamina = game_status['bossStamina'].to_f
    boss_mana    = game_status['bossMana'].to_f

    boss_abilities = Set.new
    (boss_data['keywords'] || []).each do |kw_name|
      kw = BossKeyword.find_by(name: kw_name)
      next unless kw
      (kw.properties&.dig('abilities') || []).each { |a| boss_abilities.add(a) }
    end

    candidates = []

    # Basic attack — always available if stamina allows
    if boss_stamina >= 10
      dmg = DamageCalculator.calculate_damage(boss_data, player_data, { 'physical' => 10 })[:total_damage]
      candidates << { action: 'attack', damage: dmg }
    end

    # Spells
    if boss_mana >= 10 && boss_abilities.include?('cast')
      spells = boss_abilities.reject { |a| a == 'cast' }.to_a
      if spells.any?
        spells.each do |spell|
          base = SPELL_BASE_DAMAGE[spell] || { 'magic' => 12 }
          dmg  = DamageCalculator.calculate_damage(boss_data, player_data, base)[:total_damage]
          candidates << { action: "cast:#{spell}", damage: dmg }
        end
      else
        dmg = DamageCalculator.calculate_damage(boss_data, player_data, { 'magic' => 12 })[:total_damage]
        candidates << { action: 'cast', damage: dmg }
      end
    end

    # Named attack-category abilities (whirlwind, smash, stab, cleave, etc.)
    boss_abilities.each do |ability|
      next if %w[cast attack guard].include?(ability)
      attack_kw = BossKeyword.find_by(name: ability, category: 'attack')
      next unless attack_kw
      attrs          = attack_kw.properties || {}
      stamina_needed = (attrs['stamina_cost'] || 10).to_f
      next unless boss_stamina >= stamina_needed
      hit_count  = (attrs['hit_count'] || 1).to_i
      base_dmg   = attrs['base_damage_by_type'] || { 'physical' => 10 }
      single_dmg = DamageCalculator.calculate_damage(boss_data, player_data, base_dmg)[:total_damage]
      candidates << { action: ability, damage: single_dmg * hit_count }
    end

    best = candidates.max_by { |c| c[:damage] }
    best ? best[:action] : 'guard'
  end

  # ── Regeneration ───────────────────────────────────────────────────────────

  # Apply end-of-turn resource regeneration for entity_key ('player' or 'boss').
  # mana_cost / stamina_cost indicate whether those resources were spent this turn,
  # which resets the regen accumulator for that resource.
  def self.apply_regeneration(game_status, entity_key, mana_cost:, stamina_cost:)
    entity_data = game_status[entity_key]
    return game_status unless entity_data

    entity_data['turns_since_mana_cost']    ||= 0
    entity_data['turns_since_stamina_cost'] ||= 0

    if mana_cost
      entity_data['turns_since_mana_cost'] = 0
    else
      entity_data['turns_since_mana_cost'] += 1
      turns   = entity_data['turns_since_mana_cost']
      base    = [5 * turns, 25].min
      regen   = (base * mana_regen_multiplier(entity_data)).floor
      if regen > 0
        mana_key = "#{entity_key}Mana"
        max_mana = get_max_resource(entity_data, 'mana')
        game_status[mana_key] = max_mana ? [game_status[mana_key] + regen, max_mana].min
                                         : game_status[mana_key] + regen
      end
    end

    if stamina_cost
      entity_data['turns_since_stamina_cost'] = 0
    else
      entity_data['turns_since_stamina_cost'] += 1
      turns         = entity_data['turns_since_stamina_cost']
      stamina_regen = 5 * turns
      stamina_regen += game_status["#{entity_key}StaminaRegenBonus"].to_i
      stamina_key   = "#{entity_key}Stamina"
      max_stamina   = get_max_resource(entity_data, 'stamina')
      game_status[stamina_key] = max_stamina ? [game_status[stamina_key] + stamina_regen, max_stamina].min
                                             : game_status[stamina_key] + stamina_regen
    end

    # Sync flat keys back into the entity object so next-turn reads are current
    entity_data['mana']    = game_status["#{entity_key}Mana"]
    entity_data['stamina'] = game_status["#{entity_key}Stamina"]

    game_status
  end

  # ── Action implementations ─────────────────────────────────────────────────

  def self.attack(game_status, action_taker = 'player', target = 'boss')
    stamina_key = "#{action_taker}Stamina"
    return game_status if game_status[stamina_key].nil? || game_status[stamina_key] < 10

    game_status[stamina_key] -= 10

    attacker_data = game_status[action_taker]
    defender_data = game_status[target]

    damage_result = DamageCalculator.calculate_damage(attacker_data, defender_data, { 'physical' => 10 })
    total_damage  = damage_result[:total_damage].ceil
    life_resource = damage_result[:life_resource]

    total_damage = (total_damage * 0.5).ceil if game_status["#{target}Guarding"]

    resource_key = "#{target}#{life_resource.capitalize}"
    game_status[resource_key] = [game_status[resource_key] - total_damage, 0].max

    apply_lifesteal(game_status, action_taker, attacker_data, total_damage)

    game_status
  end

  def self.guard(game_status, action_taker = 'player', _target = 'boss')
    game_status["#{action_taker}Guarding"]           = true
    game_status["#{action_taker}StaminaRegenBonus"]  = 5
    game_status
  end

  # Data-driven multi-hit physical attack driven by the attack-category keyword row.
  def self.execute_physical_attack(game_status, action_taker, target, ability_name)
    attack_kw = BossKeyword.find_by(name: ability_name, category: 'attack')
    return game_status unless attack_kw

    attrs        = attack_kw.properties || {}
    stamina_cost = (attrs['stamina_cost'] || 10).to_i
    hit_count    = (attrs['hit_count']    || 1).to_i
    base_damage  = attrs['base_damage_by_type'] || { 'physical' => 10 }
    force_next   = attrs['force_next_action']

    stamina_key = "#{action_taker}Stamina"
    return game_status if game_status[stamina_key].nil? || game_status[stamina_key] < stamina_cost

    game_status[stamina_key] -= stamina_cost

    attacker_data = game_status[action_taker]
    defender_data = game_status[target]

    # Resolve lifesteal and attacker life-resource once — shared across all hits
    lifesteal_amount       = 0
    attacker_life_resource = 'life'
    (attacker_data['keywords'] || []).each do |kw_name|
      kw = BossKeyword.find_by(name: kw_name)
      next unless kw
      lifesteal_amount       += kw.properties['lifesteal'].to_f if kw.properties['lifesteal']
      attacker_life_resource  = kw.properties['life_resource']  if kw.properties['life_resource']
    end

    hit_count.times do
      damage_result = DamageCalculator.calculate_damage(attacker_data, defender_data, base_damage.dup)
      hit_damage    = damage_result[:total_damage].ceil
      life_resource = damage_result[:life_resource]

      hit_damage = (hit_damage * 0.5).ceil if game_status["#{target}Guarding"]

      resource_key = "#{target}#{life_resource.capitalize}"
      game_status[resource_key] = [game_status[resource_key] - hit_damage, 0].max

      if lifesteal_amount > 0
        healing               = (hit_damage * lifesteal_amount).ceil
        attacker_resource_key = "#{action_taker}#{attacker_life_resource.capitalize}"
        attacker_max_key      = "max_#{attacker_life_resource}"
        game_status[attacker_resource_key] += healing
        if attacker_data[attacker_max_key]
          game_status[attacker_resource_key] = [game_status[attacker_resource_key], attacker_data[attacker_max_key]].min
        end
      end
    end

    game_status["#{action_taker}ForcedNextAction"] = force_next if force_next

    game_status
  end

  def self.cast(game_status, action_taker = 'player', target = 'boss', spell_name = nil)
    mana_key = "#{action_taker}Mana"
    return game_status if game_status[mana_key].nil? || game_status[mana_key] < 10

    game_status[mana_key] -= 10

    ability_damage = SPELL_BASE_DAMAGE[spell_name.to_s] || { 'magic' => 12 }

    attacker_data = game_status[action_taker]
    defender_data = game_status[target]

    damage_result = DamageCalculator.calculate_damage(attacker_data, defender_data, ability_damage)
    total_damage  = damage_result[:total_damage].ceil
    life_resource = damage_result[:life_resource]

    total_damage = (total_damage * 0.5).ceil if game_status["#{target}Guarding"]

    resource_key = "#{target}#{life_resource.capitalize}"
    game_status[resource_key] = [game_status[resource_key] - total_damage, 0].max

    game_status
  end

  def self.heal(game_status, action_taker = 'player', target = 'player')
    action_taker_data = game_status[action_taker]
    healing = if action_taker == 'boss' && action_taker_data.dig('stats', 'base_stats')
                action_taker_data['stats']['base_stats']['damage'].to_f * 2
              else
                action_taker_data['stats']['damage'].to_f * 2
              end

    target_data = game_status[target]
    is_undead   = Array(target_data['keywords']).include?('undead')
    life_key    = "#{target}Life"

    if is_undead
      game_status[life_key] = [game_status[life_key] - healing, 0].max
    else
      game_status[life_key] += healing
    end

    game_status
  end

  # ── Helpers ────────────────────────────────────────────────────────────────

  def self.mana_regen_multiplier(entity_data)
    (entity_data['keywords'] || []).each do |keyword_name|
      kw = BossKeyword.find_by(name: keyword_name)
      next unless kw
      m = kw.properties&.dig('mana_regen_multiplier')
      return m.to_f if m
    end
    1.0
  end

  def self.get_max_resource(entity_data, resource_name)
    entity_data["max_#{resource_name}"] ||
      entity_data.dig('stats', 'base_stats', resource_name)
  end

  private_class_method def self.apply_lifesteal(game_status, action_taker, attacker_data, damage_dealt)
    lifesteal_amount       = 0
    attacker_life_resource = 'life'

    (attacker_data['keywords'] || []).each do |kw_name|
      kw = BossKeyword.find_by(name: kw_name)
      next unless kw
      lifesteal_amount       += kw.properties['lifesteal'].to_f if kw.properties['lifesteal']
      attacker_life_resource  = kw.properties['life_resource']  if kw.properties['life_resource']
    end

    return unless lifesteal_amount > 0

    healing               = (damage_dealt * lifesteal_amount).ceil
    attacker_resource_key = "#{action_taker}#{attacker_life_resource.capitalize}"
    attacker_max_key      = "max_#{attacker_life_resource}"

    game_status[attacker_resource_key] += healing
    if attacker_data[attacker_max_key]
      game_status[attacker_resource_key] = [game_status[attacker_resource_key], attacker_data[attacker_max_key]].min
    end
  end
end
