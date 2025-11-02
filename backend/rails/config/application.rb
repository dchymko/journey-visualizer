require_relative "boot"

require "rails"
require "active_model/railtie"
require "active_job/railtie"
require "active_record/railtie"
require "action_controller/railtie"
require "action_mailer/railtie"
require "action_view/railtie"

# Require the gems listed in Gemfile
Bundler.require(*Rails.groups)

module KitJourneyVisualizer
  class Application < Rails::Application
    # Initialize configuration defaults for originally generated Rails version.
    config.load_defaults 7.1

    # API-only mode
    config.api_only = true

    # Session store configuration
    config.session_store :cookie_store, key: '_kit_journey_session'

    # Middleware
    config.middleware.use ActionDispatch::Cookies
    config.middleware.use ActionDispatch::Session::CookieStore

    # Timezone
    config.time_zone = 'UTC'
    config.active_record.default_timezone = :utc

    # Autoload lib directory
    config.autoload_paths << Rails.root.join('lib')
    config.eager_load_paths << Rails.root.join('lib')

    # CORS will be configured in initializer

    # Logging
    config.log_level = ENV.fetch('LOG_LEVEL', 'info').to_sym

    # Don't generate system test files
    config.generators.system_tests = nil
  end
end
