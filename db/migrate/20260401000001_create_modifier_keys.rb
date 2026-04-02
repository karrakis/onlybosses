class CreateModifierKeys < ActiveRecord::Migration[7.0]
  def change
    create_table :modifier_keys do |t|
      t.string :key, null: false
      t.string :category

      t.timestamps
    end

    add_index :modifier_keys, :key, unique: true
  end
end
