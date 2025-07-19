# Git Deployment Guide - Professional Way

## Method 1: GitHub Desktop (Easiest)

### Step 1: Install GitHub Desktop
1. Download from github.com/desktop
2. Sign in with your GitHub account

### Step 2: Create Repository
1. Click "Create New Repository"
2. Name: `coaching-platform`
3. Local path: Choose where to save
4. Initialize with README: ✓
5. Click "Create Repository"

### Step 3: Add Your Files
1. Copy these folders into the repository folder:
   - client/
   - server/
   - shared/
   - package.json
   - vercel.json
   - .gitignore

### Step 4: Commit and Push
1. GitHub Desktop will show all new files
2. Add commit message: "Initial coaching platform deployment"
3. Click "Commit to main"
4. Click "Publish repository" (keep private)

## Method 2: Git Command Line

### Step 1: Initialize Repository
```bash
git init
git add client/ server/ shared/ package.json vercel.json .gitignore
git commit -m "Initial coaching platform deployment"
```

### Step 2: Connect to GitHub
```bash
git remote add origin https://github.com/yourusername/coaching-platform.git
git branch -M main
git push -u origin main
```

## Method 3: Direct Upload (Quick)

### Step 1: Create GitHub Repository
1. Go to github.com
2. Click "New" → Name: `coaching-platform`
3. Private repository
4. Click "Create repository"

### Step 2: Upload Files
1. Click "uploading an existing file"
2. Drag CoachAIfeedback.zip or drag folders directly
3. Commit message: "Initial deployment"
4. Click "Commit new files"

## Deploy to Vercel

### Step 1: Connect Vercel
1. Go to vercel.com
2. Sign up with GitHub
3. Click "Import Project"
4. Select your coaching-platform repository

### Step 2: Configure Build
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`

### Step 3: Environment Variables
Add these in Vercel dashboard:
- DATABASE_URL
- OPENAI_API_KEY
- SENDGRID_API_KEY
- SESSION_SECRET
- AWS_S3_BUCKET_NAME
- AWS_ACCESS_KEY_ID
- AWS_SECRET_ACCESS_KEY

### Step 4: Deploy
Click "Deploy" - your platform will be live in 5 minutes!

## Benefits of Git Method
✅ **Version control** - Track all changes
✅ **Automatic deployment** - Push code, auto-deploy
✅ **Collaboration** - Easy to share with team
✅ **Rollback** - Easy to undo changes
✅ **Professional** - Industry standard approach

## Custom Domain Setup
After deployment:
1. Go to Vercel project settings
2. Add your custom domain
3. Update DNS records as shown
4. SSL certificate auto-generated

Which method would you prefer? GitHub Desktop is easiest for beginners.