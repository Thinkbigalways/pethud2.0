# Git Setup Instructions

## Initial Setup (If gcloud/ is already tracked)

If the `gcloud/` directory was committed before being added to `.gitignore`, you need to remove it from git tracking:

```bash
# Remove gcloud/ from git tracking (but keep it locally)
git rm -r --cached gcloud/

# Commit the removal
git commit -m "Remove: gcloud/ directory from git tracking"
```

## Files That Should NOT Be Committed

The following files/directories are in `.gitignore` and should never be committed:

- `.env.local` - Environment variables with sensitive data
- `firebase/serviceAccountKey.json` - Firebase service account keys
- `gcloud/` - Google Cloud SDK (if installed locally)
- `node_modules/` - Dependencies
- `.vercel/` - Vercel configuration
- `cors-config.json` - Temporary CORS config file
- All log files (`*.log`)
- OS-specific files (`.DS_Store`, `Thumbs.db`, etc.)

## Before Pushing to GitHub

Always check what you're about to commit:

```bash
# See what files are staged
git status

# See what will be committed
git diff --cached

# If you see sensitive files, unstage them:
git reset HEAD <file>
```

## Security Checklist

Before pushing to GitHub, ensure:

- [ ] No `.env.local` or `.env` files
- [ ] No Firebase service account JSON files
- [ ] No API keys or secrets in code
- [ ] No database passwords
- [ ] No JWT secrets
- [ ] `gcloud/` directory is not tracked (if present)

## If You Accidentally Committed Sensitive Data

1. **Remove the file from git:**
   ```bash
   git rm --cached <file>
   ```

2. **Add to .gitignore:**
   ```bash
   echo "<file>" >> .gitignore
   ```

3. **Commit the changes:**
   ```bash
   git commit -m "Remove: sensitive file from tracking"
   ```

4. **If already pushed to GitHub:**
   - Change the exposed credentials immediately
   - Consider using GitHub's secret scanning
   - You may need to rewrite git history (advanced)

## Recommended Git Workflow

```bash
# 1. Check status
git status

# 2. Add files (be selective)
git add <specific-files>

# 3. Review what's staged
git diff --cached

# 4. Commit
git commit -m "Descriptive message"

# 5. Push
git push origin <branch>
```
