# Kit Journey Visualizer - Rails Backend

Rails API backend for the Kit.com Subscriber Journey Visualizer.

## Features

- 🔐 OAuth 2.0 authentication with Kit.com
- 📊 RESTful API endpoints
- 🗄️ PostgreSQL database with ActiveRecord
- 🔄 Data synchronization from Kit API
- 📈 Journey flow analysis
- 🛡️ CORS and session management
- 🚀 Built with Rails 7.1

## Prerequisites

- Ruby >= 3.2.0
- Rails >= 7.1.0
- PostgreSQL >= 12
- Bundler

## Installation

### 1. Install Dependencies

```bash
cd backend/rails
bundle install
```

### 2. Setup Environment Variables

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=kit_journey_visualizer
DB_USER=postgres
DB_PASSWORD=your_password

# Kit API Credentials (from https://app.kit.com/account_settings/integrations)
KIT_CLIENT_ID=your_client_id
KIT_CLIENT_SECRET=your_client_secret

# URLs (adjust for ngrok if using HTTPS)
API_BASE_URL=http://localhost:3001
FRONTEND_URL=http://localhost:5173

# Generate with: rails secret
SECRET_KEY_BASE=your_secret_key_base
```

### 3. Create Database and Run Migrations

```bash
# Create database
rails db:create

# Run migrations
rails db:migrate
```

### 4. Start the Server

```bash
# Development
rails server -p 3001

# Or with environment variables
rails s -p 3001
```

The API will be available at `http://localhost:3001`

## Quick Setup Script

Alternatively, use the provided setup script:

```bash
bin/setup
```

This will:
- Install dependencies
- Copy .env.example to .env
- Create and migrate database
- Set up the application

## Project Structure

```
backend/rails/
├── app/
│   ├── controllers/
│   │   ├── application_controller.rb
│   │   ├── auth_controller.rb      # OAuth authentication
│   │   ├── health_controller.rb
│   │   └── api/                     # API endpoints
│   │       ├── accounts_controller.rb
│   │       ├── dashboard_controller.rb
│   │       ├── journeys_controller.rb
│   │       └── sync_controller.rb
│   ├── models/
│   │   ├── account.rb
│   │   ├── tag.rb
│   │   ├── sequence.rb
│   │   ├── subscriber.rb
│   │   ├── subscriber_tag.rb
│   │   ├── subscriber_sequence.rb
│   │   ├── journey_flow.rb
│   │   └── analysis_run.rb
│   └── services/
│       ├── kit_service.rb           # Kit API integration
│       └── analysis_service.rb      # Journey analysis logic
├── config/
│   ├── application.rb
│   ├── database.yml
│   ├── routes.rb
│   ├── environments/
│   └── initializers/
│       ├── cors.rb                  # CORS configuration
│       ├── omniauth.rb              # OAuth setup
│       └── session_store.rb         # Session cookies
├── db/
│   └── migrate/                     # Database migrations
├── lib/
│   └── omniauth-kit.rb              # Custom Kit OAuth strategy
├── Gemfile
└── README.md
```

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/auth/kit` | Initiate Kit OAuth flow |
| GET | `/auth/kit/callback` | OAuth callback |
| GET | `/auth/me` | Get current user |
| POST | `/auth/logout` | Logout |

### API (Requires Authentication)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/api/account` | Get Kit account info |
| POST | `/api/sync` | Sync data from Kit |
| GET | `/api/sync/status` | Get sync status |
| GET | `/api/journey/flows` | Get journey flow data |
| POST | `/api/journey/analyze` | Analyze journeys |
| GET | `/api/dashboard/metrics` | Get dashboard metrics |

## Database Models

### Account
Stores Kit account information and OAuth tokens.

### Tag
Cached tag data from Kit.

### Sequence
Cached sequence data from Kit.

### Subscriber
Cached subscriber data.

### SubscriberTag
Join table: Subscribers ↔ Tags.

### SubscriberSequence
Join table: Subscribers ↔ Sequences.

### JourneyFlow
Analyzed journey flow data showing subscriber movement patterns.

### AnalysisRun
Metadata about analysis runs.

## Development

### Running Migrations

```bash
# Create a new migration
rails generate migration MigrationName

# Run pending migrations
rails db:migrate

# Rollback last migration
rails db:rollback

# Reset database
rails db:reset
```

### Rails Console

```bash
# Open Rails console
rails console

# Example queries
Account.first
Tag.where(account_id: 1).count
Subscriber.active.limit(10)
```

### Running Tests

```bash
# Run all tests
bundle exec rspec

# Run specific test file
bundle exec rspec spec/models/account_spec.rb
```

## Using with ngrok (for HTTPS OAuth)

Since Kit requires HTTPS for OAuth callbacks:

1. **Start ngrok:**
   ```bash
   ngrok http 3001
   ```

2. **Update .env:**
   ```env
   API_BASE_URL=https://your-ngrok-url.ngrok-free.app
   ```

3. **Update Kit app redirect URI:**
   ```
   https://your-ngrok-url.ngrok-free.app/auth/kit/callback
   ```

4. **Restart Rails server**

## Troubleshooting

### Database connection errors

```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Check database exists
psql -U postgres -l | grep kit_journey

# Recreate database
rails db:drop db:create db:migrate
```

### OAuth errors

- Ensure redirect URI in Kit app matches exactly
- Check `KIT_CLIENT_ID` and `KIT_CLIENT_SECRET` in `.env`
- Verify `API_BASE_URL` is correct (http vs https)

### Session/Cookie issues

- Check `SECRET_KEY_BASE` is set
- Ensure `FRONTEND_URL` matches your frontend
- When using ngrok, `API_BASE_URL` must start with `https`

### Migration errors

```bash
# Reset migrations
rails db:migrate:reset

# Check migration status
rails db:migrate:status
```

## Production Deployment

### Environment Variables

Set these in production:

```env
RAILS_ENV=production
SECRET_KEY_BASE=<generate with: rails secret>
API_BASE_URL=https://your-api-domain.com
FRONTEND_URL=https://your-frontend-domain.com
DATABASE_URL=postgresql://user:pass@host:port/dbname
```

### Precompile (if using assets)

```bash
RAILS_ENV=production rails assets:precompile
```

### Database Setup

```bash
RAILS_ENV=production rails db:create db:migrate
```

### Start Server

```bash
# With Puma
RAILS_ENV=production bundle exec puma -C config/puma.rb

# Or with systemd/passenger/etc based on your deployment
```

## Comparison with Node.js Backend

This Rails backend provides the same functionality as the Node.js/Express backend but with:

✅ **Advantages:**
- Convention over configuration
- Built-in ORM (ActiveRecord) vs raw SQL
- Less boilerplate code
- Integrated migrations
- Built-in environment management
- Strong MVC structure

📝 **Similar Features:**
- Same API endpoints
- Same OAuth flow
- Same database schema
- Same business logic

Choose based on your team's expertise and preferences!

## Contributing

1. Create a feature branch
2. Make your changes
3. Write tests
4. Submit a pull request

## License

MIT

---

Built with Rails 7.1 and ❤️
