module Api
  class DashboardController < BaseController
    def metrics
      render json: {
        tags: current_account.tags.count,
        sequences: current_account.sequences.count,
        subscribers: current_account.subscribers.count,
        flows: current_account.journey_flows.count
      }
    rescue => e
      Rails.logger.error "Error fetching dashboard metrics: #{e.message}"
      render json: { error: 'Failed to fetch dashboard metrics' }, status: :unprocessable_entity
    end
  end
end
