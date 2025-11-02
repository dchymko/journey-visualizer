class Account < ApplicationRecord
  # Associations
  has_many :tags, dependent: :destroy
  has_many :sequences, dependent: :destroy
  has_many :subscribers, dependent: :destroy
  has_many :journey_flows, dependent: :destroy
  has_many :analysis_runs, dependent: :destroy

  # Validations
  validates :kit_account_id, presence: true, uniqueness: true
  validates :access_token, presence: true

  # Check if access token is expired
  def token_expired?
    token_expires_at && token_expires_at < Time.current
  end

  # Check if sync is needed
  def needs_sync?
    last_sync_at.nil? || last_sync_at < 24.hours.ago
  end
end
