class SnapshotModifier < ApplicationRecord
  belongs_to :depth_snapshot
  belongs_to :modifier_key

  validates :context, inclusion: { in: %w[player boss] }
  validates :modifier_key_id, uniqueness: { scope: [:depth_snapshot_id, :context] }
end
