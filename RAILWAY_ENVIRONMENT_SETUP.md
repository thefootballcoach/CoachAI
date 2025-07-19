# Railway Environment Variables Setup

## Required Environment Variables

Your Railway deployment needs these environment variables to work:

### 1. DATABASE_URL (Required)
```
DATABASE_URL=postgresql://username:password@host:port/database
```
**How to get it:**
- Go to Railway dashboard → your project
- Add a PostgreSQL database service
- Copy the DATABASE_URL from the database service

### 2. OPENAI_API_KEY (Required for AI analysis)
```
OPENAI_API_KEY=sk-proj-your-key-here
```

### 3. SESSION_SECRET (Required for authentication)
```
SESSION_SECRET=your-random-secret-here
```

### 4. AWS S3 (Optional - for file storage)
```
AWS_S3_BUCKET_NAME=your-bucket-name
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
```

### 5. Email Service (Optional)
```
SENDGRID_API_KEY=SG.your-key-here
```

## How to Set Environment Variables in Railway

1. **Go to Railway Dashboard**
   - Visit your project: https://railway.app/project/f12cfec5-3a69-42fa-8945-5e608ab0bc53

2. **Add Database Service**
   - Click "New Service" → "Database" → "PostgreSQL"
   - Railway will automatically create DATABASE_URL

3. **Add Environment Variables**
   - Click your main service
   - Go to "Variables" tab
   - Add each variable with "New Variable" button

4. **Redeploy**
   - Railway will automatically redeploy with new variables

## Quick Setup Commands

After setting environment variables, your app will start successfully:

```bash
# Railway will run this automatically
npm run dev
```

## Database Migration

Once DATABASE_URL is set, your app will automatically:
- Connect to PostgreSQL database
- Create required tables via Drizzle ORM
- Be ready for coaching session uploads

## Expected Success

With environment variables set:
- ✅ Database connection successful
- ✅ Authentication system working
- ✅ AI processing functional
- ✅ File uploads working
- ✅ No more processing timeouts

Set DATABASE_URL first, then add other variables as needed!