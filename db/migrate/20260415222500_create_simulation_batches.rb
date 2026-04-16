class CreateSimulationBatches < ActiveRecord::Migration[7.0]
  def change
    create_table :simulation_batches do |t|
      t.string  :status,    null: false, default: 'pending'
      t.integer :total,     null: false
      t.integer :completed, null: false, default: 0
      t.timestamps
    end
  end
end
