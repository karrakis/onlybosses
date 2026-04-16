class SimulationBatch < ApplicationRecord
  STATUSES = %w[pending running done cancelled].freeze

  validates :status,    inclusion: { in: STATUSES }
  validates :total,     presence: true, numericality: { greater_than: 0 }
  validates :completed, numericality: { greater_than_or_equal_to: 0 }

  scope :active, -> { where(status: %w[pending running]) }
end
