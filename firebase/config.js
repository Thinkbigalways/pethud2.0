const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Firebase client-style config - use environment variables with fallbacks
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "AIzaSyDyL_aadGzyozNjU6QKoRgHjJ_jxlwWJxU",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "maple-educators-app.firebaseapp.com",
  projectId: process.env.FIREBASE_PROJECT_ID || "maple-educators-app",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "maple-educators-app.firebasestorage.app",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "782200920015",
  appId: process.env.FIREBASE_APP_ID || "1:782200920015:web:7c87d1cb8868e7e02024ba",
  measurementId: process.env.FIREBASE_MEASUREMENT_ID || "G-E4TB3CLH62"
};

/**
 * Initialize Firebase Admin SDK with a service account.
 *
 * Priority order:
 * 1. Environment variable FIREBASE_SERVICE_ACCOUNT (for Vercel/serverless)
 * 2. Local serviceAccountKey.json file (for local development)
 * 3. GOOGLE_APPLICATION_CREDENTIALS (for GCP environments)
 */
if (!admin.apps.length) {
  let initialized = false;

  // 1) Try environment variable (for Vercel/serverless)
  if (process.env.FIREBASE_SERVICE_ACCOUNT && !initialized) {
    try {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: firebaseConfig.projectId,
        storageBucket: firebaseConfig.storageBucket,
      });
      initialized = true;
      console.log('Firebase Admin initialized with FIREBASE_SERVICE_ACCOUNT environment variable');
    } catch (err) {
      console.error('Failed to initialize Firebase Admin with FIREBASE_SERVICE_ACCOUNT:', err.message);
    }
  }

  // 2) Try local serviceAccountKey.json (for local development)
  if (!initialized) {
    const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');
    if (fs.existsSync(serviceAccountPath)) {
      try {
        const serviceAccount = require(serviceAccountPath);
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          projectId: firebaseConfig.projectId,
          storageBucket: firebaseConfig.storageBucket,
        });
        initialized = true;
        console.log('Firebase Admin initialized with serviceAccountKey.json');
      } catch (err) {
        console.error('Failed to initialize Firebase Admin with serviceAccountKey.json:', err.message);
      }
    }
  }

  // 3) Fallback: application default credentials (GOOGLE_APPLICATION_CREDENTIALS)
  if (!initialized) {
    try {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: firebaseConfig.projectId,
        storageBucket: firebaseConfig.storageBucket,
      });
      initialized = true;
      console.log('Firebase Admin initialized with application default credentials');
    } catch (err) {
      console.error('Firebase Admin initialization failed. No valid credentials found.');
      console.error('Set FIREBASE_SERVICE_ACCOUNT env var, GOOGLE_APPLICATION_CREDENTIALS, or add firebase/serviceAccountKey.json');
    }
  }
}

// Firestore & Storage instances
const db = admin.firestore();
const storage = admin.storage();
const bucket = storage.bucket(firebaseConfig.storageBucket);

module.exports = {
  admin,
  db,
  storage,
  bucket,
  firebaseConfig
};
