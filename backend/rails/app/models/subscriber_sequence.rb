class SubscriberSequence < ApplicationRecord
  belongs_to :subscriber
  belongs_to :sequence

  validates :subscriber_id, uniqueness: { scope: :sequence_id }
end
