-- Migration: Initial Schema
-- Description: Create tables for Kit Journey Visualizer

-- Users/Accounts table
CREATE TABLE IF NOT EXISTS accounts (
    id SERIAL PRIMARY KEY,
    kit_account_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255),
    name VARCHAR(255),
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    token_expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_sync_at TIMESTAMP
);

-- Index on kit_account_id for faster lookups
CREATE INDEX idx_accounts_kit_account_id ON accounts(kit_account_id);

-- Tags table
CREATE TABLE IF NOT EXISTS tags (
    id SERIAL PRIMARY KEY,
    account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    kit_tag_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    subscriber_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(account_id, kit_tag_id)
);

CREATE INDEX idx_tags_account_id ON tags(account_id);
CREATE INDEX idx_tags_kit_tag_id ON tags(kit_tag_id);

-- Sequences table
CREATE TABLE IF NOT EXISTS sequences (
    id SERIAL PRIMARY KEY,
    account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    kit_sequence_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    subscriber_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(account_id, kit_sequence_id)
);

CREATE INDEX idx_sequences_account_id ON sequences(account_id);
CREATE INDEX idx_sequences_kit_sequence_id ON sequences(kit_sequence_id);

-- Subscribers table (cached data)
CREATE TABLE IF NOT EXISTS subscribers (
    id SERIAL PRIMARY KEY,
    account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    kit_subscriber_id VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    first_name VARCHAR(255),
    state VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(account_id, kit_subscriber_id)
);

CREATE INDEX idx_subscribers_account_id ON subscribers(account_id);
CREATE INDEX idx_subscribers_kit_subscriber_id ON subscribers(kit_subscriber_id);
CREATE INDEX idx_subscribers_state ON subscribers(state);

-- Subscriber Tags (many-to-many relationship)
CREATE TABLE IF NOT EXISTS subscriber_tags (
    id SERIAL PRIMARY KEY,
    subscriber_id INTEGER NOT NULL REFERENCES subscribers(id) ON DELETE CASCADE,
    tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    tagged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(subscriber_id, tag_id)
);

CREATE INDEX idx_subscriber_tags_subscriber_id ON subscriber_tags(subscriber_id);
CREATE INDEX idx_subscriber_tags_tag_id ON subscriber_tags(tag_id);

-- Subscriber Sequences (many-to-many relationship)
CREATE TABLE IF NOT EXISTS subscriber_sequences (
    id SERIAL PRIMARY KEY,
    subscriber_id INTEGER NOT NULL REFERENCES subscribers(id) ON DELETE CASCADE,
    sequence_id INTEGER NOT NULL REFERENCES sequences(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMP,
    completed_at TIMESTAMP,
    state VARCHAR(50),
    UNIQUE(subscriber_id, sequence_id)
);

CREATE INDEX idx_subscriber_sequences_subscriber_id ON subscriber_sequences(subscriber_id);
CREATE INDEX idx_subscriber_sequences_sequence_id ON subscriber_sequences(sequence_id);
CREATE INDEX idx_subscriber_sequences_state ON subscriber_sequences(state);

-- Journey Flows table (stores analyzed flow data)
CREATE TABLE IF NOT EXISTS journey_flows (
    id SERIAL PRIMARY KEY,
    account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    source_type VARCHAR(50) NOT NULL, -- 'tag', 'sequence', 'form', 'entry'
    source_id VARCHAR(255) NOT NULL,
    source_name VARCHAR(255) NOT NULL,
    target_type VARCHAR(50) NOT NULL, -- 'tag', 'sequence', 'completed', 'dropped'
    target_id VARCHAR(255),
    target_name VARCHAR(255),
    subscriber_count INTEGER DEFAULT 0,
    percentage DECIMAL(5,2),
    analyzed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(account_id, source_type, source_id, target_type, target_id)
);

CREATE INDEX idx_journey_flows_account_id ON journey_flows(account_id);
CREATE INDEX idx_journey_flows_source ON journey_flows(source_type, source_id);
CREATE INDEX idx_journey_flows_target ON journey_flows(target_type, target_id);

-- Analysis metadata table
CREATE TABLE IF NOT EXISTS analysis_runs (
    id SERIAL PRIMARY KEY,
    account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    total_subscribers INTEGER,
    total_tags INTEGER,
    total_sequences INTEGER,
    total_flows INTEGER,
    status VARCHAR(50), -- 'running', 'completed', 'failed'
    error_message TEXT,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

CREATE INDEX idx_analysis_runs_account_id ON analysis_runs(account_id);
CREATE INDEX idx_analysis_runs_status ON analysis_runs(status);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to relevant tables
CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tags_updated_at BEFORE UPDATE ON tags
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sequences_updated_at BEFORE UPDATE ON sequences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscribers_updated_at BEFORE UPDATE ON subscribers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
