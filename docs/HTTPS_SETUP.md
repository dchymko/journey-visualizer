# HTTPS Setup for Local Development

Since Kit requires HTTPS for OAuth callbacks, you need to set up HTTPS for local development.

## Option 1: ngrok (Recommended for Quick Testing)

### Setup
```bash
# Install ngrok
brew install ngrok
# OR download from https://ngrok.com/download

# Start your backend
cd backend
npm run dev

# In a new terminal, create tunnel
ngrok http 3001
```

### Configuration

1. Copy the HTTPS URL from ngrok (e.g., `https://abc123.ngrok.io`)

2. Update `backend/.env`:
```env
KIT_REDIRECT_URI=https://YOUR-NGROK-URL.ngrok.io/auth/kit/callback
API_BASE_URL=https://YOUR-NGROK-URL.ngrok.io
```

3. Update `frontend/.env`:
```env
VITE_API_BASE_URL=https://YOUR-NGROK-URL.ngrok.io
```

4. Update Kit app redirect URI:
   - Go to https://app.kit.com/account_settings/integrations
   - Set redirect URI to: `https://YOUR-NGROK-URL.ngrok.io/auth/kit/callback`

5. Restart both servers

6. Access app at `http://localhost:5173`

**Note:** Free ngrok URLs change each time you restart. Consider ngrok paid plan for fixed URLs.

---

## Option 2: mkcert (Best for Regular Development)

### Install mkcert

**Mac:**
```bash
brew install mkcert
mkcert -install
```

**Linux:**
```bash
# Install certutil first
sudo apt install libnss3-tools
# OR
sudo yum install nss-tools

# Install mkcert
curl -JLO "https://dl.filippo.io/mkcert/latest?for=linux/amd64"
chmod +x mkcert-v*-linux-amd64
sudo mv mkcert-v*-linux-amd64 /usr/local/bin/mkcert
mkcert -install
```

**Windows:**
```bash
choco install mkcert
mkcert -install
```

### Generate Certificates

```bash
# From project root
mkdir -p backend/ssl
cd backend/ssl

# Generate certificate for localhost
mkcert localhost 127.0.0.1 ::1

# This creates:
# - localhost+2.pem (certificate)
# - localhost+2-key.pem (private key)
```

### Update Backend for HTTPS

Create `backend/src/server-https.js`:

```javascript
const https = require('https');
const fs = require('fs');
const path = require('path');
const app = require('./index');

const options = {
  key: fs.readFileSync(path.join(__dirname, '../ssl/localhost+2-key.pem')),
  cert: fs.readFileSync(path.join(__dirname, '../ssl/localhost+2.pem'))
};

const PORT = process.env.PORT || 3001;

https.createServer(options, app).listen(PORT, () => {
  console.log(`🚀 HTTPS Server running on https://localhost:${PORT}`);
});
```

Update `backend/package.json` scripts:
```json
{
  "scripts": {
    "start": "node src/index.js",
    "start:https": "node src/server-https.js",
    "dev": "nodemon src/index.js",
    "dev:https": "nodemon src/server-https.js"
  }
}
```

### Update Configuration

1. Update `backend/.env`:
```env
KIT_REDIRECT_URI=https://localhost:3001/auth/kit/callback
API_BASE_URL=https://localhost:3001
```

2. Update `frontend/.env`:
```env
VITE_API_BASE_URL=https://localhost:3001
```

3. Update Kit app redirect URI to: `https://localhost:3001/auth/kit/callback`

### Run with HTTPS

```bash
# Backend
cd backend
npm run dev:https

# Frontend (in new terminal)
cd frontend
npm run dev
```

Access your app at `http://localhost:5173`

---

## Option 3: localhost.run (No Installation Required)

```bash
# Start your backend
cd backend
npm run dev

# In new terminal
ssh -R 80:localhost:3001 localhost.run
```

Follow the same configuration steps as ngrok, using the HTTPS URL provided.

---

## Troubleshooting

### ngrok: "Too Many Connections"
- Free tier has connection limits
- Restart ngrok to get a new session

### mkcert: "Certificate not trusted"
- Run `mkcert -install` again
- Restart your browser
- Check that certificates are in the correct location

### Kit OAuth: "Redirect URI mismatch"
- Ensure redirect URI in Kit app matches exactly
- No trailing slashes
- Check protocol (http vs https)
- Restart backend after changing .env

### CORS Errors with ngrok/HTTPS
- Make sure `FRONTEND_URL` in backend `.env` is set correctly
- Update CORS origin if needed
- Clear browser cache

---

## Production Deployment

For production, you'll need:
1. A domain name
2. Valid SSL certificate (Let's Encrypt via Certbot)
3. Update all environment variables to production URLs
4. Add production redirect URI to Kit app settings

Example production redirect URI:
```
https://api.yourdomain.com/auth/kit/callback
```
