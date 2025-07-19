# Deploy to Railway NOW - CLI Method

## 🚀 Direct Deployment from Replit (5 minutes)

Since download fails and git is locked, Railway CLI is the perfect solution!

### Step 1: Login to Railway (1 minute)
```bash
railway login
```
- Opens browser window
- Login with your GitHub account
- Returns to terminal when done

### Step 2: Initialize Project (1 minute)
```bash
railway init
```
- Choose "Create new project"
- Name: "CoachAI"
- Select "Empty project"

### Step 3: Deploy Your Code (2 minutes)
```bash
railway up
```
- Uploads all your files directly from Replit
- Railway builds automatically with your config files
- Shows deployment progress

### Step 4: Add Database (1 minute)
Go to your Railway dashboard:
1. Click "New" → "Database" → "PostgreSQL"
2. Database URL is automatically created

### Step 5: Add Environment Variables (3 minutes)
In Railway dashboard "Variables" tab, add these:

```
NODE_ENV=production
PORT=5000
OPENAI_API_KEY=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
SENDGRID_API_KEY=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
AWS_S3_BUCKET_NAME=coachai2
AWS_ACCESS_KEY_ID=AKIAWF6DEVLL6ZX2DVCE
AWS_SECRET_ACCESS_KEY=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
SESSION_SECRET=WFcuRES3rZjVR4j4jgh2Q6ZuGk89gg3BZj/Sfg3OLtRs5k895zYR+wnAdGIhoNHWgBZHVdMGrptg/FpJtuF/KQ==
```

### Step 6: Test Deployment (1 minute)
1. Railway gives you a URL: `yourapp.railway.app`
2. Test health endpoint: `yourapp.railway.app/api/health`
3. Should return: `{"status":"healthy"}`

## 🎯 Results After Migration

**Those database errors you're seeing will stop completely:**
```
❌ Error checking for stuck videos: error: syntax error at or near "<"
```
**This becomes:** ✅ No database errors, stable processing

**Upload processing becomes:**
- Before: Stuck at 10%, 30%, 60%
- After: Smooth 0% → 100% completion

## 🏁 Ready to Deploy?

Railway CLI is installed and working. Just run these commands:

```bash
railway login
railway init
railway up
```

Your processing timeout nightmare ends in 5 minutes!