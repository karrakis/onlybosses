class CreateRuns < ActiveRecord::Migration[7.0]
  def change
    create_table :runs do |t|
      t.string :session_id, null: false
      t.datetime :started_at, null: false, default: -> { "NOW()" }
      t.datetime :ended_at
      t.integer :final_depth
      t.string :outcome

      t.timestamps
    end

    add_index :runs, :session_id
    add_check_constraint :runs, "outcome IN ('died', 'quit')", name: "check_runs_outcome"
  end
end
