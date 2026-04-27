class DamageCalculator
  # Physical damage sub-types that block and physical_immunity both negate.
  PHYSICAL_SUBTYPES = %w[physical slashing blunt piercing].freeze

  # Calculate typed damage following the complete pipeline
  def self.calculate_damage(attacker_data, defender_data, ability_damage, options = {})
    # 1. Start with ability's base damage composition
    damage_by_type = ability_damage.dup
    
    # 2. Add weapon base damage (if attacker has weapon keywords)
    weapon_keywords = get_weapon_keywords(attacker_data)
    weapon_keywords.each do |weapon_keyword|
      attrs = weapon_keyword.properties || {}
      base_damage = attrs['base_damage_by_type'] || {}
      base_damage.each do |type, amount|
        damage_by_type[type] = (damage_by_type[type] || 0) + amount
      end
    end
    
    # 3. Apply weapon multipliers (only to applicable damage types)
    weapon_keywords.each do |weapon_keyword|
      attrs = weapon_keyword.properties || {}
      applies_to = attrs['applies_to'] || []
      multiplier = attrs['damage_multiplier'] || 1.0
      
      damage_by_type.each do |type, amount|
        if applies_to.include?(type)
          damage_by_type[type] = amount * multiplier
        end
      end
    end
    
    # 4. Apply attacker's type-specific damage output modifiers
    attacker_output_mods = get_damage_output_by_type(attacker_data)
    damage_by_type.each do |type, amount|
      modifier = attacker_output_mods[type] || 1.0
      damage_by_type[type] = amount * modifier
    end
    
    # 5. Apply attacker's global damage amplification
    amplification = get_damage_amplification(attacker_data)
    damage_by_type.each do |type, amount|
      damage_by_type[type] = amount * amplification
    end

    # 5b. Apply active debuffs on defender that amplify incoming damage.
    #   fire_vulnerability — amplifies fire damage only (legacy, from web).
    #   vulnerability      — amplifies ALL incoming damage types (stacking, from apply_vulnerability/acid).
    if (debuffs = defender_data['active_debuffs'])
      debuffs.each do |debuff_name, data|
        case debuff_name
        when 'fire_vulnerability'
          mult = (data['multiplier'] || 1.5).to_f
          damage_by_type['fire'] = (damage_by_type['fire'] || 0) * mult if damage_by_type['fire']
        when 'vulnerability'
          mult = (data['multiplier'] || 1.25).to_f
          damage_by_type.each_key { |t| damage_by_type[t] = damage_by_type[t] * mult }
        end
      end
    end

    # 5c. Apply active buffs on defender that grant full immunity to a damage type.
    #     physical_immunity (from fly) zeroes all melee/physical damage flavours:
    #     physical, slashing, blunt, and piercing.  Magical and elemental types
    #     (magic, fire, ice, holy, dark, …) are intentionally not blocked.
    if (buffs = defender_data['active_buffs'])
      if buffs['physical_immunity'].to_i > 0
        PHYSICAL_SUBTYPES.each { |t| damage_by_type[t] = 0 if damage_by_type.key?(t) }
      end
    end

    # 5d. Block check — stacking block_chance keywords give a diminishing-returns
    #     chance to completely negate all physical-subtype damage for this hit.
    block_chance = get_block_chance(defender_data)
    if block_chance > 0 && rand < block_chance
      PHYSICAL_SUBTYPES.each { |t| damage_by_type[t] = 0 if damage_by_type.key?(t) }
    end

    # 5e. Evasion check — stacking evasion_chance keywords give a diminishing-returns
    #     chance to negate all incoming damage entirely for this hit.
    #     Exception: light damage cannot be evaded (it moves too fast to dodge).
    unless damage_by_type['light'].to_f > 0
      evasion_chance = get_evasion_chance(defender_data)
      if evasion_chance > 0 && rand < evasion_chance
        damage_by_type.each_key { |t| damage_by_type[t] = 0 }
      end
    end

    # Capture piercing total after attacker modifiers/immunity/block/evasion, but before
    # type reductions, so piercing penetration scales on what actually arrives.
    piercing_before_reduction = damage_by_type['piercing'].to_f

    # 6. Apply flat damage reduction first (additive from all keyword sources,
    #    applied once per hit since calculate_damage is called per-hit by
    #    multi-hit attacks).
    #    Piercing damage partially ignores flat DR: ceil(10% of piercing before
    #    defender reductions) is subtracted from the effective flat reduction.
    pre_reduction_total = damage_by_type.values.sum.to_f
    flat_reduction = get_flat_damage_reduction(defender_data)
    piercing_penetration = (piercing_before_reduction * 0.1).ceil
    effective_flat_reduction = [flat_reduction - piercing_penetration, 0].max
    after_flat_total = [pre_reduction_total - effective_flat_reduction, 0].max

    # Keep type proportions after flat reduction so per-type percentage reductions
    # can be applied after flat in the same hit.
    if pre_reduction_total > 0
      scale_after_flat = after_flat_total / pre_reduction_total
      damage_by_type.each do |type, amount|
        damage_by_type[type] = amount * scale_after_flat
      end
    else
      damage_by_type.each_key { |type| damage_by_type[type] = 0 }
    end

    # 7. Apply defender's incoming damage reduction by type AFTER flat reduction.
    #    options[:ignore_physical_reduction_fraction] (e.g. 0.5 for smash) causes
    #    physical-subtype reductions <1.0 to be partially bypassed on this hit.
    defender_reduction_mods = get_damage_reduction_by_type(defender_data)
    ignore_frac = options[:ignore_physical_reduction_fraction].to_f
    damage_by_type.each do |type, amount|
      modifier = defender_reduction_mods[type] || 1.0
      if ignore_frac > 0 && PHYSICAL_SUBTYPES.include?(type) && modifier < 1.0
        # Pull the modifier back toward 1.0 by the ignore fraction
        modifier = modifier + (1.0 - modifier) * ignore_frac
      end
      damage_by_type[type] = amount * modifier
    end

    # 8. Sum all damage types for total damage
    total_damage = damage_by_type.values.sum

    # 9. Determine which resource to damage
    life_resource = get_life_resource(defender_data)
    
    {
      total_damage: total_damage,
      damage_by_type: damage_by_type,
      life_resource: life_resource
    }
  end
  
  private
  
  def self.get_weapon_keywords(entity_data)
    keywords = entity_data['keywords'] || []
    keywords.map { |name| BossKeyword.find_by(name: name, category: 'weapon') }.compact
  end
  
  def self.get_damage_output_by_type(entity_data)
    result = {}
    keywords = entity_data['keywords'] || []
    
    keywords.each do |keyword_name|
      keyword = BossKeyword.find_by(name: keyword_name)
      next unless keyword
      
      attrs = keyword.properties || {}
      output_mods = attrs['damage_output_by_type'] || {}
      output_mods.each do |type, mod|
        # Multiply modifiers together (they stack)
        result[type] = (result[type] || 1.0) * mod
      end
    end
    
    result
  end
  
  def self.get_damage_amplification(entity_data)
    amplification = 1.0
    keywords = entity_data['keywords'] || []
    
    keywords.each do |keyword_name|
      keyword = BossKeyword.find_by(name: keyword_name)
      next unless keyword
      
      attrs = keyword.properties || {}
      amp = attrs['damage_amplification'] || 1.0
      amplification *= amp
    end
    
    amplification
  end
  
  def self.get_damage_reduction_by_type(entity_data)
    result = {}
    keywords = entity_data['keywords'] || []
    
    keywords.each do |keyword_name|
      keyword = BossKeyword.find_by(name: keyword_name)
      next unless keyword
      
      attrs = keyword.properties || {}
      reduction_mods = attrs['damage_reduction_by_type'] || {}
      reduction_mods.each do |type, mod|
        # Multiply modifiers together (they stack)
        result[type] = (result[type] || 1.0) * mod
      end
    end
    
    result
  end
  
  def self.get_life_resource(entity_data)
    keywords = entity_data['keywords'] || []
    
    keywords.each do |keyword_name|
      keyword = BossKeyword.find_by(name: keyword_name)
      next unless keyword
      
      attrs = keyword.properties || {}
      if attrs['life_resource']
        return attrs['life_resource']
      end
    end
    
    'life' # default
  end

  # Combines per-keyword block_chance values with diminishing returns:
  #   combined = 1 - (1 - base)^n
  # All block keywords are expected to share the same base value (0.05).
  def self.get_block_chance(entity_data)
    base = 0.0
    count = 0
    (entity_data['keywords'] || []).each do |kw_name|
      kw = BossKeyword.find_by(name: kw_name)
      next unless kw
      bc = (kw.properties || {})['block_chance'].to_f
      next unless bc > 0
      base  = bc
      count += 1
    end
    return 0.0 if count.zero?
    1.0 - (1.0 - base)**count
  end

  # Same diminishing-returns stacking as block, applied to all damage types.
  def self.get_evasion_chance(entity_data)
    base = 0.0
    count = 0
    (entity_data['keywords'] || []).each do |kw_name|
      kw = BossKeyword.find_by(name: kw_name)
      next unless kw
      ec = (kw.properties || {})['evasion_chance'].to_f
      next unless ec > 0
      base  = ec
      count += 1
    end
    return 0.0 if count.zero?
    1.0 - (1.0 - base)**count
  end

  # Flat damage reduction is additive across all keyword sources.
  def self.get_flat_damage_reduction(entity_data)
    total = 0.0
    (entity_data['keywords'] || []).each do |kw_name|
      kw = BossKeyword.find_by(name: kw_name)
      next unless kw
      total += (kw.properties || {})['flat_damage_reduction'].to_f
    end
    total
  end
end
