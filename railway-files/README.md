# Railway Deployment Files

## Quick Fix for Railway Client Files Error

Your Railway deployment failed with "ENOENT: no such file or directory, open '/app/client/index.html'" because it was trying to run in production mode without built files.

## Files to Update in Your GitHub Repository

1. **railway.json** - Forces development mode
2. **nixpacks.toml** - Forces development mode  
3. **.npmrc** - NPM dependency fixes

## How to Use These Files

1. Copy the contents of each file below
2. Replace the corresponding files in your GitHub repository
3. Railway will automatically redeploy with the fix

## Expected Result

After updating these files:
- Railway runs in development mode (like Replit)
- Frontend served by Vite dev server
- All features work: uploads, AI analysis, authentication
- Your CoachAI platform will be accessible at the Railway URL

## Environment Variables Required

Make sure these 7 environment variables are set in Railway:
- DATABASE_URL
- OPENAI_API_KEY
- SESSION_SECRET
- AWS_S3_BUCKET_NAME
- AWS_ACCESS_KEY_ID
- AWS_SECRET_ACCESS_KEY
- SENDGRID_API_KEY

Your Railway deployment will succeed once these files are updated!