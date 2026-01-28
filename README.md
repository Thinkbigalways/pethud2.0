# PetHub 2.0

A social media platform for pet lovers built with Node.js, Express, Firebase, and EJS.

## Features

- 🐾 **Social Feed**: Share posts, photos, and videos of your pets
- 💬 **Comments & Likes**: Engage with the community
- 👥 **User Profiles**: Customizable profiles with cover photos
- 🔍 **Search**: Find other pet owners and posts
- 🛒 **Marketplace**: Buy and sell pet-related items
- 🔔 **Notifications**: Stay updated with real-time notifications
- 📱 **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: Firebase Firestore
- **Storage**: Firebase Storage (for images and videos)
- **Authentication**: JWT (JSON Web Tokens)
- **Template Engine**: EJS
- **Styling**: Bootstrap 5
- **Deployment**: Vercel (serverless functions)

## Prerequisites

- Node.js >= 20.0.0
- npm or yarn
- Firebase project with:
  - Firestore Database enabled
  - Storage enabled
  - Service Account with Storage Admin permissions

## Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd pethud2.0
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` and add your Firebase credentials:
   - `FIREBASE_SERVICE_ACCOUNT`: Your Firebase service account JSON (as a single-line string)
   - `FIREBASE_PROJECT_ID`: Your Firebase project ID
   - `FIREBASE_STORAGE_BUCKET`: Your Firebase Storage bucket name
   - `JWT_SECRET`: A strong random string for JWT signing
   - Other optional variables (see `.env.example`)

4. **Configure Firebase Storage CORS:**
   ```bash
   node setup-cors.js
   ```
   This is required for direct browser uploads (especially videos). See [CORS_SETUP.md](./CORS_SETUP.md) for details.

5. **Start the development server:**
   ```bash
   npm run dev
   ```

6. **Open your browser:**
   Navigate to `http://localhost:4000`

## Project Structure

```
pethud2.0/
├── controller/          # Route controllers
│   ├── postController.js
│   ├── profileController.js
│   ├── marketplaceController.js
│   └── ...
├── routes/              # Express routes
│   ├── posts.js
│   ├── users.js
│   └── ...
├── views/               # EJS templates
│   ├── index.ejs
│   ├── profile.ejs
│   └── ...
├── middlewares/         # Express middlewares
│   ├── auth.js
│   └── ...
├── firebase/            # Firebase configuration
│   └── config.js
├── utils/               # Utility functions
│   ├── firestoreHelpers.js
│   └── mailer.js
├── public/              # Static assets
│   ├── images/
│   └── stylesheets/
└── server.js            # Entry point
```

## Environment Variables

See `.env.example` for all available environment variables. Key variables:

- `FIREBASE_SERVICE_ACCOUNT`: Firebase service account JSON (required)
- `FIREBASE_PROJECT_ID`: Firebase project ID
- `FIREBASE_STORAGE_BUCKET`: Firebase Storage bucket name
- `JWT_SECRET`: Secret key for JWT tokens
- `GMAIL_USER`: Gmail address for sending emails
- `GMAIL_APP_PASSWORD`: Gmail app password

## Deployment

### Vercel Deployment

See [VERCEL_SETUP.md](./VERCEL_SETUP.md) for detailed deployment instructions.

Quick steps:
1. Install Vercel CLI: `npm i -g vercel`
2. Login: `vercel login`
3. Link project: `vercel link`
4. Set environment variables in Vercel Dashboard
5. Deploy: `vercel --prod`

### Important: Configure CORS

Before deploying, make sure to configure CORS on your Firebase Storage bucket:

```bash
node setup-cors.js
```

See [CORS_SETUP.md](./CORS_SETUP.md) for detailed instructions.

## Features Documentation

### File Uploads

The application supports direct client-side uploads to Firebase Storage to avoid Vercel's 4.5MB payload limit. Large files (especially videos) are uploaded directly from the browser to Firebase Storage.

### Authentication

Uses JWT (JSON Web Tokens) for authentication. Tokens are stored in HTTP-only cookies for security.

### Database

Uses Firebase Firestore for data storage:
- `users`: User profiles and settings
- `posts`: User posts with media
- `marketplace_ads`: Marketplace listings
- Other collections as needed

## Scripts

- `npm run dev`: Start development server
- `npm start`: Start production server
- `node setup-cors.js`: Configure CORS for Firebase Storage

## Security Notes

- ✅ Never commit `.env.local` or Firebase service account keys
- ✅ Use strong `JWT_SECRET` in production
- ✅ Configure CORS with specific origins in production
- ✅ Keep Firebase service account keys secure
- ✅ Use environment variables for all sensitive data

## Troubleshooting

### CORS Errors

If you get CORS errors when uploading files:
1. Run `node setup-cors.js` to configure CORS
2. Wait 2-5 minutes for changes to propagate
3. Clear browser cache
4. See [CORS_SETUP.md](./CORS_SETUP.md) for detailed help

### Firebase Errors

- Make sure `FIREBASE_SERVICE_ACCOUNT` is set correctly
- Verify your service account has Storage Admin permissions
- Check that Firestore and Storage are enabled in Firebase Console

### Upload Errors

- Check file size limits (50MB max)
- Verify CORS is configured
- Check browser console for specific error messages

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

[Add your license here]

## Support

For issues and questions, please open an issue on GitHub.
