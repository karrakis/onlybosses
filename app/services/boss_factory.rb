class BossFactory
  class << self
    def find_or_create(keyword_names)
      # Normalize keyword order for consistency
      sorted_names = keyword_names.sort
      keywords = BossKeyword.where(name: sorted_names).index_by(&:name)
      
      # Check if all keywords exist
      missing = sorted_names - keywords.keys
      raise ArgumentError, "Keywords not found: #{missing.join(', ')}" if missing.any?
      
      puts "Looking for boss with keywords: #{keywords.values.map(&:name).join(', ')}"
      puts "Keyword IDs: #{keywords.values.map(&:id).sort.inspect}"
      
      # Find existing boss with exact keyword combination
      boss = find_boss_by_keywords(keywords.values)
      
      if boss
        puts "FOUND EXISTING BOSS: #{boss.id} - #{boss.name}"
        # Boss exists - check if image needs generation
        if boss.image.attached?
          return boss
        else
          # Trigger image generation if not already in progress
          unless boss.image_generation_status == 'generating'
            GenerateBossImageJob.perform_later(boss.id)
          end
          return boss
        end
      end
      
      # Create new boss
      puts "NO EXISTING BOSS FOUND - Creating new boss"
      boss = create_boss_with_keywords(keywords.values)
      GenerateBossImageJob.perform_later(boss.id)
      
      boss
    end
    
    private
    
    def find_boss_by_keywords(keywords)
      Boss.joins(:boss_keywords)
          .group('bosses.id')
          .having('array_agg(boss_keywords.id ORDER BY boss_keywords.id) = ARRAY[?]::bigint[]', 
                  keywords.map(&:id).sort)
          .first
    end
    
    def create_boss_with_keywords(keywords)
        puts "Creating boss with keywords: #{keywords.map(&:name).join(', ')}"
      boss = Boss.create!(
        name: generate_name(keywords),
        computed_stats: compute_stats(keywords)
      )
      
      keywords.each_with_index do |keyword, index|
        BossKeywordAssociation.create!(
          boss: boss,
          boss_keyword: keyword,
          position: index
        )
      end
      
      boss
    end
    
    def generate_name(keywords)
      keywords.map(&:name).map(&:titleize).join(' ')
    end
    
    def compute_stats(keywords)
      puts "Computing stats for keywords: #{keywords.map(&:name).join(', ')}"
      
      # Start with base resource pools
      base_life = 100
      base_stamina = 100
      base_mana = 100
      
      # Track multipliers
      life_mult = 1.0
      stamina_mult = 1.0
      mana_mult = 1.0
      
      # Track collections
      resistances = []
      vulnerabilities = []
      passives = []
      abilities = []
      weapons = []
      
      keywords.each do |keyword|
        puts "Processing keyword: #{keyword.name}"
        
        attrs = keyword.properties || {}
        
        # Apply resource multipliers
        if attrs['multipliers']
          life_mult *= (attrs['multipliers']['life'] || 1.0)
          stamina_mult *= (attrs['multipliers']['stamina'] || 1.0)
          mana_mult *= (attrs['multipliers']['mana'] || 1.0)
        end
        
        # Convert old resistances/vulnerabilities to damage_reduction_by_type
        # (This is for backwards compatibility during transition)
        if attrs['resistances']
          resistances |= attrs['resistances']
        end
        
        if attrs['vulnerabilities']
          vulnerabilities |= attrs['vulnerabilities']
        end
        
        # Track passives and abilities
        passives |= (keyword.passives || [])
        abilities |= (keyword.abilities || [])
        
        # Track weapons
        weapons << keyword.name if keyword.category == 'weapon'
      end
      
      # Cancel resistances with vulnerabilities
      vulnerabilities -= resistances
      
      # Calculate final resource pools
      final_life = (base_life * life_mult).ceil
      final_stamina = (base_stamina * stamina_mult).ceil
      final_mana = (base_mana * mana_mult).ceil
      
      puts "Final stats - Life: #{final_life}, Stamina: #{final_stamina}, Mana: #{final_mana}"
      
      {
        base_stats: {
          life: final_life,
          stamina: final_stamina,
          mana: final_mana,
          damage: 10,  # Legacy - will be removed when we implement abilities
          defense: 10  # Legacy - will be removed when we implement abilities
        },
        resistances: resistances,
        vulnerabilities: vulnerabilities,
        passives: passives,
        abilities: abilities,
        weapons: weapons,
        special: {}
      }
    end
  end
end
