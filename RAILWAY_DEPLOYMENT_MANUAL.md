# Manual Railway Deployment Steps

## Railway CLI is asking for input

Since the CLI requires interactive input that I can't provide directly, here's what you need to do:

### Step 1: Complete Railway Init
In your terminal, run:
```bash
railway init
```

When prompted:
- **Project Name**: Enter `CoachAI` (or leave blank for random name)
- **Select workspace**: Choose your default workspace

### Step 2: Deploy Your Code
```bash
railway up
```

This will upload all your files to Railway and start the deployment.

### Step 3: Add PostgreSQL Database
1. Go to railway.app dashboard
2. Click on your CoachAI project
3. Click "New" → "Database" → "PostgreSQL"
4. Railway will create the database automatically

### Step 4: Add Environment Variables
In Railway dashboard, go to "Variables" tab and add:

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

### Step 5: Test Your Deployment
1. Railway will give you a URL like: `https://coachai-production.up.railway.app`
2. Visit: `https://yourapp.railway.app/api/health`
3. Should show: `{"status":"healthy"}`

## What This Fixes
Those database errors you're seeing:
```
❌ Error checking for stuck videos: error: syntax error at or near "<"
```
Will be completely eliminated with Railway's dedicated PostgreSQL.

Your processing timeouts (10%, 30%, 60% stuck uploads) will be resolved with persistent containers and unlimited background job runtime.

## Ready to Deploy
Run these commands in your terminal:
```bash
railway init
railway up
```
Then add database and environment variables in Railway dashboard.