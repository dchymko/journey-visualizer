require 'omniauth-kit'

Rails.application.config.middleware.use OmniAuth::Builder do
  provider :kit,
    ENV['KIT_CLIENT_ID'],
    ENV['KIT_CLIENT_SECRET'],
    {
      client_options: {
        site: ENV['KIT_API_BASE_URL'],
        authorize_url: ENV['OAUTH_AUTHORIZATION_URL'],
        token_url: ENV['OAUTH_TOKEN_URL']
      }
    }
end

# Configure OmniAuth
OmniAuth.config.allowed_request_methods = [:get, :post]
OmniAuth.config.silence_get_warning = true
