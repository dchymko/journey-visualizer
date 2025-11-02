class HealthController < ApplicationController
  def index
    render json: {
      status: 'ok',
      timestamp: Time.current.iso8601,
      environment: Rails.env
    }
  end
end
