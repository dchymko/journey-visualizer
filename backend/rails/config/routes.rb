Rails.application.routes.draw do
  # Health check
  get '/health', to: 'health#index'

  # OAuth routes
  get '/auth/kit', to: 'auth#kit'
  get '/auth/kit/callback', to: 'auth#callback'
  post '/auth/logout', to: 'auth#logout'
  get '/auth/me', to: 'auth#me'

  # API routes (all require authentication)
  namespace :api do
    # Account
    get '/account', to: 'accounts#show'

    # Sync
    post '/sync', to: 'sync#create'
    get '/sync/status', to: 'sync#status'

    # Journey
    get '/journey/flows', to: 'journeys#flows'
    post '/journey/analyze', to: 'journeys#analyze'

    # Dashboard
    get '/dashboard/metrics', to: 'dashboard#metrics'
  end
end
