# Kit Journey Visualizer

A powerful visualization tool for Kit.com (formerly ConvertKit) that helps email creators understand how their subscribers move through tags, sequences, and automations.

## Features

- 🔐 **OAuth 2.0 Integration** - Secure connection to Kit accounts
- 📊 **Interactive Dashboard** - View key metrics about your subscribers
- 🔄 **Data Synchronization** - Fetch tags, sequences, and subscriber data from Kit
- 📈 **Journey Analysis** - Analyze subscriber movement patterns between tags and sequences
- 🎯 **Flow Visualization** - (Coming soon) Interactive visual representation of subscriber journeys

## Tech Stack

### Backend
- **Node.js** with Express
- **PostgreSQL** for data storage
- **Passport.js** for OAuth authentication
- **Axios** for Kit API integration
- **Winston** for logging

### Frontend
- **React** 18
- **Vite** for fast development
- **React Router** for navigation
- **React Flow** (ready for journey visualization)
- **Axios** for API calls

## Prerequisites

- Node.js >= 18.0.0
- PostgreSQL >= 12
- Kit.com account with API access
- npm >= 9.0.0

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Database Setup

Create a PostgreSQL database:

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE kit_journey_visualizer;

# Exit psql
\q
```

### 3. Configure Environment Variables

#### Backend Configuration

Copy the example environment file and configure it:

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` with your settings:

```env
# Server Configuration
NODE_ENV=development
PORT=3001
API_BASE_URL=http://localhost:3001
FRONTEND_URL=http://localhost:5173

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=kit_journey_visualizer
DB_USER=postgres
DB_PASSWORD=your_password

# Session Secret (generate a random string)
SESSION_SECRET=your_random_session_secret_here

# Kit API Configuration
KIT_CLIENT_ID=your_kit_client_id
KIT_CLIENT_SECRET=your_kit_client_secret
KIT_REDIRECT_URI=http://localhost:3001/auth/kit/callback
KIT_API_BASE_URL=https://api.kit.com/v4

OAUTH_AUTHORIZATION_URL=https://app.kit.com/oauth/authorize
OAUTH_TOKEN_URL=https://api.kit.com/oauth/token
```

#### Frontend Configuration

```bash
cd ../frontend
cp .env.example .env
```

Edit `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:3001
VITE_APP_NAME=Kit Journey Visualizer
```

### 4. Get Kit API Credentials

1. Go to https://app.kit.com/account_settings/integrations
2. Click "Create New Application" or "New App"
3. Fill in the application details:
   - **Name**: Kit Journey Visualizer
   - **Redirect URI**: `http://localhost:3001/auth/kit/callback`
   - **Scopes**: Select the following:
     - `subscribers:read`
     - `tags:read`
     - `sequences:read`
     - `automation_rules:read`
4. Copy the **Client ID** and **Client Secret** to your `backend/.env` file

### 5. Run Database Migrations

```bash
cd backend
npm run migrate
```

You should see output confirming the migrations ran successfully.

### 6. Start the Application

Open two terminal windows:

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

You should see:
```
🚀 Kit Journey Visualizer API running on http://localhost:3001
📊 Health check: http://localhost:3001/health
🔐 OAuth flow: http://localhost:3001/auth/kit
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

You should see:
```
  VITE v5.0.8  ready in 500 ms

  ➜  Local:   http://localhost:5173/
