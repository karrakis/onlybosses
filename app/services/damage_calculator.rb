class DamageCalculator
  # Calculate typed damage following the complete pipeline
  def self.calculate_damage(attacker_data, defender_data, ability_damage)
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

    # 5b. Apply active debuffs on defender that amplify incoming damage by type.
    #     (e.g. fire_vulnerability from web adds a multiplier to fire damage)
    if (debuffs = defender_data['active_debuffs'])
      debuffs.each do |debuff_name, data|
        case debuff_name
        when 'fire_vulnerability'
          mult = (data['multiplier'] || 1.5).to_f
          damage_by_type['fire'] = (damage_by_type['fire'] || 0) * mult if damage_by_type['fire']
        end
      end
    end

    # 5c. Apply active buffs on defender that grant full immunity to a damage type.
    #     physical_immunity (from fly) zeroes all melee/physical damage flavours:
    #     physical, slashing, blunt, and piercing.  Magical and elemental types
    #     (magic, fire, ice, holy, dark, …) are intentionally not blocked.
    PHYSICAL_SUBTYPES = %w[physical slashing blunt piercing].freeze
    if (buffs = defender_data['active_buffs'])
      if buffs['physical_immunity'].to_i > 0
        PHYSICAL_SUBTYPES.each { |t| damage_by_type[t] = 0 if damage_by_type.key?(t) }
      end
    end

    # 6. Apply defender's incoming damage reduction by type
    defender_reduction_mods = get_damage_reduction_by_type(defender_data)
    damage_by_type.each do |type, amount|
      modifier = defender_reduction_mods[type] || 1.0
      damage_by_type[type] = amount * modifier
    end
    
    # 7. Sum all damage types for total damage
    total_damage = damage_by_type.values.sum
    
    # 8. Determine which resource to damage
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
end
