const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Firebase client-style config (for reference; admin uses service account)
const firebaseConfig = {
  apiKey: "AIzaSyDyL_aadGzyozNjU6QKoRgHjJ_jxlwWJxU",
  authDomain: "maple-educators-app.firebaseapp.com",
  projectId: "maple-educators-app",
  storageBucket: "maple-educators-app.firebasestorage.app",
  messagingSenderId: "782200920015",
  appId: "1:782200920015:web:7c87d1cb8868e7e02024ba",
  measurementId: "G-E4TB3CLH62"
};

/**
 * Initialize Firebase Admin SDK with a service account.
 *
 * Local/dev:
 *   - Place your service account JSON at: firebase/serviceAccountKey.json
 *   - DO NOT commit that file to git.
 *
 * Production:
 *   - Prefer GOOGLE_APPLICATION_CREDENTIALS or an env var containing the JSON.
 */
if (!admin.apps.length) {
  let initialized = false;

  // 1) Try local serviceAccountKey.json
  const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');
  if (fs.existsSync(serviceAccountPath)) {
    try {
      // eslint-disable-next-line global-require, import/no-dynamic-require
      const serviceAccount = require(serviceAccountPath);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: firebaseConfig.storageBucket,
      });
      initialized = true;
      console.log('Firebase Admin initialized with serviceAccountKey.json');
    } catch (err) {
      console.error('Failed to initialize Firebase Admin with serviceAccountKey.json:', err.message);
    }
  }

  // 2) Fallback: application default credentials (GOOGLE_APPLICATION_CREDENTIALS)
  if (!initialized) {
    try {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        storageBucket: firebaseConfig.storageBucket,
      });
      initialized = true;
      console.log('Firebase Admin initialized with application default credentials');
    } catch (err) {
      console.error('Firebase Admin initialization failed. No valid credentials found.');
      console.error('Set GOOGLE_APPLICATION_CREDENTIALS or add firebase/serviceAccountKey.json');
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


