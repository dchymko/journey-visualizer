class ApplicationController < ActionController::API
  include ActionController::Cookies
  include ActionController::RequestForgeryProtection

  protect_from_forgery with: :null_session

  rescue_from StandardError, with: :handle_error
  rescue_from ActiveRecord::RecordNotFound, with: :handle_not_found

  private

  def current_account
    @current_account ||= Account.find_by(id: session[:account_id]) if session[:account_id]
  end

  def authenticated?
    current_account.present?
  end

  def require_authentication
    unless authenticated?
      render json: {
        error: 'Unauthorized',
        message: 'You must be logged in to access this resource'
      }, status: :unauthorized
    end
  end

  def handle_error(exception)
    Rails.logger.error "Error: #{exception.message}"
    Rails.logger.error exception.backtrace.join("\n")

    status = exception.respond_to?(:status) ? exception.status : :internal_server_error

    render json: {
      error: Rails.env.production? ? 'Internal Server Error' : exception.message,
      **(Rails.env.development? ? { backtrace: exception.backtrace[0..5] } : {})
    }, status: status
  end

  def handle_not_found(exception)
    render json: {
      error: 'Not Found',
      message: exception.message
    }, status: :not_found
  end
end
