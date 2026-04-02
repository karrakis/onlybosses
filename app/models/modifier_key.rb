class ModifierKey < ApplicationRecord
  has_many :snapshot_modifiers

  validates :key, presence: true, uniqueness: true
end
