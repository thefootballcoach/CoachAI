# VERCEL 404 ERROR - COMPLETE FIX

## Problem
Your React/Express app is deployed but showing 404 because Vercel doesn't know how to handle the routing.

## Solution - Replace These Files in GitHub

### 1. Fix vercel.json (CRITICAL)
Replace your current vercel.json with this exact configuration:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "client/vite.config.ts",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    },
    {
      "src": "server/index.ts",
      "use": "@vercel/node"
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
      "maxDuration": 30
    }
  }
}
```

### 2. Update Root package.json
Make sure your root package.json has these build scripts:

```json
{
  "scripts": {
    "build": "cd client && npm install && npm run build",
    "start": "node server/index.js",
    "dev": "NODE_ENV=development tsx server/index.ts"
  }
}
```

### 3. Add client/package.json
Create this file in your client folder:

```json
{
  "name": "coaching-platform-client",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@tanstack/react-query": "^5.0.0",
    "wouter": "^3.0.0",
    "next-themes": "^0.3.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@vitejs/plugin-react": "^4.0.0",
    "typescript": "^5.0.0",
    "vite": "^4.0.0"
  }
}
```

### 4. Check Environment Variables
In Vercel dashboard, verify these are set:
- DATABASE_URL
- OPENAI_API_KEY
- SENDGRID_API_KEY
- SESSION_SECRET
- AWS_S3_BUCKET_NAME
- AWS_ACCESS_KEY_ID
- AWS_SECRET_ACCESS_KEY

## Quick Steps to Fix
1. Go to your GitHub repository
2. Edit vercel.json - replace with the content above
3. Edit package.json - update build scripts
4. Create client/package.json - add the content above
5. Vercel will automatically redeploy

## Why This Works
- Tells Vercel to build your React frontend using Vite
- Tells Vercel to build your Express backend as serverless function
- Routes API calls to backend, everything else to frontend
- Fixes the 404 by properly serving your React app

After these changes, your coaching platform will load correctly!