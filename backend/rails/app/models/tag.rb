class Tag < ApplicationRecord
  # Associations
  belongs_to :account
  has_many :subscriber_tags, dependent: :destroy
  has_many :subscribers, through: :subscriber_tags

  # Validations
  validates :kit_tag_id, presence: true
  validates :name, presence: true
  validates :kit_tag_id, uniqueness: { scope: :account_id }
end
