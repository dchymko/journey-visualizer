# Quick Setup Guide - Rails Backend

## Prerequisites

Make sure you have:
- Ruby 3.2+ installed (`ruby -v`)
- PostgreSQL installed and running
- Bundler installed (`gem install bundler`)

## Setup Steps

### 1. Install Dependencies

```bash
cd backend/rails
bundle install
```

### 2. Configure Environment

```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your settings
nano .env  # or use your preferred editor
```

**Required settings:**
- `DB_PASSWORD` - Your PostgreSQL password
- `KIT_CLIENT_ID` - From Kit app settings
- `KIT_CLIENT_SECRET` - From Kit app settings
- `SECRET_KEY_BASE` - Generate with `rails secret`

### 3. Setup Database

```bash
# Create database
rails db:create

# Run migrations
rails db:migrate
```

### 4. Start Server

```bash
# Option 1: Using rails command
rails server -p 3001

# Option 2: Using start script
./start.sh

# Option 3: Using bundle exec
bundle exec rails s -p 3001
```

Server will be running at `http://localhost:3001`

Test it: `curl http://localhost:3001/health`

## Verify Installation

```bash
# Check all endpoints are working
curl http://localhost:3001/health

# Should return:
# {"status":"ok","timestamp":"...","environment":"development"}
```

## Common Issues

### "Could not connect to server"
- Check PostgreSQL is running: `sudo systemctl status postgresql`
- Or on Mac: `brew services list`

### "Gem::LoadError"
- Run `bundle install` again
- Make sure you're using Ruby 3.2+

### "database does not exist"
- Run `rails db:create`

### "PG::ConnectionBad"
- Check database credentials in `.env`
- Try connecting manually: `psql -U postgres -h localhost`

## Next Steps

1. Test OAuth flow with the frontend
2. Try syncing data from Kit
3. Run journey analysis

## Development Workflow

```bash
# Open Rails console
rails console

# Run migrations
rails db:migrate

# Rollback migration
rails db:rollback

# Reset database
rails db:reset

# Check routes
rails routes

# Run tests (when added)
bundle exec rspec
```

## Using with ngrok

For HTTPS OAuth (required by Kit):

```bash
# Terminal 1: Start Rails
rails s -p 3001

# Terminal 2: Start ngrok
ngrok http 3001

# Update .env with ngrok URL
API_BASE_URL=https://abc123.ngrok-free.app

# Update Kit app redirect URI
https://abc123.ngrok-free.app/auth/kit/callback

# Restart Rails server
```

---

Need help? Check the main README.md or the Node.js backend for comparison.
