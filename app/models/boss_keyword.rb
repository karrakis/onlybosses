class BossKeyword < ApplicationRecord
  has_many :boss_keyword_associations, dependent: :destroy
  has_many :bosses, through: :boss_keyword_associations
  
  validates :name, presence: true, uniqueness: true
end
