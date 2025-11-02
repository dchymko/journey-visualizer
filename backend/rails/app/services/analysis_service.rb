class AnalysisService
  def initialize(account)
    @account = account
  end

  def analyze_journeys
    total_flows = 0

    ActiveRecord::Base.transaction do
      # Create analysis run record
      analysis_run = @account.analysis_runs.create!(
        status: 'running',
        started_at: Time.current
      )

      Rails.logger.info "Starting journey analysis for account #{@account.id}, run #{analysis_run.id}"

      # Clear old flow data
      @account.journey_flows.destroy_all

      # Build subscriber journey map
      subscriber_map = build_subscriber_map

      # Analyze Tag -> Tag flows
      tag_to_tag_flows = analyze_tag_to_tag_flows(subscriber_map)
      total_flows += save_flows(tag_to_tag_flows)

      # Analyze Tag -> Sequence flows
      tag_to_sequence_flows = analyze_tag_to_sequence_flows(subscriber_map)
      total_flows += save_flows(tag_to_sequence_flows)

      # Get final counts
      total_subscribers = @account.subscribers.count
      total_tags = @account.tags.count
      total_sequences = @account.sequences.count

      # Update analysis run
      analysis_run.update!(
        status: 'completed',
        total_subscribers: total_subscribers,
        total_tags: total_tags,
        total_sequences: total_sequences,
        total_flows: total_flows,
        completed_at: Time.current
      )

      Rails.logger.info "Journey analysis completed for account #{@account.id}: #{total_flows} flows identified"

      {
        total_flows: total_flows,
        total_subscribers: total_subscribers,
        total_tags: total_tags,
        total_sequences: total_sequences
      }
    end
  rescue => e
    Rails.logger.error "Error analyzing journeys: #{e.message}"
    raise
  end

  private

  def build_subscriber_map
    subscriber_map = {}

    # Load subscribers with tags
    @account.subscribers.active.includes(:tags, :sequences).find_each do |subscriber|
      subscriber_map[subscriber.id] = {
        tags: subscriber.tags.map { |t| { id: t.kit_tag_id, name: t.name } },
        sequences: subscriber.sequences.map { |s| { id: s.kit_sequence_id, name: s.name } }
      }
    end

    subscriber_map
  end

  def analyze_tag_to_tag_flows(subscriber_map)
    flows = Hash.new { |h, k| h[k] = { count: 0, source_name: nil, target_name: nil } }

    subscriber_map.each do |_subscriber_id, data|
      tags = data[:tags]
      next if tags.length < 2

      # Analyze all tag combinations
      tags.combination(2).each do |tag1, tag2|
        flow_key = "tag_#{tag1[:id]}_to_tag_#{tag2[:id]}"
        flows[flow_key][:count] += 1
        flows[flow_key][:source_name] = tag1[:name]
        flows[flow_key][:target_name] = tag2[:name]
      end
    end

    flows.map do |flow_key, data|
      source_id, target_id = flow_key.match(/tag_(\d+)_to_tag_(\d+)/).captures

      {
        source_type: 'tag',
        source_id: source_id,
        source_name: data[:source_name],
        target_type: 'tag',
        target_id: target_id,
        target_name: data[:target_name],
        count: data[:count]
      }
    end
  end

  def analyze_tag_to_sequence_flows(subscriber_map)
    flows = Hash.new { |h, k| h[k] = { count: 0, source_name: nil, target_name: nil } }

    subscriber_map.each do |_subscriber_id, data|
      tags = data[:tags]
      sequences = data[:sequences]

      tags.each do |tag|
        sequences.each do |sequence|
          flow_key = "tag_#{tag[:id]}_to_seq_#{sequence[:id]}"
          flows[flow_key][:count] += 1
          flows[flow_key][:source_name] = tag[:name]
          flows[flow_key][:target_name] = sequence[:name]
        end
      end
    end

    flows.map do |flow_key, data|
      if flow_key.match(/tag_(\d+)_to_seq_(\d+)/)
        source_id, target_id = $1, $2

        {
          source_type: 'tag',
          source_id: source_id,
          source_name: data[:source_name],
          target_type: 'sequence',
          target_id: target_id,
          target_name: data[:target_name],
          count: data[:count]
        }
      end
    end.compact
  end

  def save_flows(flows)
    saved_count = 0

    flows.each do |flow|
      # Calculate percentage
      source_count = case flow[:source_type]
                     when 'tag'
                       SubscriberTag.joins(:tag)
                                   .where(tags: { account_id: @account.id, kit_tag_id: flow[:source_id] })
                                   .distinct
                                   .count(:subscriber_id)
                     when 'sequence'
                       SubscriberSequence.joins(:sequence)
                                        .where(sequences: { account_id: @account.id, kit_sequence_id: flow[:source_id] })
                                        .distinct
                                        .count(:subscriber_id)
                     else
                       1
                     end

      source_count = 1 if source_count.zero?
      percentage = (flow[:count].to_f / source_count * 100).round(2)

      @account.journey_flows.create!(
        source_type: flow[:source_type],
        source_id: flow[:source_id],
        source_name: flow[:source_name],
        target_type: flow[:target_type],
        target_id: flow[:target_id],
        target_name: flow[:target_name],
        subscriber_count: flow[:count],
        percentage: percentage
      )

      saved_count += 1
    end

    saved_count
  end
end
