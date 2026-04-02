class CreateSnapshotModifiers < ActiveRecord::Migration[7.0]
  def change
    create_table :snapshot_modifiers do |t|
      t.references :depth_snapshot, null: false, foreign_key: true
      t.references :modifier_key,   null: false, foreign_key: true
      t.decimal    :value,          null: false, precision: 10, scale: 6
      t.string     :context,        null: false, default: "player"
    end

    add_index :snapshot_modifiers,
      [:depth_snapshot_id, :modifier_key_id, :context],
      unique: true,
      name: "index_snapshot_modifiers_uniqueness"

    add_check_constraint :snapshot_modifiers,
      "context IN ('player', 'boss')",
      name: "check_snapshot_modifiers_context"
  end
end
