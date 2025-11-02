module Api
  class SyncController < BaseController
    def create
      Rails.logger.info "Starting sync for user: #{current_account.email}"

      kit_service = KitService.new(current_account)
      result = kit_service.sync_account_data

      render json: {
        message: 'Sync completed',
        **result
      }
    rescue => e
      Rails.logger.error "Error syncing data: #{e.message}"
      render json: { error: 'Failed to sync data' }, status: :unprocessable_entity
    end

    def status
      render json: {
        last_sync_at: current_account.last_sync_at,
        needs_sync: current_account.needs_sync?
      }
    end
  end
end
