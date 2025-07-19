# CORRECT VERCEL CONFIGURATION - FIXES 404 ERROR

## The Problem
Your current vercel.json is looking for files that don't exist in your project structure.

## The Solution
Replace your vercel.json with this EXACT configuration:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "client/dist"
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

## Update Your Root package.json Build Script
Make sure your root package.json has:

```json
{
  "scripts": {
    "build": "cd client && npm install && npm run build",
    "start": "node server/index.js",
    "dev": "NODE_ENV=development tsx server/index.ts"
  }
}
```

## Steps to Fix
1. Go to your GitHub repository
2. Edit `vercel.json` - replace with the configuration above
3. Edit `package.json` - update the build script
4. Vercel will automatically redeploy
5. Your 404 error will be resolved

## Why This Works
- Uses your existing vite.config.ts in the root
- Points to the correct client/dist directory
- Properly configures both frontend and backend builds
- Routes API calls to server, everything else to React app

This configuration matches your actual project structure and will resolve the 404 error.