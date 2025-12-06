class RenameAttributesToPropertiesInBossKeywords < ActiveRecord::Migration[7.0]
  def change
    rename_column :boss_keywords, :attributes, :properties
  end
end
