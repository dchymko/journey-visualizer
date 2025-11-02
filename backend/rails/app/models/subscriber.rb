class Subscriber < ApplicationRecord
  # Associations
  belongs_to :account
  has_many :subscriber_tags, dependent: :destroy
  has_many :tags, through: :subscriber_tags
  has_many :subscriber_sequences, dependent: :destroy
  has_many :sequences, through: :subscriber_sequences

  # Validations
  validates :kit_subscriber_id, presence: true
  validates :kit_subscriber_id, uniqueness: { scope: :account_id }

  # Scopes
  scope :active, -> { where(state: 'active') }
  scope :inactive, -> { where(state: 'inactive') }
end
