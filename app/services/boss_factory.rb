class BossFactory
  class << self
    def find_or_create(keyword_names)
      # Normalize keyword order for consistency
      sorted_names = keyword_names.sort
      keywords = BossKeyword.where(name: sorted_names).index_by(&:name)
      
      # Check if all keywords exist
      missing = sorted_names - keywords.keys
      raise ArgumentError, "Keywords not found: #{missing.join(', ')}" if missing.any?
      
      # Find existing boss with exact keyword combination
      boss = find_boss_by_keywords(keywords.values)
      
      if boss
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
      merged = {
        resistances: [],
        vulnerabilities: [],
        base_stats: {life: 100, mana: 100, endurance: 100, damage: 10, defense: 10},
        special: {},
        weapons: [],
        abilities: [],
      }

      level = keywords.count
      
      keywords.each do |keyword|
        attrs = keyword.properties.deep_symbolize_keys
        
        # Add resistances
        merged[:resistances] |= (attrs[:resistances] || [])
        
        # Add vulnerabilities
        merged[:vulnerabilities] |= (attrs[:vulnerabilities] || [])
        
        # Resistances cancel out vulnerabilities
        merged[:vulnerabilities] -= merged[:resistances]
        
        # Merge base stats (additive)
        (attrs[:multipliers] || {}).each do |stat, value|
          merged[:base_stats][stat] = (merged[:base_stats][stat] * value)
        end
        
        # Merge special attributes (last one wins for conflicts)
        merged[:special].merge!(attrs[:special] || {})
        
        # Track weapons
        merged[:weapons] << keyword.name if keyword.category == 'weapon'
      end
      
      merged
    end
  end
end
