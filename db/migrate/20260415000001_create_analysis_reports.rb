class CreateAnalysisReports < ActiveRecord::Migration[7.0]
  def change
    create_table :analysis_reports do |t|
      t.jsonb    :params,         null: false, default: {}
      t.integer  :run_count,      null: false, default: 0
      t.integer  :snapshot_count, null: false, default: 0
      t.jsonb    :sections,       null: false, default: []
      t.timestamps
    end
  end
end
