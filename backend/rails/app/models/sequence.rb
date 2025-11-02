class Sequence < ApplicationRecord
  # Associations
  belongs_to :account
  has_many :subscriber_sequences, dependent: :destroy
  has_many :subscribers, through: :subscriber_sequences

  # Validations
  validates :kit_sequence_id, presence: true
  validates :name, presence: true
  validates :kit_sequence_id, uniqueness: { scope: :account_id }
end
