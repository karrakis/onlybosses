class CreateBossKeywords < ActiveRecord::Migration[7.0]
  def change
    create_table :boss_keywords do |t|
      t.string :name, null: false
      t.string :category
      t.jsonb :attributes, default: {}
      t.integer :rarity, default: 1

      t.timestamps
    end
    
    add_index :boss_keywords, :name, unique: true
  end
end
