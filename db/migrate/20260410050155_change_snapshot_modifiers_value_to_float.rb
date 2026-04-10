class ChangeSnapshotModifiersValueToFloat < ActiveRecord::Migration[7.0]
  def up
    change_column :snapshot_modifiers, :value, :float, null: false
  end

  def down
    change_column :snapshot_modifiers, :value, :decimal, precision: 10, scale: 6, null: false
  end
end
