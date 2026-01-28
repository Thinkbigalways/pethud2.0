/**
 * CORS Configuration Script for Firebase Storage
 * 
 * This script configures CORS on your Firebase Storage bucket to allow
 * direct browser uploads. Run this once to set up CORS.
 * 
 * Prerequisites:
 * 1. Install gcloud CLI: https://cloud.google.com/sdk/docs/install
 * 2. Authenticate: gcloud auth login
 * 3. Set your project: gcloud config set project YOUR_PROJECT_ID
 * 
 * Usage:
 * node configure-cors.js
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

// Get bucket name from environment or config
const bucketName = process.env.FIREBASE_STORAGE_BUCKET || 'pethud-d7a21.appspot.com';

// CORS configuration JSON
const corsConfig = {
  cors: [
    {
      origin: ['*'], // In production, replace with your domain: ['https://yourdomain.com']
      method: ['GET', 'HEAD', 'PUT', 'POST', 'DELETE'],
      responseHeader: ['Content-Type', 'Access-Control-Allow-Origin'],
      maxAgeSeconds: 3600
    }
  ]
};

// Write CORS config to temp file
const tempFile = path.join(__dirname, 'cors-config.json');
fs.writeFileSync(tempFile, JSON.stringify(corsConfig, null, 2));

console.log('Configuring CORS for Firebase Storage bucket...');
console.log(`Bucket: ${bucketName}`);
console.log('');

try {
  // Apply CORS configuration using gcloud
  const command = `gsutil cors set ${tempFile} gs://${bucketName}`;
  console.log(`Running: ${command}`);
  execSync(command, { stdio: 'inherit' });
  
  console.log('');
  console.log('✅ CORS configuration applied successfully!');
  console.log('');
  console.log('Note: For production, update the "origin" field in cors-config.json');
  console.log('to restrict uploads to your specific domain for better security.');
} catch (error) {
  console.error('');
  console.error('❌ Failed to configure CORS:');
  console.error(error.message);
  console.error('');
  console.error('Make sure you have:');
  console.error('1. Installed gcloud CLI');
  console.error('2. Authenticated: gcloud auth login');
  console.error('3. Set your project: gcloud config set project YOUR_PROJECT_ID');
  console.error('4. Installed gsutil: gcloud components install gsutil');
} finally {
  // Clean up temp file
  if (fs.existsSync(tempFile)) {
    fs.unlinkSync(tempFile);
  }
}
