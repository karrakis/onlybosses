# This file should contain all the record creation needed to seed the database with its default values.
# The data can then be loaded with the bin/rails db:seed command (or created alongside the database with db:setup).

# Boss Keywords
keywords_data = [
  # Creatures
  { name: "skeleton", category: "creature", rarity: 1, attributes: {
    resistances: ["piercing"],
    vulnerabilities: ["blunt"],
    base_stats: { defense: -2, speed: 2 }
  }},
  { name: "octopus", category: "creature", rarity: 2, attributes: {
    resistances: ["blunt", "charm"],
    special: { max_weapons: 8 },
    base_stats: { intelligence: 9, dexterity: 3 }
  }},
  { name: "dragon", category: "creature", rarity: 3, attributes: {
    resistances: ["fire", "piercing"],
    vulnerabilities: ["ice"],
    base_stats: { strength: 10, defense: 8, health: 50 },
    special: { can_fly: true }
  }},
  { name: "golem", category: "creature", rarity: 2, attributes: {
    resistances: ["piercing", "slashing", "blunt"],
    vulnerabilities: ["magic"],
    base_stats: { defense: 15, speed: -3 }
  }},
  { name: "ghost", category: "creature", rarity: 2, attributes: {
    resistances: ["physical"],
    vulnerabilities: ["holy"],
    base_stats: { defense: -5 },
    special: { intangible: true }
  }},
  { name: "vampire", category: "creature", rarity: 3, attributes: {
    resistances: ["charm", "fear"],
    vulnerabilities: ["holy", "fire"],
    base_stats: { strength: 5, speed: 4 },
    special: { life_drain: true }
  }},
  { name: "goat", category: "creature", rarity: 1, attributes: {
    base_stats: { stubbornness: 10 }
  }},
  
  # Weapons
  { name: "spear", category: "weapon", rarity: 1, attributes: {
    weapon_type: "piercing",
    base_stats: { attack: 5, range: 2 }
  }},
  { name: "sword", category: "weapon", rarity: 1, attributes: {
    weapon_type: "slashing",
    base_stats: { attack: 6, range: 1 }
  }},
  { name: "axe", category: "weapon", rarity: 1, attributes: {
    weapon_type: "slashing",
    base_stats: { attack: 8, speed: -1 }
  }},
  { name: "bow", category: "weapon", rarity: 1, attributes: {
    weapon_type: "piercing",
    base_stats: { attack: 4, range: 5 }
  }},
  { name: "staff", category: "weapon", rarity: 2, attributes: {
    weapon_type: "magic",
    base_stats: { magic: 5, intelligence: 2 }
  }},
  
  # Elements
  { name: "fire", category: "element", rarity: 2, attributes: {
    resistances: ["ice"],
    vulnerabilities: ["water"],
    base_stats: { attack: 3 }
  }},
  { name: "ice", category: "element", rarity: 2, attributes: {
    resistances: ["water"],
    vulnerabilities: ["fire"],
    base_stats: { defense: 2 }
  }},
  { name: "lightning", category: "element", rarity: 2, attributes: {
    resistances: ["water"],
    base_stats: { speed: 3, attack: 4 }
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

