# PetHub Deployment Guide

## Files to Upload to Server
Upload these files/folders to your server's public_html directory:

### Core Application Files
- `app.js` - Main Express application
- `bin/www` - Server startup script
- `package.json` - Dependencies and scripts
- `db.js` - Database configuration

### Directories
- `controller/` - All controller files
- `middlewares/` - Authentication and middleware files
- `routes/` - All route files
- `views/` - EJS templates
- `public/` - Static assets (CSS, JS, images)
- `uploads/` - User uploaded files
- `utils/` - Utility functions

### Files to Exclude
- `node_modules/` - Will be installed on server
- `.DS_Store` - macOS system files
- `app.log` - Local log files
- `tmp/` - Temporary files

## Server Requirements
- Node.js (version 14 or higher)
- MySQL database
- npm package manager

## Database
- Host: pethudl.com
- Database: pethudl
- User: pethudl
- Password: B@lsal8080

## Next Steps
1. Upload files via cPanel File Manager
2. Install dependencies: `npm install`
3. Create database tables
4. Configure server to run Node.js
5. Connect domain

