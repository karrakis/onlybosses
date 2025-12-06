class CreateKeywords < ActiveRecord::Migration[7.0]
  def change
    create_table :keywords do |t|
      t.string :name
      t.string :category
      t.jsonb :attributes
      t.integer :rarity

      t.timestamps
    end
  end
end
