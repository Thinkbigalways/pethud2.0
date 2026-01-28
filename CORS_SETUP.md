# Firebase Storage CORS Configuration Guide

## Why CORS Configuration is Needed

When uploading files directly from the browser to Firebase Storage, you need to configure CORS (Cross-Origin Resource Sharing) on your storage bucket. Without this, you'll get CORS errors when trying to upload videos or large files.

**This is a one-time setup** that needs to be done before deploying or when setting up a new environment.

## Finding Your Firebase Storage Bucket

Your bucket name is: **`pethud-d7a21.firebasestorage.app`**

### Option 1: Firebase Console (Easiest)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **pethud-d7a21**
3. Click on **Storage** in the left sidebar
4. You should see your storage bucket there
5. If you don't see Storage, you may need to enable it first:
   - Click "Get started" if Storage is not enabled
   - Choose "Start in test mode" or "Start in production mode"
   - Select a location for your bucket

### Option 2: Google Cloud Console

1. Go to [Google Cloud Console - Storage](https://console.cloud.google.com/storage/browser)
2. **Important:** Make sure you're in the correct project:
   - Click the project dropdown at the top
   - Select **pethud-d7a21**
3. You should see your bucket listed
4. If you don't see it, it might be because:
   - You're in the wrong project
   - Storage hasn't been initialized yet
   - The bucket uses the `.firebasestorage.app` domain (newer Firebase projects)

## Method 1: Using Firebase Admin SDK (Recommended - No gcloud CLI needed)

This is the easiest method and uses your existing Firebase credentials:

```bash
node setup-cors.js
```

This script will:
- Use your existing `FIREBASE_SERVICE_ACCOUNT` from `.env.local`
- Configure CORS automatically
- Show you the current CORS configuration

**Requirements:**
- Your service account needs **Storage Admin** role
- If you get permission errors, go to [IAM & Admin](https://console.cloud.google.com/iam-admin/iam) and add the role

## Method 2: Using gcloud CLI

If you prefer using gcloud CLI:

1. **Install Google Cloud SDK:**
   ```bash
   # On Ubuntu/Debian
   curl https://sdk.cloud.google.com | bash
   exec -l $SHELL
   
   # Or download from: https://cloud.google.com/sdk/docs/install
   ```

2. **Authenticate:**
   ```bash
   gcloud auth login
   ```

3. **Set your project:**
   ```bash
   gcloud config set project pethud-d7a21
   ```

4. **Install gsutil component:**
   ```bash
   gcloud components install gsutil
   ```

5. **Run the configuration script:**
   ```bash
   node configure-cors.js
   ```

## Method 3: Manual Configuration via Google Cloud Console

1. Go to [Google Cloud Console - Storage](https://console.cloud.google.com/storage/browser)
2. **Make sure you're in project: pethud-d7a21**
3. Click on your bucket: `pethud-d7a21.firebasestorage.app` (or `pethud-d7a21.appspot.com`)
4. Click on the **"Configuration"** tab
5. Scroll down to **"CORS configuration"**
6. Click **"Edit CORS configuration"**
7. Paste this JSON:
   ```json
   [
     {
       "origin": ["*"],
       "method": ["GET", "HEAD", "PUT", "POST", "DELETE"],
       "responseHeader": ["Content-Type", "Access-Control-Allow-Origin", "x-goog-resumable"],
       "maxAgeSeconds": 3600
     }
   ]
   ```
8. Click **"Save"**

## Method 4: Using Firebase Console (if available)

Some Firebase Console versions have CORS configuration:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: **pethud-d7a21**
3. Click **Storage**
4. Look for **Settings** or **Configuration** option
5. Find **CORS** settings
6. Add the CORS configuration

## Verify CORS is Configured

After configuring, test by uploading a video file. If you still get CORS errors:

1. Check the browser console for the exact error
2. Verify the bucket name matches: `pethud-d7a21.firebasestorage.app`
3. Make sure you saved the CORS configuration
4. Wait a few minutes for changes to propagate

## Production Security Note

For production, replace `"origin": ["*"]` with your specific domain:

```json
"origin": ["https://yourdomain.com", "https://www.yourdomain.com"]
```

This restricts uploads to only come from your website.

## Troubleshooting

### "Bucket not found" error
- Make sure Storage is enabled in Firebase Console
- Verify the bucket name in Firebase Console → Storage
- Check that you're using the correct project

### "Permission denied" error
- Go to [IAM & Admin](https://console.cloud.google.com/iam-admin/iam)
- Find your service account: `firebase-adminsdk-fbsvc@pethud-d7a21.iam.gserviceaccount.com`
- Add role: **Storage Admin**

### Still getting CORS errors after configuration
- Clear browser cache
- Wait 2-5 minutes for changes to propagate
- Check that the CORS config was saved correctly
- Verify you're using the correct bucket name
