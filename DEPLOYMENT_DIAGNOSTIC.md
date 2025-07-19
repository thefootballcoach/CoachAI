# Deployment Diagnostic - What's Going Wrong?

## Common Issues & Solutions

### 1. Vercel Build Errors
**Symptoms:** Build fails, "Module not found" errors
**Solution:** Missing dependencies in package.json

### 2. Environment Variables Missing
**Symptoms:** App loads but features don't work
**Solution:** Add all required environment variables in Vercel dashboard

### 3. Database Connection Issues
**Symptoms:** 500 errors, "Cannot connect to database"
**Solution:** Check DATABASE_URL format and database status

### 4. API Route Problems
**Symptoms:** 404 errors for /api/* routes
**Solution:** Vercel needs proper API routing configuration

## Quick Fixes

### Fix 1: Update package.json
Make sure your package.json has all dependencies:
```json
{
  "scripts": {
    "build": "vite build",
    "start": "node server/index.js"
  }
}
```

### Fix 2: Add vercel.json
```json
{
  "builds": [
    {
      "src": "server/index.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "server/index.js"
    },
    {
      "src": "/(.*)",
      "dest": "client/index.html"
    }
  ]
}
```

### Fix 3: Check Environment Variables
Required variables:
- DATABASE_URL
- OPENAI_API_KEY
- SENDGRID_API_KEY
- SESSION_SECRET

## Tell Me Exactly What's Happening
1. What error message do you see?
2. Does the build succeed or fail?
3. Do you see any specific error codes?
4. Are you getting 404, 500, or other errors?

With these details, I can give you the exact fix!