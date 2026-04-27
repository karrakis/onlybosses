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
      kw = BossKeyword.find_by(name: action_name.to_s)
      if kw&.category == 'ability'
        apply_ability(game_status, action_taker, target, action_name.to_s)
      else
        # Handles whirlwind, stab, cleave, smash, piercing_arrow, and any future
        # attack-category keywords without needing an explicit case branch.
        execute_physical_attack(game_status, action_taker, target, action_name.to_s)
      end
    end
  end

  # Returns true if action_name is dispatchable by apply_action.
  def self.known_action?(action_name)
    return true if action_name.to_s.start_with?('cast:')
    return true if %w[attack guard heal cast].include?(action_name.to_s)
    BossKeyword.exists?(name: action_name.to_s, category: %w[attack ability])
  end

  # ── Boss AI ────────────────────────────────────────────────────────────────

  # Returns the action string the boss should take this turn.
  def self.choose_boss_action(game_status)
    choose_action_for(game_status, 'boss', 'player')
  end

  # Returns the action string the player should take this turn.
  # Mirrors choose_boss_action exactly so any new ability type is automatically
  # available to both sides without separate maintenance.
  def self.choose_player_action(game_status)
    choose_action_for(game_status, 'player', 'boss')
  end

  # Canonical full-round resolver used by both the live game and the simulator.
  # This is the single source of truth for turn sequencing:
  #   player action -> boss death check -> boss action -> player death check
  #   -> boss regen -> player regen -> effect ticks -> final death checks.
  #
  # Returns a hash:
  #   :game_status            mutated game status
  #   :boss_action            action boss took this round (or nil if boss died first)
  #   :forced_player_action   forced follow-up set for player's next turn
  #   :forced_boss_action     forced follow-up set for boss's next turn
  #   :player_after_player_action  snapshot of player's resources right after player action
  #   :player_died, :boss_died
  def self.resolve_round(game_status, player_action:, player_payload: nil, forced_player_action: nil, forced_boss_action: nil, boss_action_resolver: nil)
    player_action_used = forced_player_action || player_action
    player_payload     = nil if forced_player_action

    player_mana_turn_start    = game_status['playerMana']
    player_stamina_turn_start = game_status['playerStamina']

    # Player turn
    apply_action(game_status, player_action_used, 'player', 'boss', player_payload)
    next_forced_player = game_status.delete('playerForcedNextAction')

    player_after_player_action = {
      'life'    => game_status['playerLife'],
      'stamina' => game_status['playerStamina'],
      'mana'    => game_status['playerMana']
    }

    # Boss can die to the player action before taking a turn
    if entity_dead?(game_status, 'boss')
      player_mana_cost    = game_status['playerMana']    < player_mana_turn_start
      player_stamina_cost = game_status['playerStamina'] < player_stamina_turn_start
      apply_regeneration(game_status, 'player', mana_cost: player_mana_cost, stamina_cost: player_stamina_cost)
      tick_entity_effects(game_status, 'player')
      tick_entity_effects(game_status, 'boss')

      return {
        game_status: game_status,
        boss_action: nil,
        forced_player_action: nil,
        forced_boss_action: forced_boss_action,
        player_after_player_action: player_after_player_action,
        player_died: entity_dead?(game_status, 'player'),
        boss_died: true
      }
    end

    # Boss turn
    boss_action = forced_boss_action || (boss_action_resolver ? boss_action_resolver.call(game_status) : choose_boss_action(game_status))
    next_forced_boss = nil
    if known_action?(boss_action)
      boss_mana_before    = game_status['bossMana']
      boss_stamina_before = game_status['bossStamina']

      apply_action(game_status, boss_action, 'boss', 'player')
      next_forced_boss = game_status.delete('bossForcedNextAction')

      # Death resolves immediately on incoming damage (before regen/ticks)
      if entity_dead?(game_status, 'player')
        return {
          game_status: game_status,
          boss_action: boss_action,
          forced_player_action: next_forced_player,
          forced_boss_action: next_forced_boss,
          player_after_player_action: player_after_player_action,
          player_died: true,
          boss_died: false
        }
      end

      boss_mana_cost    = game_status['bossMana']    < boss_mana_before
      boss_stamina_cost = game_status['bossStamina'] < boss_stamina_before
      apply_regeneration(game_status, 'boss', mana_cost: boss_mana_cost, stamina_cost: boss_stamina_cost)
    end

    # Player end-of-turn regen and round-end effect ticking
    player_mana_cost    = game_status['playerMana']    < player_mana_turn_start
    player_stamina_cost = game_status['playerStamina'] < player_stamina_turn_start
    apply_regeneration(game_status, 'player', mana_cost: player_mana_cost, stamina_cost: player_stamina_cost)

    tick_entity_effects(game_status, 'player')
    tick_entity_effects(game_status, 'boss')

    {
      game_status: game_status,
      boss_action: boss_action,
      forced_player_action: next_forced_player,
      forced_boss_action: next_forced_boss,
      player_after_player_action: player_after_player_action,
      player_died: entity_dead?(game_status, 'player'),
      boss_died: entity_dead?(game_status, 'boss')
    }
  end

  # ── Abilities (buff/debuff, non-damaging) ─────────────────────────────────

  # Execute an ability-category keyword action.  Applies stamina cost, cooldown,
  # negation checks, then buffs on the caster and debuffs/forced-actions on the target.
  # If negated the stamina is still spent (the attempt was made).
  def self.apply_ability(game_status, action_taker, target, ability_name)
    kw = BossKeyword.find_by(name: ability_name, category: 'ability')
    return game_status unless kw

    attrs        = kw.properties || {}
    stamina_cost = (attrs['stamina_cost'] || 10).to_i
    cooldown_val = (attrs['cooldown']     || 0).to_i
    stamina_key  = "#{action_taker}Stamina"

    return game_status if game_status[stamina_key].to_i < stamina_cost

    caster_data = game_status[action_taker]
    target_data = game_status[target]

    caster_data['cooldowns'] ||= {}
    return game_status if caster_data['cooldowns'][ability_name].to_i > 0

    # Spend stamina before negation check — the attempt was made regardless
    game_status[stamina_key] -= stamina_cost

    # Negation checks
    if (neg = attrs['negation_check'])
      negated = false
      if neg['target_has_property']
        prop = neg['target_has_property']
        negated = (target_data['keywords'] || []).any? do |kw_name|
          BossKeyword.find_by(name: kw_name)&.properties&.dig(prop)
        end
      end
      if !negated && neg['target_has_ability_immunity']
        immunity = neg['target_has_ability_immunity']
        negated = target_has_ability_immunity?(target_data, immunity)
      end
      return game_status if negated
    end

    # Set cooldown on caster
    caster_data['cooldowns'][ability_name] = cooldown_val if cooldown_val > 0

    # Caster effects (buffs)
    if (caster_fx = attrs['on_success_caster'])
      if (buff = caster_fx['add_buff'])
        caster_data['active_buffs'] ||= {}
        caster_data['active_buffs'][buff['name']] = buff['turns'].to_i
      end
    end

    # Target effects (forced action + debuffs)
    if (target_fx = attrs['on_success_target'])
      if (force = target_fx['force_action'])
        game_status["#{target}ForcedNextAction"] = force
      end
      if (debuff = target_fx['add_debuff'])
        apply_debuff(target_data, debuff)
      end
    end

    game_status
  end

  # Tick buffs, debuffs, and cooldowns on one entity at end of round.
  # Call once per entity per round (after both sides have acted and regen'd).
  #
  # Supported debuff properties (set on the debuff data hash):
  #   damage_per_turn  - deal this much flat damage of damage_type each tick
  #   per_turn_debuff  - apply a nested debuff hash each tick while this debuff is active
  #   turns: -1        - permanent; never expires (used for vulnerability stacks)
  def self.tick_entity_effects(game_status, entity_key)
    entity = game_status[entity_key]
    return game_status unless entity

    if (buffs = entity['active_buffs'])
      buffs.transform_values! { |t| t - 1 }
      buffs.reject! { |_, t| t <= 0 }
    end

    if (debuffs = entity['active_debuffs'])
      # DoT and per-turn side effects fire before the turn counter decrements
      debuffs.each do |_name, data|
        # Damage-over-time (poison, burning, etc.)
        if (dot = data['damage_per_turn'].to_f) > 0
          dmg_type    = data['damage_type'] || 'physical'
          life_res    = DamageCalculator.get_life_resource(entity)
          life_key    = "#{entity_key}#{life_res.capitalize}"
          game_status[life_key] = [game_status[life_key].to_f - dot, 0].max
        end

        # Per-turn secondary debuff (acid applies a vulnerability stack each round)
        if (inner = data['per_turn_debuff'])
          apply_debuff(entity, inner)
        end
      end

      # Tick durations — permanent debuffs (turns == -1) are skipped
      debuffs.each do |name, data|
        next if data['turns'].to_i == -1
        debuffs[name] = data.merge('turns' => data['turns'].to_i - 1)
      end
      debuffs.reject! { |_, data| data['turns'].to_i != -1 && data['turns'].to_i <= 0 }
    end

    if (cooldowns = entity['cooldowns'])
      cooldowns.transform_values! { |t| [t - 1, 0].max }
      cooldowns.reject! { |_, t| t <= 0 }
    end

    game_status
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

    # regenerate_health passive — always restores actual life, never the life_resource
    # substitute (e.g. ethereal entities use mana as their life pool, but health
    # regeneration still applies to life — mana has its own regen path above).
    regen_hp = health_regen_amount(entity_data)
    if regen_hp > 0
      life_key = "#{entity_key}Life"
      max_life = get_max_resource(entity_data, 'life')
      game_status[life_key] = max_life ? [game_status[life_key].to_f + regen_hp, max_life].min
                                       : game_status[life_key].to_f + regen_hp
    end

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
  # Supports: stamina_cost, mana_cost, cooldown, hit_count, base_damage_by_type,
  # force_next_action, ignore_physical_reduction_fraction, lifesteal, apply_debuff.
  def self.execute_physical_attack(game_status, action_taker, target, ability_name)
    attack_kw = BossKeyword.find_by(name: ability_name, category: 'attack')
    return game_status unless attack_kw

    attrs        = attack_kw.properties || {}
    stamina_cost = (attrs['stamina_cost'] || 10).to_i
    mana_cost    = (attrs['mana_cost']    || 0).to_i
    cooldown_val = (attrs['cooldown']     || 0).to_i
    hit_count    = (attrs['hit_count']    || 1).to_i
    base_damage  = attrs['base_damage_by_type'] || { 'physical' => 10 }
    force_next   = attrs['force_next_action']
    attack_options = {}
    if (frac = attrs['ignore_physical_reduction_fraction'])
      attack_options[:ignore_physical_reduction_fraction] = frac.to_f
    end

    stamina_key = "#{action_taker}Stamina"
    mana_key    = "#{action_taker}Mana"
    
    # Check resources
    return game_status if game_status[stamina_key].nil? || game_status[stamina_key] < stamina_cost
    return game_status if mana_cost > 0 && (game_status[mana_key].nil? || game_status[mana_key] < mana_cost)

    attacker_data = game_status[action_taker]
    
    # Check cooldown
    attacker_data['cooldowns'] ||= {}
    return game_status if attacker_data['cooldowns'][ability_name].to_i > 0

    # Spend resources
    game_status[stamina_key] -= stamina_cost
    game_status[mana_key] -= mana_cost if mana_cost > 0

    # Set cooldown
    attacker_data['cooldowns'][ability_name] = cooldown_val if cooldown_val > 0

    defender_data = game_status[target]

    # Resolve lifesteal: keyword-based + attack-based
    lifesteal_amount       = (attrs['lifesteal'] || 0).to_f  # attack-local lifesteal
    attacker_life_resource = 'life'
    (attacker_data['keywords'] || []).each do |kw_name|
      kw = BossKeyword.find_by(name: kw_name)
      next unless kw
      lifesteal_amount       += kw.properties['lifesteal'].to_f if kw.properties['lifesteal']
      attacker_life_resource  = kw.properties['life_resource']  if kw.properties['life_resource']
    end

    hit_count.times do
      damage_result = DamageCalculator.calculate_damage(attacker_data, defender_data, base_damage.dup, attack_options)
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

    # Apply attack-local debuff if present
    if (debuff = attrs['apply_debuff'])
      apply_debuff(defender_data, debuff)
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

    apply_spell_leech(game_status, action_taker, attacker_data, total_damage)

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

  # True when the entity's active life resource (life or mana) is <= 0.
  private_class_method def self.entity_dead?(game_status, entity_key)
    entity = game_status[entity_key]
    return false unless entity
    res_key = DamageCalculator.get_life_resource(entity)
    game_status["#{entity_key}#{res_key.capitalize}"].to_f <= 0
  end

  # Sum of regenerate_health passive values across all keywords, multiplied by life_regen multiplier.
  private_class_method def self.health_regen_amount(entity_data)
    total = 0
    (entity_data['keywords'] || []).each do |kw_name|
      kw = BossKeyword.find_by(name: kw_name)
      next unless kw
      total += kw.properties['regenerate_health'].to_f if kw.properties&.dig('regenerate_health')
    end
    
    # Apply life_regen multiplier from passives
    regen_mult = entity_data['life_regen_multiplier'] || 1.0
    (total * regen_mult).to_f
  end

  # Apply stacking or non-stacking debuff to an entity's active_debuffs hash.
  # Stacking vulnerability: multipliers compound multiplicatively; turns is kept
  # at the highest value (or -1 if either stack is permanent).
  private_class_method def self.apply_debuff(entity_data, debuff)
    entity_data['active_debuffs'] ||= {}
    name    = debuff['name']
    turns   = debuff['turns'].to_i
    existing = entity_data['active_debuffs'][name]

    if debuff['stacking'] && existing
      # Compound multipliers; permanent (-1) wins over any finite duration
      old_mult = (existing['multiplier'] || 1.0).to_f
      new_mult = (debuff['multiplier']   || 1.0).to_f
      old_turns = existing['turns'].to_i
      entity_data['active_debuffs'][name] = existing.merge(
        'multiplier' => old_mult * new_mult,
        'stacking'   => true,
        'turns'      => (old_turns == -1 || turns == -1) ? -1 : [old_turns, turns].max
      )
    else
      entity_data['active_debuffs'][name] = {
        'turns'           => turns,
        'multiplier'      => debuff['multiplier'],
        'damage_per_turn' => debuff['damage_per_turn'],
        'damage_type'     => debuff['damage_type'],
        'per_turn_debuff' => debuff['per_turn_debuff'],
        'stacking'        => debuff['stacking']
      }.compact
    end
  end

  # Apply spell_leech (heals caster based on spell damage dealt).
  private_class_method def self.apply_spell_leech(game_status, action_taker, attacker_data, damage_dealt)
    leech = 0.0
    attacker_life_resource = 'life'
    (attacker_data['keywords'] || []).each do |kw_name|
      kw = BossKeyword.find_by(name: kw_name)
      next unless kw
      leech                 += kw.properties['spell_leech'].to_f  if kw.properties&.dig('spell_leech')
      attacker_life_resource = kw.properties['life_resource']     if kw.properties&.dig('life_resource')
    end
    return unless leech > 0

    healing               = (damage_dealt * leech).ceil
    attacker_resource_key = "#{action_taker}#{attacker_life_resource.capitalize}"
    attacker_max_key      = "max_#{attacker_life_resource}"
    game_status[attacker_resource_key] = game_status[attacker_resource_key].to_f + healing
    if attacker_data[attacker_max_key]
      game_status[attacker_resource_key] = [game_status[attacker_resource_key], attacker_data[attacker_max_key]].min
    end
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

  # Shared AI action scorer.  Both choose_boss_action and choose_player_action
  # delegate here so every new ability type is automatically available to both sides.
  private_class_method def self.choose_action_for(game_status, actor_key, target_key)
    actor_data  = game_status[actor_key]
    target_data = game_status[target_key]
    stamina_cap = actor_key == 'player' ? game_status['playerStamina'].to_f : game_status['bossStamina'].to_f
    mana_cap    = actor_key == 'player' ? game_status['playerMana'].to_f    : game_status['bossMana'].to_f

    abilities = Set.new
    (actor_data['keywords'] || []).each do |kw_name|
      kw = BossKeyword.find_by(name: kw_name)
      next unless kw
      abilities.add(kw_name) if kw.category == 'attack'
      (kw.properties&.dig('abilities') || []).each { |a| abilities.add(a) }
    end

    candidates = []

    # Basic attack
    if stamina_cap >= 10
      dmg = DamageCalculator.calculate_damage(actor_data, target_data, { 'physical' => 10 })[:total_damage]
      candidates << { action: 'attack', damage: dmg }
    end

    # Spells
    if mana_cap >= 10 && abilities.include?('cast')
      spells = abilities.reject { |a| a == 'cast' }.to_a
      if spells.any?
        spells.each do |spell|
          base = SPELL_BASE_DAMAGE[spell] || { 'magic' => 12 }
          dmg  = DamageCalculator.calculate_damage(actor_data, target_data, base)[:total_damage]
          candidates << { action: "cast:#{spell}", damage: dmg }
        end
      else
        dmg = DamageCalculator.calculate_damage(actor_data, target_data, { 'magic' => 12 })[:total_damage]
        candidates << { action: 'cast', damage: dmg }
      end
    end

    # Named abilities (attack-category and ability-category)
    abilities.each do |ability|
      next if %w[cast attack guard].include?(ability)

      # Attack-category: scored by expected damage
      attack_kw = BossKeyword.find_by(name: ability, category: 'attack')
      if attack_kw
        attrs = attack_kw.properties || {}
        next unless stamina_cap >= (attrs['stamina_cost'] || 10).to_f
        next unless mana_cap >= (attrs['mana_cost'] || 0).to_f
        next if (actor_data['cooldowns'] || {})[ability].to_i > 0
        hit_count  = (attrs['hit_count'] || 1).to_i
        base_dmg   = attrs['base_damage_by_type'] || { 'physical' => 10 }
        single_dmg = DamageCalculator.calculate_damage(actor_data, target_data, base_dmg)[:total_damage]
        candidates << { action: ability, damage: single_dmg * hit_count }
        next
      end

      # Ability-category: scored by ai_utility_score, subject to cooldown + negation
      ability_kw = BossKeyword.find_by(name: ability, category: 'ability')
      next unless ability_kw
      attrs = ability_kw.properties || {}
      next unless stamina_cap >= (attrs['stamina_cost'] || 10).to_f
      next if (actor_data['cooldowns'] || {})[ability].to_i > 0
      next if ability_negated?(attrs['negation_check'], target_data)
      candidates << { action: ability, damage: (attrs['ai_utility_score'] || 10).to_f }
    end

    best = candidates.max_by { |c| c[:damage] }
    best ? best[:action] : 'guard'
  end

  # Returns true if the ability should be suppressed given current target state.
  private_class_method def self.ability_negated?(negation_check, target_data)
    return false unless negation_check
    if negation_check['target_has_property']
      prop = negation_check['target_has_property']
      return true if (target_data['keywords'] || []).any? { |kn| BossKeyword.find_by(name: kn)&.properties&.dig(prop) }
    end
    if negation_check['target_has_ability_immunity']
      immunity = negation_check['target_has_ability_immunity']
      return true if target_has_ability_immunity?(target_data, immunity)
    end
    false
  end

  # Returns true if any keyword on the target grants immunity to the named ability.
  private_class_method def self.target_has_ability_immunity?(target_data, ability_name)
    (target_data['keywords'] || []).any? do |kw_name|
      kw = BossKeyword.find_by(name: kw_name)
      (kw&.properties&.dig('ability_immunities') || []).include?(ability_name)
    end
  end
end
