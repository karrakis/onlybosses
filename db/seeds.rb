# This file should contain all the record creation needed to seed the database with its default values.
# The data can then be loaded with the bin/rails db:seed command (or created alongside the database with db:setup).

# Boss Keywords
keywords_data = [
  # Creatures
  { 
    name: "skeleton", 
    category: "creature", 
    rarity: 1, 
    attributes: {
      "passives" => ["armoured","fragile"], 
      "abilities" => [],
      "multipliers" => { "life" => 0.8, "stamina" => 0.8, "mana" => 1.5 },
      "damage_output_by_type" => { "physical" => 0.9 },
      "damage_amplification" => 1.0,
      "damage_reduction_by_type" => {
        "piercing" => 0.5,
        "dark" => 0.5,
        "blunt" => 1.5,
        "light" => 1.5,
        "holy" => 1.5
      }
    }
  },
  { 
    name: "octopus", 
    category: "creature", 
    rarity: 2, 
    attributes: {
      "passives" => ["mindshield"], 
      "abilities" => [],
      "multipliers" => { "life" => 1.2, "stamina" => 1.0, "mana" => 1.5 },
      "damage_output_by_type" => { "physical" => 1.3 },
      "damage_amplification" => 1.0,
      "damage_reduction_by_type" => {
        "blunt" => 0.5,
        "fire" => 1.5,
        "lightning" => 1.5
      }
    }
  },
  { 
    name: "dragon", 
    category: "creature", 
    rarity: 3, 
    attributes: {
      "passives" => ["amplify"], 
      "abilities" => [],
      "multipliers" => { "life" => 2.0, "stamina" => 1.5, "mana" => 1.3 },
      "damage_output_by_type" => { "physical" => 1.8, "fire" => 1.5 },
      "damage_amplification" => 1.2,
      "damage_reduction_by_type" => {
        "physical" => 0.7,
        "fire" => 0.2,
        "piercing" => 0.5,
        "ice" => 1.5
      }
    }
  },
  { 
    name: "golem", 
    category: "creature", 
    rarity: 2, 
    attributes: {
      "passives" => ["armoured","squishy"], 
      "abilities" => [],
      "multipliers" => { "life" => 1.5, "stamina" => 0.9, "mana" => 0.5 },
      "damage_output_by_type" => { "physical" => 1.2, "blunt" => 1.3 },
      "damage_amplification" => 1.0,
      "damage_reduction_by_type" => {
        "piercing" => 0.3,
        "slashing" => 0.3,
        "blunt" => 0.4,
        "magic" => 1.5,
        "lightning" => 1.5
      }
    }
  },
  { 
    name: "ghost", 
    category: "creature", 
    rarity: 2, 
    attributes: {
      "passives" => ["ethereal"], 
      "abilities" => [],
      "life_resource" => "mana",
      "multipliers" => { "life" => 0.0, "stamina" => 0.6, "mana" => 3.0 },
      "damage_output_by_type" => { "physical" => 0.1, "dark" => 1.5, "magic" => 1.3 },
      "damage_amplification" => 1.0,
      "damage_reduction_by_type" => {
        "physical" => 0.1,
        "holy" => 2.0,
        "light" => 1.8
      }
    }
  },
  { 
    name: "vampire", 
    category: "creature", 
    rarity: 3, 
    attributes: {
      "passives" => ["leech"], 
      "abilities" => ["bite"],
      "multipliers" => { "life" => 1.3, "stamina" => 1.3, "mana" => 1.2 },
      "damage_output_by_type" => { "physical" => 1.2, "dark" => 1.4 },
      "damage_amplification" => 1.1,
      "damage_reduction_by_type" => {
        "dark" => 0.3,
        "holy" => 2.0,
        "fire" => 1.5,
        "light" => 1.5
      }
    }
  },
  { 
    name: "goat", 
    category: "creature", 
    rarity: 1, 
    attributes: {
      "passives" => ["lucky"], 
      "abilities" => [],
      "multipliers" => { "life" => 1.0, "stamina" => 1.2, "mana" => 0.8 },
      "damage_output_by_type" => { "physical" => 0.9, "blunt" => 1.1 },
      "damage_amplification" => 1.0,
      "damage_reduction_by_type" => {
        "slashing" => 1.3
      }
    }
  },
  { 
    name: "human", 
    category: "creature", 
    rarity: 1, 
    attributes: {
      "passives" => ["versatile"], 
      "abilities" => [],
      "multipliers" => { "life" => 1.0, "stamina" => 1.0, "mana" => 1.0 },
      "damage_output_by_type" => { "physical" => 1.0 },
      "damage_amplification" => 1.0,
      "damage_reduction_by_type" => {}
    }
  },
  
  # Weapons
  { 
    name: "spear", 
    category: "weapon", 
    rarity: 1, 
    attributes: {
      "abilities" => ["stab"],
      "base_damage_by_type" => { "piercing" => 5 },
      "applies_to" => ["physical", "piercing"],
      "damage_multiplier" => 1.2
    }
  },
  { 
    name: "sword", 
    category: "weapon", 
    rarity: 1, 
    attributes: {
      "abilities" => ["whirlwind"],
      "base_damage_by_type" => { "slashing" => 6 },
      "applies_to" => ["physical", "slashing"],
      "damage_multiplier" => 1.3
    }
  },
  { 
    name: "axe", 
    category: "weapon", 
    rarity: 1, 
    attributes: {
      "abilities" => ["cleave"],
      "base_damage_by_type" => { "slashing" => 8 },
      "applies_to" => ["physical", "slashing"],
      "damage_multiplier" => 1.4
    }
  },
  { 
    name: "bow", 
    category: "weapon", 
    rarity: 1, 
    attributes: {
      "abilities" => ["piercing_arrow"],
      "base_damage_by_type" => { "piercing" => 4 },
      "applies_to" => ["physical", "piercing"],
      "damage_multiplier" => 1.1
    }
  },
  { 
    name: "mace", 
    category: "weapon", 
    rarity: 1, 
    attributes: {
      "abilities" => ["smash"],
      "base_damage_by_type" => { "blunt" => 7 },
      "applies_to" => ["physical", "blunt"],
      "damage_multiplier" => 1.3
    }
  },
  { 
    name: "wizard_staff", 
    category: "weapon", 
    rarity: 2, 
    attributes: {
      "abilities" => ["cast", "magic_missile"],
      "base_damage_by_type" => { "magic" => 5 },
      "applies_to" => ["magic", "arcane", "fire", "ice", "lightning"],
      "damage_multiplier" => 1.5
    }
  },
  { 
    name: "shield", 
    category: "weapon", 
    rarity: 2, 
    attributes: {
      "passives" => ["block"],
      "base_damage_by_type" => { "blunt" => 2 },
      "applies_to" => ["physical", "blunt"],
      "damage_multiplier" => 1.0,
      "damage_reduction_by_type" => { "physical" => 0.8 }
    }
  },

  # Elements
  { 
    name: "fire", 
    category: "element", 
    rarity: 2, 
    attributes: {
      "passives" => ["burn"],
      "damage_output_by_type" => { "fire" => 1.5 },
      "damage_reduction_by_type" => {
        "fire" => 0.3,
        "light" => 0.7,
        "water" => 1.5,
        "ice" => 1.8
      }
    }
  },
  { 
    name: "ice", 
    category: "element", 
    rarity: 2, 
    attributes: {
      "passives" => ["chill"],
      "damage_output_by_type" => { "ice" => 1.5 },
      "damage_reduction_by_type" => {
        "water" => 0.5,
        "ice" => 0.3,
        "lightning" => 1.5,
        "blunt" => 1.3,
        "fire" => 1.8
      }
    }
  },
  { 
    name: "lightning", 
    category: "element", 
    rarity: 2, 
    attributes: {
      "passives" => ["shock"],
      "damage_output_by_type" => { "lightning" => 1.6 },
      "damage_reduction_by_type" => {
        "dark" => 0.7,
        "water" => 1.5
      }
    }
  },

  # Characteristics
  { 
    name: "undead", 
    category: "characteristic", 
    rarity: 3, 
    attributes: {
      "passives" => ["heartless"],
      "multipliers" => { "life" => 0.8, "mana" => 1.2 },
      "damage_reduction_by_type" => {
        "poison" => 0.0,
        "holy" => 1.8,
        "light" => 1.5
      }
    }
  },
  { 
    name: "large", 
    category: "characteristic", 
    rarity: 3, 
    attributes: {
      "passives" => ["towering"],
      "multipliers" => { "life" => 1.2, "stamina" => 1.1 },
      "damage_amplification" => 1.15,
      "damage_reduction_by_type" => {
        "blunt" => 0.8,
        "piercing" => 0.8,
        "magic" => 1.2,
        "lightning" => 1.3
      }
    }
  },
  { 
    name: "agile", 
    category: "characteristic", 
    rarity: 3, 
    attributes: {
      "passives" => ["nimble"],
      "multipliers" => { "stamina" => 1.2 },
      "damage_output_by_type" => { "piercing" => 1.2, "slashing" => 1.1 },
      "damage_reduction_by_type" => {
        "slashing" => 0.8,
        "piercing" => 0.8,
        "blunt" => 1.2
      }
    }
  },
]

puts "Seeding keywords..."
keywords_data.each do |data|
  BossKeyword.find_or_create_by!(name: data[:name]) do |keyword|
    keyword.category = data[:category]
    keyword.rarity = data[:rarity]
    keyword.properties = data[:attributes]
  end
  print "."
end

puts "\nSeeded #{BossKeyword.count} keywords!"

