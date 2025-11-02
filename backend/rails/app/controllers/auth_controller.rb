class AuthController < ApplicationController
  skip_before_action :verify_authenticity_token, only: [:kit, :callback]

  def kit
    # Redirect to OmniAuth
    redirect_to '/auth/kit', allow_other_host: true
  end

  def callback
    auth_hash = request.env['omniauth.auth']

    unless auth_hash
      redirect_to "#{ENV['FRONTEND_URL']}/auth/error", allow_other_host: true
      return
    end

    account_id = auth_hash['uid']
    info = auth_hash['info']
    credentials = auth_hash['credentials']

    # Calculate token expiration
    token_expires_at = Time.current + 2.hours

    account = Account.find_or_initialize_by(kit_account_id: account_id)
    account.assign_attributes(
      email: info['email'],
      name: info['name'],
      access_token: credentials['token'],
      refresh_token: credentials['refresh_token'],
      token_expires_at: token_expires_at
    )

    if account.save
      session[:account_id] = account.id
      Rails.logger.info "OAuth successful for user: #{account.email}"
      redirect_to "#{ENV['FRONTEND_URL']}/dashboard", allow_other_host: true
    else
      Rails.logger.error "Failed to save account: #{account.errors.full_messages}"
      redirect_to "#{ENV['FRONTEND_URL']}/auth/error", allow_other_host: true
    end
  rescue => e
    Rails.logger.error "OAuth callback error: #{e.message}"
    redirect_to "#{ENV['FRONTEND_URL']}/auth/error", allow_other_host: true
  end

  def me
    if authenticated?
      render json: {
        authenticated: true,
        user: {
          id: current_account.id,
          kit_account_id: current_account.kit_account_id,
          email: current_account.email,
          name: current_account.name,
          created_at: current_account.created_at,
          updated_at: current_account.updated_at,
          last_sync_at: current_account.last_sync_at
        }
      }
    else
      render json: { authenticated: false }, status: :unauthorized
    end
  end

  def logout
    reset_session
    render json: { message: 'Logged out successfully' }
  end
end
