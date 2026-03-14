# This file should contain all the record creation needed to seed the database with its default values.
# The data can then be loaded with the bin/rails db:seed command (or created alongside the database with db:setup).

# Load keywords from JSONL files
keywords_data = []
Dir[Rails.root.join('db/seeds/keywords/*.jsonl')].sort.each do |file|
  File.readlines(file).each do |line|
    next if line.strip.empty?
    keywords_data << JSON.parse(line.strip)
  end
end

puts "Seeding keywords..."
keywords_data.each do |data|
  BossKeyword.find_or_create_by!(name: data['name']) do |keyword|
    keyword.category = data['category']
    keyword.rarity = data['rarity']
    keyword.properties = data['attributes']
  end
  print "."
end

puts "\nSeeded #{BossKeyword.count} keywords!"
