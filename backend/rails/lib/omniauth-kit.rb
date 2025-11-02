require 'omniauth-oauth2'

module OmniAuth
  module Strategies
    class Kit < OmniAuth::Strategies::OAuth2
      option :name, 'kit'

      option :client_options, {
        site: ENV['KIT_API_BASE_URL'] || 'https://api.kit.com/v4',
        authorize_url: ENV['OAUTH_AUTHORIZATION_URL'] || 'https://app.kit.com/oauth/authorize',
        token_url: ENV['OAUTH_TOKEN_URL'] || 'https://api.kit.com/oauth/token'
      }

      # Account info endpoint
      def raw_info
        @raw_info ||= access_token.get('/account').parsed
      end

      # Extract user info from Kit API response
      uid { raw_info.dig('account', 'id') }

      info do
        {
          email: raw_info.dig('account', 'primary_email_address') || raw_info.dig('account', 'email'),
          name: raw_info.dig('account', 'name'),
          account_id: raw_info.dig('account', 'id')
        }
      end

      extra do
        {
          'raw_info' => raw_info
        }
      end
    end
  end
end
