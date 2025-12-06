class CreateBosses < ActiveRecord::Migration[7.0]
  def change
    create_table :bosses do |t|
      t.string :name
      t.jsonb :computed_stats, default: {}
      t.string :image_generation_status, default: 'pending'

      t.timestamps
    end
  end
end
