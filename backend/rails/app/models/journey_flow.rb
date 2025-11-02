class JourneyFlow < ApplicationRecord
  belongs_to :account

  validates :source_type, :source_id, :source_name, :target_type, presence: true

  scope :for_account, ->(account_id) { where(account_id: account_id) }
  scope :by_subscriber_count, -> { order(subscriber_count: :desc) }
end
