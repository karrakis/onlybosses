class Run < ApplicationRecord
  has_many :depth_snapshots, dependent: :destroy

  validates :session_id, presence: true
  validates :outcome, inclusion: { in: %w[died quit] }, allow_nil: true
end
