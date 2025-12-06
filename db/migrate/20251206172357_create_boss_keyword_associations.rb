class CreateBossKeywordAssociations < ActiveRecord::Migration[7.0]
  def change
    create_table :boss_keyword_associations do |t|
      t.references :boss, null: false, foreign_key: true
      t.references :boss_keyword, null: false, foreign_key: true
      t.integer :position

      t.timestamps
    end
    
    add_index :boss_keyword_associations, [:boss_id, :boss_keyword_id], unique: true, name: 'index_boss_keywords_on_boss_and_keyword'
  end
end
