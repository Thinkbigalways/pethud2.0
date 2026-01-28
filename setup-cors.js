/**
 * Configure CORS for Firebase Storage using Firebase Admin SDK
 * This doesn't require gcloud CLI - it uses your existing Firebase credentials
 * 
 * Usage:
 * node setup-cors.js
 */

require('dotenv').config({ path: '.env.local' });
const { bucket } = require('./firebase/config');

async function configureCORS() {
  try {
    console.log('Configuring CORS for Firebase Storage bucket...');
    console.log(`Bucket: ${bucket.name}`);
    console.log('');

    // CORS configuration
    const corsConfig = [
      {
        origin: ['*'], // In production, replace with your domain: ['https://yourdomain.com']
        method: ['GET', 'HEAD', 'PUT', 'POST', 'DELETE'],
        responseHeader: ['Content-Type', 'Access-Control-Allow-Origin', 'x-goog-resumable'],
        maxAgeSeconds: 3600
      }
    ];

    // Set CORS configuration
    await bucket.setCorsConfiguration(corsConfig);

    console.log('✅ CORS configuration applied successfully!');
    console.log('');
    console.log('Current CORS configuration:');
    const [metadata] = await bucket.getMetadata();
    if (metadata.cors) {
      console.log(JSON.stringify(metadata.cors, null, 2));
    } else {
      console.log('(No CORS configuration found - this might mean it was set but not visible)');
    }
    console.log('');
    console.log('Note: For production, update the "origin" field to restrict uploads');
    console.log('to your specific domain for better security.');
    console.log('Example: ["https://yourdomain.com", "https://www.yourdomain.com"]');
    
  } catch (error) {
    console.error('');
    console.error('❌ Failed to configure CORS:');
    console.error(error.message);
    console.error('');
    
    if (error.code === 404) {
      console.error('Bucket not found. Make sure:');
      console.error(`1. The bucket "${bucket.name}" exists in your Firebase project`);
      console.error('2. Your FIREBASE_SERVICE_ACCOUNT has Storage Admin permissions');
      console.error('3. Check Firebase Console → Storage to see if the bucket exists');
    } else if (error.code === 403) {
      console.error('Permission denied. Make sure your service account has:');
      console.error('- Storage Admin role, or');
      console.error('- Storage.objects.create and Storage.buckets.get permissions');
    } else {
      console.error('Error details:', error);
    }
    
    process.exit(1);
  }
}

// Run the configuration
configureCORS();
