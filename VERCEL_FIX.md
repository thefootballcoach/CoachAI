# VERCEL 404 ERROR - IMMEDIATE FIX

## Problem
Your app is deployed but showing 404 NOT_FOUND because Vercel doesn't know how to handle your React/Express structure.

## Solution - Fix These Files in GitHub

### 1. Update vercel.json
Replace your vercel.json with:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "server/index.ts",
      "use": "@vercel/node"
    },
    {
      "src": "client/src/**",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "server/index.ts"
    },
    {
      "src": "/(.*)",
      "dest": "client/dist/index.html"
    }
  ],
  "functions": {
    "server/index.ts": {
      "maxDuration": 300
    }
  }
}
```

### 2. Update package.json Scripts
Make sure your package.json has:
```json
{
  "scripts": {
    "build": "cd client && npm install && npm run build",
    "start": "node server/index.js"
  }
}
```

### 3. Add Environment Variables in Vercel Dashboard
Go to your Vercel project → Settings → Environment Variables:
- DATABASE_URL
- OPENAI_API_KEY
- SENDGRID_API_KEY
- SESSION_SECRET
- AWS_S3_BUCKET_NAME
- AWS_ACCESS_KEY_ID
- AWS_SECRET_ACCESS_KEY

### 4. Redeploy
After making these changes in GitHub, Vercel will automatically redeploy.

## Quick Test
Once deployed, test:
- Your domain → Should show React app
- Your domain/api/user → Should show API response

This will fix your 404 error!