```

### 7. Use the Application

1. Open your browser to http://localhost:5173
2. Click "Connect with Kit" to start the OAuth flow
3. Authorize the application in Kit
4. You'll be redirected to the dashboard
5. Click "Sync Data from Kit" to fetch your subscribers, tags, and sequences
6. Once synced, click "Analyze Journeys" to identify subscriber flow patterns

## Project Structure

```
journeymap/
├── backend/
│   ├── src/
│   │   ├── config/          # Configuration (logger, passport)
│   │   ├── controllers/     # Route controllers (future)
│   │   ├── db/
│   │   │   ├── migrations/  # Database migrations
│   │   │   ├── connection.js
│   │   │   └── migrate.js
│   │   ├── middleware/      # Express middleware
│   │   ├── models/          # Database models (future)
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic
│   │   └── index.js         # Express server
│   ├── tests/               # Backend tests
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/      # React components (future)
│   │   ├── contexts/        # React contexts (auth)
│   │   ├── hooks/           # Custom hooks (future)
│   │   ├── pages/           # Page components
│   │   ├── services/        # API services
│   │   ├── utils/           # Utility functions
│   │   ├── App.jsx          # Main app component
│   │   ├── main.jsx         # Entry point
│   │   └── index.css        # Global styles
│   ├── public/
│   ├── package.json
│   ├── vite.config.js
│   └── .env.example
├── docs/                    # Documentation
├── .gitignore
└── README.md
```

## API Endpoints

### Authentication
- `GET /auth/kit` - Initiate Kit OAuth flow
- `GET /auth/kit/callback` - OAuth callback
- `GET /auth/me` - Get current user
- `POST /auth/logout` - Logout

### API (Authenticated)
- `GET /api/health` - Health check
- `GET /api/account` - Get Kit account info
- `POST /api/sync` - Sync data from Kit
- `GET /api/sync/status` - Get sync status
- `GET /api/journey/flows` - Get journey flow data
- `POST /api/journey/analyze` - Analyze journeys
- `GET /api/dashboard/metrics` - Get dashboard metrics

## Database Schema

### Tables
- **accounts** - Kit account information and OAuth tokens
- **tags** - Cached tag data from Kit
- **sequences** - Cached sequence data from Kit
- **subscribers** - Cached subscriber data
- **subscriber_tags** - Many-to-many relationship between subscribers and tags
- **subscriber_sequences** - Many-to-many relationship between subscribers and sequences
- **journey_flows** - Analyzed journey flow data
- **analysis_runs** - Metadata about analysis runs
- **migrations** - Migration tracking

## Development

### Backend Development

```bash
cd backend
npm run dev  # Start with nodemon for auto-reload
```

### Frontend Development

```bash
cd frontend
npm run dev  # Start Vite dev server with HMR
```

### Running Tests

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

### Database Migrations

To create a new migration:
1. Create a new `.sql` file in `backend/src/db/migrations/`
2. Name it with an incrementing number: `002_description.sql`
3. Run `npm run migrate` to apply it

## Troubleshooting

### OAuth Redirect Errors
- Ensure your Kit app redirect URI exactly matches `http://localhost:3001/auth/kit/callback`
- Check that your Kit Client ID and Secret are correct in `.env`

### Database Connection Errors
- Verify PostgreSQL is running: `psql -U postgres`
- Check database credentials in `backend/.env`
- Ensure the database exists: `CREATE DATABASE kit_journey_visualizer;`

### CORS Errors
- Ensure `FRONTEND_URL` in backend `.env` matches your frontend URL
- Check that cookies are enabled in your browser

### Port Already in Use
```bash
# Find process using port 3001
lsof -ti:3001

# Kill the process
kill -9 <PID>
```

## Security Notes

- Never commit `.env` files to version control
- Always use HTTPS in production
- Rotate OAuth secrets regularly
- Set `NODE_ENV=production` in production
- Use strong session secrets (generate with `openssl rand -base64 32`)
- Implement rate limiting for production (already configured)

## Roadmap

### Current Version (v1.0)
- ✅ OAuth integration with Kit
- ✅ Data synchronization (tags, sequences, subscribers)
- ✅ Journey flow analysis
- ✅ Dashboard with metrics

### Future Versions
- 🔄 Interactive journey visualization with React Flow
- 🔄 Bottleneck identification
- 🔄 Webhook support for real-time updates
- 🔄 Export journey reports
- 🔄 Custom date range analysis
- 🔄 Comparison between time periods
- 🔄 Email notification for significant changes

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- Create an issue on GitHub
- Check Kit API documentation: https://developers.kit.com

## Deployment

### Production Considerations

1. **Environment Variables**
   - Set `NODE_ENV=production`
   - Use production database credentials
   - Set secure session secrets
   - Update `FRONTEND_URL` and `API_BASE_URL` to production URLs
   - Update Kit OAuth redirect URI to production URL

2. **Database**
   - Use connection pooling
   - Set up database backups
   - Consider read replicas for scaling

3. **Security**
   - Enable HTTPS only
   - Use environment-based secrets management
   - Implement proper logging and monitoring
   - Set up error tracking (e.g., Sentry)

4. **Scaling**
   - Use PM2 or similar for process management
   - Consider horizontal scaling with load balancers
   - Implement caching (Redis)
   - Set up CDN for frontend assets

## Acknowledgments

- Kit.com for providing the API
- React Flow for visualization capabilities
- The open-source community


