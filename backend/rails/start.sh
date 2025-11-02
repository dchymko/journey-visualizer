#!/bin/bash
# Start the Rails server

# Load environment variables
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi

# Start Rails server
echo "🚀 Starting Rails server on port ${PORT:-3001}..."
bundle exec rails server -p ${PORT:-3001}
