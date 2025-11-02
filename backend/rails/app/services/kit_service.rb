class KitService
  include HTTParty
  base_uri ENV['KIT_API_BASE_URL'] || 'https://api.kit.com/v4'

  def initialize(account)
    @account = account
    @options = {
      headers: {
        'Authorization' => "Bearer #{account.access_token}",
        'Content-Type' => 'application/json'
      },
      timeout: 30
    }
  end

  def fetch_account_info
    response = self.class.get('/account', @options)
    handle_response(response)
  end

  def fetch_tags
    response = self.class.get('/tags', @options)
    data = handle_response(response)
    data['tags'] || []
  end

  def fetch_sequences
    response = self.class.get('/sequences', @options)
    data = handle_response(response)
    data['sequences'] || []
  end

  def fetch_subscribers(page = 1)
    response = self.class.get('/subscribers', @options.merge(query: { page: page, per_page: 100 }))
    handle_response(response)
  end

  def fetch_subscriber_tags(subscriber_id)
    response = self.class.get("/subscribers/#{subscriber_id}/tags", @options)
    data = handle_response(response)
    data['tags'] || []
  rescue => e
    Rails.logger.debug "No tags for subscriber #{subscriber_id}"
    []
  end

  def sync_account_data
    total_subscribers = 0
    total_tags = 0
    total_sequences = 0

    ActiveRecord::Base.transaction do
      # Sync tags
      Rails.logger.info "Syncing tags for user: #{@account.email}"
      tags = fetch_tags
      tags.each do |tag_data|
        tag = @account.tags.find_or_initialize_by(kit_tag_id: tag_data['id'].to_s)
        tag.update!(
          name: tag_data['name'],
          subscriber_count: tag_data['total_subscriptions'] || 0
        )
      end
      total_tags = tags.length

      # Sync sequences
      Rails.logger.info "Syncing sequences for user: #{@account.email}"
      sequences = fetch_sequences
      sequences.each do |seq_data|
        sequence = @account.sequences.find_or_initialize_by(kit_sequence_id: seq_data['id'].to_s)
        sequence.update!(
          name: seq_data['name'],
          subscriber_count: seq_data['total_subscriptions'] || 0
        )
      end
      total_sequences = sequences.length

      # Sync subscribers
      Rails.logger.info "Syncing subscribers for user: #{@account.email} (this may take a while)"
      page = 1
      loop do
        subscriber_data = fetch_subscribers(page)
        subscribers = subscriber_data['subscribers'] || []

        break if subscribers.empty?

        subscribers.each do |sub_data|
          subscriber = @account.subscribers.find_or_initialize_by(kit_subscriber_id: sub_data['id'].to_s)
          subscriber.update!(
            email: sub_data['email_address'],
            first_name: sub_data['first_name'],
            state: sub_data['state']
          )

          # Fetch and store subscriber tags
          sub_tags = fetch_subscriber_tags(sub_data['id'])
          sub_tags.each do |tag_data|
            tag = @account.tags.find_by(kit_tag_id: tag_data['id'].to_s)
            if tag
              SubscriberTag.find_or_create_by!(subscriber: subscriber, tag: tag)
            end
          end

          total_subscribers += 1
        end

        # Check pagination
        if subscriber_data['pagination'] && subscriber_data['pagination']['has_next_page']
          page += 1
          Rails.logger.info "Fetched #{total_subscribers} subscribers so far..."
          sleep 1 # Rate limiting
        else
          break
        end
      end

      # Update last sync time
      @account.update!(last_sync_at: Time.current)
    end

    Rails.logger.info "Sync completed for user: #{@account.email} - #{total_subscribers} subscribers, #{total_tags} tags, #{total_sequences} sequences"

    {
      subscribers: total_subscribers,
      tags: total_tags,
      sequences: total_sequences
    }
  end

  private

  def handle_response(response)
    case response.code
    when 200..299
      response.parsed_response
    when 401
      raise StandardError, 'Unauthorized - Invalid or expired access token'
    when 429
      raise StandardError, 'Rate limit exceeded'
    else
      raise StandardError, "Kit API error: #{response.code} - #{response.message}"
    end
  end
end
