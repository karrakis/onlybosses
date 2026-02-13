# This file should contain all the record creation needed to seed the database with its default values.
# The data can then be loaded with the bin/rails db:seed command (or created alongside the database with db:setup).

# Boss Keywords
keywords_data = [
  # Creatures
  { name: "skeleton", category: "creature", rarity: 1, attributes: {"multipliers" => {"life"=>0.8, "dexterity"=>0.8, "endurance"=>0.8, "mana"=>1.5, "phys_armor"=>1.4}, "resistances"=>["piercing", "dark", "mind"], "vulnerabilities"=>["blunt", "light", "holy"]}},
  { name: "octopus", category: "creature", rarity: 2, attributes: {"multipliers" => {"life"=>1.2, "dexterity"=>1.3, "intelligence"=>1.5}, "resistances"=>["blunt", "charm"], "vulnerabilities"=>["fire", "lightning"]}},
  { name: "dragon", category: "creature", rarity: 3, attributes: {"multipliers" => {"life"=>2.0, "strength"=>1.8, "phys_armor"=>1.5, "mag_armor"=>1.3}, "resistances"=>["fire", "piercing"], "vulnerabilities"=>["ice"]}},
  { name: "golem", category: "creature", rarity: 2, attributes: {"multipliers" => {"life"=>1.5, "phys_armor"=>2.0, "dexterity"=>0.5}, "resistances"=>["piercing", "slashing", "blunt"], "vulnerabilities"=>["magic", "lightning"]}},
  { name: "ghost", category: "creature", rarity: 2, attributes: {"multipliers" => {"life"=>0.6, "dexterity"=>1.6, "mag_armor"=>1.2}, "resistances"=>["physical"], "vulnerabilities"=>["holy", "light"]}},
  { name: "vampire", category: "creature", rarity: 3, attributes: {"multipliers" => {"life"=>1.3, "strength"=>1.2, "dexterity"=>1.3, "mana" => 1.2}, "resistances"=>["charm", "fear", "dark"], "vulnerabilities"=>["holy", "fire", "light"]}},
  { name: "goat", category: "creature", rarity: 1, attributes: {"multipliers" => {"life"=>1.0, "endurance"=>1.2, "strength"=>0.9}, "resistances"=>["charm"], "vulnerabilities"=>["slashing"]}},
  
  # Weapons
  { name: "spear", category: "weapon", rarity: 1, attributes: {
    weapon_type: "piercing",
    base_stats: { damage: 5, range: 2 }
  }},
  { name: "sword", category: "weapon", rarity: 1, attributes: {
    weapon_type: "slashing",
    base_stats: { damage: 6, range: 1 }
  }},
  { name: "axe", category: "weapon", rarity: 1, attributes: {
    weapon_type: "slashing",
    base_stats: { damage: 8, range: 1 }
  }},
  { name: "bow", category: "weapon", rarity: 1, attributes: {
    weapon_type: "piercing",
    base_stats: { damage: 4, range: 5 }
  }},
  { name: "wizard staff", category: "weapon", rarity: 2, attributes: {
    weapon_type: "magic",
    base_stats: { damage: 5, range: 4}
  }},
  
  # Elements
  { name: "fire", category: "element", rarity: 2, attributes: {
    resistances: ["fire", "light"],
    vulnerabilities: ["water", "ice"],
    base_stats: { attack: 3 }
  }},
  { name: "ice", category: "element", rarity: 2, attributes: {
    resistances: ["water", "ice"],
    vulnerabilities: ["lightning", "blunt"],
    base_stats: { defense: 2 }
  }},
  { name: "lightning", category: "element", rarity: 2, attributes: {
    resistances: ["air", "dark"],
    vulnerabilities: ["earth", "water"],
    base_stats: { speed: 3, attack: 4 }
  }},

  # Characteristics
  { name: "undead", category: "characteristic", rarity: 3, attributes: {
    multipliers: { life: 0.8, mana: 1.2 },
    resistances: ["poison", "charm"],
    vulnerabilities: ["holy", "light"]
  }},
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

