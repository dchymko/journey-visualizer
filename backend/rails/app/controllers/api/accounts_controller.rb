module Api
  class AccountsController < BaseController
    def show
      kit_service = KitService.new(current_account)
      account_info = kit_service.fetch_account_info

      render json: account_info
    rescue => e
      Rails.logger.error "Error fetching account info: #{e.message}"
      render json: { error: 'Failed to fetch account info' }, status: :unprocessable_entity
    end
  end
end
