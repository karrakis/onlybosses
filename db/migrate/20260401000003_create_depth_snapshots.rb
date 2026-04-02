class CreateDepthSnapshots < ActiveRecord::Migration[7.0]
  def change
    create_table :depth_snapshots do |t|
      t.references :run, null: false, foreign_key: true
      t.integer :depth, null: false
      t.boolean :reached_next, null: false, default: false
      t.integer :keyword_ids,      array: true, null: false, default: []
      t.integer :boss_keyword_ids, array: true, null: false, default: []

      t.timestamps
    end

    add_index :depth_snapshots, [:run_id, :depth], unique: true
    add_index :depth_snapshots, :depth
    add_index :depth_snapshots, :reached_next
    add_index :depth_snapshots, :keyword_ids,      using: :gin
    add_index :depth_snapshots, :boss_keyword_ids, using: :gin
  end
end
