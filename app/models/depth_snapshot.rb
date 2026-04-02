class DepthSnapshot < ApplicationRecord
  belongs_to :run
  has_many :snapshot_modifiers, dependent: :destroy

  validates :depth, presence: true, numericality: { greater_than: 0 }
  validates :depth, uniqueness: { scope: :run_id }
end
