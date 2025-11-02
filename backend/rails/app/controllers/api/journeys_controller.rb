module Api
  class JourneysController < BaseController
    def flows
      flows = current_account.journey_flows.by_subscriber_count

      render json: flows
    rescue => e
      Rails.logger.error "Error fetching journey flows: #{e.message}"
      render json: { error: 'Failed to fetch journey flows' }, status: :unprocessable_entity
    end

    def analyze
      Rails.logger.info "Starting journey analysis for user: #{current_account.email}"

      analysis_service = AnalysisService.new(current_account)
      result = analysis_service.analyze_journeys

      render json: {
        message: 'Analysis completed',
        **result
      }
    rescue => e
      Rails.logger.error "Error analyzing journeys: #{e.message}"
      render json: { error: 'Failed to analyze journeys' }, status: :unprocessable_entity
    end
  end
end
