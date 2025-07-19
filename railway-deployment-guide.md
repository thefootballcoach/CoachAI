# Railway.app Migration Guide for CoachAI

## Step 1: Prepare Your GitHub Repository

1. **Push all your code to GitHub** (if not already done):
   ```bash
   git add .
   git commit -m "Prepare for Railway deployment"
   git push origin main
   ```

## Step 2: Create Railway Account & Project

1. Go to [railway.app](https://railway.app)
2. Sign up with your GitHub account
3. Click "New Project"
4. Select "Deploy from GitHub repo"
5. Choose your CoachAI repository

## Step 3: Configure Environment Variables

Add these environment variables in Railway dashboard:

```env
NODE_ENV=production
DATABASE_URL=postgresql://... (Railway will provide this)
OPENAI_API_KEY=sk-proj-...
SENDGRID_API_KEY=SG...
AWS_S3_BUCKET_NAME=your-bucket-name
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
SESSION_SECRET=your-random-secret
PORT=5000
```

## Step 4: Add PostgreSQL Database

1. In Railway dashboard, click "New"
2. Select "Database" → "PostgreSQL"
3. Copy the connection string to DATABASE_URL

## Step 5: Deploy Configuration

Railway will automatically detect your Node.js app and deploy it using your package.json scripts.

## Step 6: Domain Setup

1. Railway provides a free subdomain: `yourapp.railway.app`
2. For custom domain: Add your domain in Railway settings
3. Update DNS records as instructed

## Migration Checklist

- [ ] Code pushed to GitHub
- [ ] Railway project created
- [ ] Environment variables configured
- [ ] PostgreSQL database added
- [ ] First deployment successful
- [ ] Database migrated
- [ ] File uploads working
- [ ] AI processing functional

## Expected Benefits After Migration

- ✅ No more processing timeouts
- ✅ Unlimited background job runtime
- ✅ Better performance for AI workloads
- ✅ Persistent file storage
- ✅ Automatic scaling
- ✅ Built-in monitoring

## Estimated Migration Time: 2-3 hours
## Cost: $5-20/month (much more reliable than Replit)