class AnalysisRun < ApplicationRecord
  belongs_to :account

  validates :status, inclusion: { in: %w[running completed failed] }

  scope :for_account, ->(account_id) { where(account_id: account_id) }
  scope :recent, -> { order(started_at: :desc) }
end
