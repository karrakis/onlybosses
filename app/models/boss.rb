class Boss < ApplicationRecord
  has_many :boss_keyword_associations, dependent: :destroy
  has_many :boss_keywords, through: :boss_keyword_associations
  has_one_attached :image
  
  validates :image_generation_status, inclusion: { in: %w[pending generating completed failed] }
end
