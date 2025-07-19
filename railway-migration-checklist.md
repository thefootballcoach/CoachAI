# Railway Migration Checklist for CoachAI

## Pre-Migration (Do this now)

### 1. Export Your Current Data
```bash
# Export your current PostgreSQL database
# You'll need this connection string from Replit
pg_dump $DATABASE_URL > coachAI_backup.sql
```

### 2. Collect Environment Variables
From your Replit environment, copy these values:
- `OPENAI_API_KEY` 
- `SENDGRID_API_KEY`
- `AWS_S3_BUCKET_NAME`
- `AWS_ACCESS_KEY_ID` 
- `AWS_SECRET_ACCESS_KEY`
- `SESSION_SECRET`

## Migration Steps

### Step 1: Create Railway Account
1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Connect your repository

### Step 2: Deploy to Railway
1. Click "New Project"
2. Select "Deploy from GitHub repo" 
3. Choose your CoachAI repository
4. Railway will auto-detect Node.js and deploy

### Step 3: Add PostgreSQL Database
1. In Railway dashboard: "New" → "Database" → "PostgreSQL"
2. Copy the DATABASE_URL connection string
3. Import your data: `psql $NEW_DATABASE_URL < coachAI_backup.sql`

### Step 4: Configure Environment Variables
Add these in Railway dashboard under "Variables":
```
NODE_ENV=production
PORT=5000
DATABASE_URL=[Railway PostgreSQL URL]
OPENAI_API_KEY=[Your OpenAI key]
SENDGRID_API_KEY=[Your SendGrid key] 
AWS_S3_BUCKET_NAME=[Your S3 bucket]
AWS_ACCESS_KEY_ID=[Your AWS key]
AWS_SECRET_ACCESS_KEY=[Your AWS secret]
SESSION_SECRET=[Generate new random string]
```

### Step 5: Domain & DNS
1. Railway gives you: `yourapp.railway.app`
2. For custom domain: Railway Settings → Domains
3. Update your DNS records as shown

## Expected Results After Migration

✅ **No more processing timeouts**  
✅ **Videos process successfully from 0% to 100%**  
✅ **Unlimited background job runtime**  
✅ **Better AI processing performance**  
✅ **Automatic scaling and monitoring**  
✅ **Persistent file storage**  

## Cost Comparison
- **Replit**: $20/month (with processing issues)
- **Railway**: $5-15/month (reliable AI processing)

## Migration Time: 2-3 hours
## Downtime: ~30 minutes during DNS switch

## Ready to Start?
1. Do you have your environment variables ready?
2. Is your code committed to GitHub?
3. Ready to create Railway account?

Let me know when you're ready to begin!