# PetHub Deployment Guide

## Deployment Options

### Option 1: Vercel (Recommended)

See [VERCEL_SETUP.md](./VERCEL_SETUP.md) for detailed Vercel deployment instructions.

**Advantages:**
- Serverless functions (no server management)
- Automatic scaling
- Built-in CDN
- Easy environment variable management
- Free tier available

### Option 2: Traditional Server (cPanel/VPS)

For deploying to a traditional server (cPanel, VPS, etc.):

#### Files to Upload to Server

Upload these files/folders to your server:

**Core Application Files:**
- `app.js` - Main Express application
- `server.js` - Server entry point
- `bin/www` - Server startup script
- `package.json` - Dependencies and scripts
- `db.js` - Database configuration (if using)
- `vercel.json` - Configuration (if needed)

**Directories:**
- `controller/` - All controller files
- `middlewares/` - Authentication and middleware files
- `routes/` - All route files
- `views/` - EJS templates
- `public/` - Static assets (CSS, JS, images)
- `utils/` - Utility functions
- `firebase/` - Firebase configuration (config.js only, no service account keys)

**Files to Exclude:**
- `node_modules/` - Will be installed on server
- `.env.local` - Environment variables (set on server)
- `.git/` - Git repository
- `gcloud/` - Google Cloud SDK (if present)
- All files in `.gitignore`

#### Server Requirements

- **Node.js**: Version 20.0.0 or higher
- **npm**: Latest version
- **Firebase**: Firestore and Storage enabled
- **PM2** (recommended): For process management

#### Setup Steps

1. **Upload files** to your server (via FTP, cPanel File Manager, or Git)

2. **Install dependencies:**
   ```bash
   npm install --production
   ```

3. **Set environment variables:**
   Create a `.env` file on the server with:
   - `FIREBASE_SERVICE_ACCOUNT`: Your Firebase service account JSON
   - `FIREBASE_PROJECT_ID`: Your Firebase project ID
   - `FIREBASE_STORAGE_BUCKET`: Your Firebase Storage bucket
   - `JWT_SECRET`: A strong random string
   - Other required variables (see `.env.example`)

4. **Configure CORS:**
   ```bash
   node setup-cors.js
   ```

5. **Start the application:**
   
   **Using PM2 (recommended):**
   ```bash
   npm install -g pm2
   pm2 start server.js --name pethub
   pm2 save
   pm2 startup
   ```
   
   **Using npm:**
   ```bash
   npm start
   ```
   
   **Using node directly:**
   ```bash
   node server.js
   ```

6. **Configure reverse proxy** (if using Nginx/Apache):
   - Point to `http://localhost:4000` (or your configured PORT)
   - Enable SSL/HTTPS

#### Environment Variables

**⚠️ Important:** Never commit sensitive information like:
- Firebase service account keys
- Database passwords
- JWT secrets
- API keys

Store these in environment variables on your server.

#### Process Management

**PM2** is recommended for production:

```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start server.js --name pethub

# Save PM2 configuration
pm2 save

# Setup PM2 to start on server reboot
pm2 startup

# View logs
pm2 logs pethub

# Restart application
pm2 restart pethub

# Stop application
pm2 stop pethub
```

## Post-Deployment Checklist

- [ ] Environment variables configured
- [ ] CORS configured for Firebase Storage
- [ ] Application starts without errors
- [ ] Firebase connection working
- [ ] File uploads working
- [ ] SSL/HTTPS enabled
- [ ] Domain configured
- [ ] Monitoring/logging set up

## Troubleshooting

### Application won't start
- Check Node.js version: `node --version` (should be >= 20.0.0)
- Check environment variables are set
- Check Firebase credentials are correct
- Check port is not already in use

### File uploads not working
- Verify CORS is configured: `node setup-cors.js`
- Check Firebase Storage bucket permissions
- Verify service account has Storage Admin role

### Database errors
- Verify Firestore is enabled in Firebase Console
- Check service account has Firestore permissions
- Verify project ID is correct

