# Quick Start Guide

Get up and running with Kit Journey Visualizer in 5 minutes!

## Prerequisites Check

```bash
# Check Node.js version (need >= 18)
node --version

# Check PostgreSQL installation
psql --version

# Check npm version (need >= 9)
npm --version
```

## 1. Install Dependencies

```bash
# Install all dependencies at once (from project root)
npm run install:all

# Or install separately:
cd backend && npm install
cd ../frontend && npm install
```

## 2. Setup PostgreSQL Database

```bash
# Create database
psql -U postgres -c "CREATE DATABASE kit_journey_visualizer;"

# Verify it was created
psql -U postgres -c "\l" | grep kit_journey_visualizer
```

## 3. Configure Environment Variables

```bash
# Backend
cd backend
cp .env.example .env

# Frontend
cd ../frontend
cp .env.example .env
```

**Important:** Edit `backend/.env` and add:
- Your PostgreSQL password for `DB_PASSWORD`
- Kit API credentials: `KIT_CLIENT_ID` and `KIT_CLIENT_SECRET`
- Generate a session secret: `openssl rand -base64 32`

## 4. Get Kit API Credentials

1. Visit: https://app.kit.com/account_settings/integrations
2. Create a new app with:
   - Redirect URI: `http://localhost:3001/auth/kit/callback`
   - Scopes: `subscribers:read`, `tags:read`, `sequences:read`
3. Copy Client ID and Secret to `backend/.env`

## 5. Run Database Migrations

```bash
cd backend
npm run migrate
```

Expected output:
```
Starting database migrations...
Running migration: 001_initial_schema.sql
✓ Migration 001_initial_schema.sql completed successfully
All migrations completed successfully!
```

## 6. Start the Application

**Option A: Start both at once (from project root)**
```bash
npm run dev
```

**Option B: Start separately**

Terminal 1 (Backend):
```bash
cd backend
npm run dev
```

Terminal 2 (Frontend):
```bash
cd frontend
npm run dev
```

## 7. Open and Use

1. Open http://localhost:5173 in your browser
2. Click "Connect with Kit"
3. Authorize the app
4. Click "Sync Data from Kit" on the dashboard
5. Click "Analyze Journeys" after sync completes

## Common Issues

### "Port 3001 already in use"
```bash
# Find and kill the process
lsof -ti:3001 | xargs kill -9
```

### "Database connection failed"
- Check PostgreSQL is running: `brew services list` (Mac) or `systemctl status postgresql` (Linux)
- Verify credentials in `backend/.env`

### "OAuth redirect error"
- Ensure redirect URI in Kit app settings exactly matches: `http://localhost:3001/auth/kit/callback`
- Check `KIT_CLIENT_ID` and `KIT_CLIENT_SECRET` in `.env`

### "Cannot find module 'xyz'"
- Run `npm install` in both backend and frontend directories

## Next Steps

- Read the full [README.md](./README.md) for detailed information
- Explore the API endpoints
- Start building the visualization component!

## Useful Commands

```bash
# Check backend health
curl http://localhost:3001/health

# View backend logs
tail -f backend/logs/combined.log

# Rebuild frontend
cd frontend && npm run build

# Rollback last migration (if needed)
cd backend && npm run migrate:rollback
```
