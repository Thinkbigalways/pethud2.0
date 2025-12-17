# Vercel Deployment Setup

## Required Environment Variables

To deploy on Vercel, you need to set the following environment variables in your Vercel project settings:

### 1. FIREBASE_SERVICE_ACCOUNT

This should contain the **entire JSON content** of your Firebase service account key file.

**Steps:**
1. Go to Firebase Console → Project Settings → Service Accounts
2. Click "Generate New Private Key" (or use existing one)
3. Copy the entire JSON content
4. In Vercel Dashboard → Your Project → Settings → Environment Variables
5. Add new variable:
   - **Name:** `FIREBASE_SERVICE_ACCOUNT`
   - **Value:** Paste the entire JSON content (as a single-line string)
   - **Environment:** Production, Preview, Development (select all)

**Important:** The JSON should be minified/on a single line, or properly escaped if multi-line.

### 2. Optional: Gmail Email Configuration

If you want to use a different email account, you can also set:
- `GMAIL_USER` - Gmail address
- `GMAIL_APP_PASSWORD` - Gmail app password

Currently configured in code: `Petwego747@gmail.com` with app password `ydss yjxf ztta rcay`

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

## Troubleshooting

### Error: "Unable to detect a Project Id"

This means the Firebase service account JSON is not properly set. Make sure:
- The `FIREBASE_SERVICE_ACCOUNT` environment variable contains valid JSON
- The JSON includes the `project_id` field
- The variable is set for the correct environment (Production/Preview)

### Testing Locally with Vercel

To test with Vercel environment locally:
```bash
vercel dev
```

This will use your Vercel environment variables locally.

