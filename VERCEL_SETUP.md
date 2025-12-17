# Vercel Deployment Setup

## Required Environment Variables

To deploy on Vercel, you need to set the following environment variables in your Vercel project settings:

### 1. FIREBASE_SERVICE_ACCOUNT (REQUIRED)

This should contain the **entire JSON content** of your Firebase service account key file.

**Steps:**
1. Go to Firebase Console → Project Settings → Service Accounts
2. Click "Generate New Private Key" (or use existing one)
3. Copy the entire JSON content
4. In Vercel Dashboard → Your Project → Settings → Environment Variables
5. Add new variable:
   - **Name:** `FIREBASE_SERVICE_ACCOUNT`
   - **Value:** Paste the entire JSON content (as a single-line string, minified)
   - **Environment:** Production, Preview, Development (select all)

**Example format:**
```
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"maple-educators-app",...}
```

### 2. Optional Firebase Configuration

These will use defaults if not set, but you can override them:

- `FIREBASE_PROJECT_ID` - Default: `maple-educators-app`
- `FIREBASE_STORAGE_BUCKET` - Default: `maple-educators-app.firebasestorage.app`
- `FIREBASE_API_KEY` - Default: `AIzaSyDyL_aadGzyozNjU6QKoRgHjJ_jxlwWJxU`
- `FIREBASE_AUTH_DOMAIN` - Default: `maple-educators-app.firebaseapp.com`

### 3. Gmail Email Configuration (Optional)

If you want to use different email credentials:

- `GMAIL_USER` - Default: `Petwego747@gmail.com`
- `GMAIL_APP_PASSWORD` - Default: `ydss yjxf ztta rcay`

### 4. JWT Secret (Optional)

- `JWT_SECRET` - Default: `rehan8080`

**Important:** For production, use a strong random secret!

### 5. Server Configuration (Optional)

- `PORT` - Default: `4000` (Vercel sets this automatically)
- `NODE_ENV` - Default: `production` (Vercel sets this automatically)

## Quick Setup Checklist

1. ✅ Set `FIREBASE_SERVICE_ACCOUNT` environment variable in Vercel
2. ✅ (Optional) Set `GMAIL_USER` and `GMAIL_APP_PASSWORD` if using different email
3. ✅ (Optional) Set `JWT_SECRET` for production security
4. ✅ Deploy!

## Deployment Steps

1. **Install Vercel CLI** (if not already installed):
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Link your project**:
   ```bash
   vercel link
   ```

4. **Set environment variables** (via Vercel Dashboard or CLI):
   ```bash
   vercel env add FIREBASE_SERVICE_ACCOUNT
   # Paste your Firebase service account JSON when prompted
   ```

5. **Deploy**:
   ```bash
   vercel --prod
   ```

## Environment Variables Reference

All environment variables with their defaults:

| Variable | Required | Default Value | Description |
|----------|----------|---------------|-------------|
| `FIREBASE_SERVICE_ACCOUNT` | ✅ Yes | None | Firebase service account JSON |
| `FIREBASE_PROJECT_ID` | No | `maple-educators-app` | Firebase project ID |
| `FIREBASE_STORAGE_BUCKET` | No | `maple-educators-app.firebasestorage.app` | Firebase storage bucket |
| `GMAIL_USER` | No | `Petwego747@gmail.com` | Gmail address for sending emails |
| `GMAIL_APP_PASSWORD` | No | `ydss yjxf ztta rcay` | Gmail app password |
| `JWT_SECRET` | No | `rehan8080` | JWT secret key for authentication |
| `PORT` | No | `4000` | Server port (auto-set by Vercel) |
| `NODE_ENV` | No | `production` | Node environment (auto-set by Vercel) |

## Troubleshooting

### Error: "Unable to detect a Project Id"

This means the Firebase service account JSON is not properly set. Make sure:
- The `FIREBASE_SERVICE_ACCOUNT` environment variable contains valid JSON
- The JSON includes the `project_id` field
- The variable is set for the correct environment (Production/Preview)
- The JSON is minified (single line, no extra spaces)

### Email Not Sending

Check:
- `GMAIL_USER` is set correctly
- `GMAIL_APP_PASSWORD` is a valid app password (not regular password)
- App password has no spaces in Vercel (remove spaces: `ydssyjxfzttarcay`)

### Testing Locally with Vercel

To test with Vercel environment locally:
```bash
vercel dev
```

This will use your Vercel environment variables locally.

## Security Notes

- ✅ Never commit `.env` files or `firebase/serviceAccountKey.json` to git
- ✅ Use strong `JWT_SECRET` in production
- ✅ Rotate Gmail app passwords regularly
- ✅ Keep Firebase service account keys secure
