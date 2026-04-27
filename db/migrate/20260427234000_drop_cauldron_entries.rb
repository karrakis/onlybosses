class DropCauldronEntries < ActiveRecord::Migration[7.0]
  def up
    drop_table :cauldron_entries, if_exists: true
  end

  def down
    create_table :cauldron_entries do |t|
      t.references :run, null: false, foreign_key: true
      t.integer :depth, null: false
      t.integer :keyword_ids, array: true, default: []

      t.timestamps

      t.index [:run_id, :depth], unique: true
      t.index :keyword_ids, using: :gin
    end
  end
end
