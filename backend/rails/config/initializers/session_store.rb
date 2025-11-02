# Configure session cookies
is_https = ENV['API_BASE_URL']&.start_with?('https') || Rails.env.production?

Rails.application.config.session_store :cookie_store,
  key: '_kit_journey_session',
  same_site: is_https ? :none : :lax,
  secure: is_https,
  httponly: true,
  expire_after: 24.hours
