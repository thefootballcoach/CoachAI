# Vercel Deployment Setup Guide

## Step 1: Prepare Your Repository for GitHub

### Create .gitignore (if not exists)
```
node_modules/
dist/
.env*
!.env.example
*.log
.cache/
.vite/
uploads/
temp/
```

### Create vercel.json Configuration
```json
{
  "version": 2,
  "builds": [
    {
      "src": "server/index.ts",
      "use": "@vercel/node"
    },
    {
      "src": "client/**",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "client/dist"
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
      "dest": "client/dist/$1"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

## Step 2: GitHub Repository Creation

1. Go to https://github.com
2. Click "New Repository"
3. Name: `coaching-ai-platform` (or your preferred name)
4. Make it Private (recommended for commercial app)
5. Don't initialize with README (we'll push existing code)

## Step 3: Push Code to GitHub

Run these commands in your Replit terminal:

```bash
git init
git add .
git commit -m "Initial commit - CoachAI platform"
git branch -M main
git remote add origin https://github.com/YOURUSERNAME/YOURREPONAME.git
git push -u origin main
```

## Step 4: Vercel Account Setup

1. Go to https://vercel.com
2. Sign up with GitHub account
3. Import your repository
4. Configure build settings:
   - Framework: Other
   - Build command: `npm run build`
   - Output directory: `dist`

## Step 5: Environment Variables

Add these in Vercel dashboard:
- `DATABASE_URL`
- `OPENAI_API_KEY`
- `SENDGRID_API_KEY`
- `AWS_S3_BUCKET_NAME`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `SESSION_SECRET`

## Step 6: Deploy & Test

1. Vercel auto-deploys on GitHub push
2. Test on temporary .vercel.app URL
3. Verify all features work
4. Add your custom domain

## Next Steps

Once deployed successfully:
1. Add custom domain in Vercel dashboard
2. Update DNS settings at your registrar
3. SSL certificate activates automatically
4. Your app is live on your domain!