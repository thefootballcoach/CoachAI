# CoachAI - Railway Deployment

## Overview
AI-powered coaching analysis platform for football coaches.

## Features
- 6GB file upload support
- Multi-AI analysis (OpenAI, Claude, Perplexity)
- Real-time processing
- Comprehensive coaching feedback
- Club management system
- Individual development plans

## Railway Deployment

### Environment Variables Required
```
DATABASE_URL=your_neon_database_url
OPENAI_API_KEY=your_openai_api_key
SESSION_SECRET=your_session_secret
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_S3_BUCKET_NAME=your_s3_bucket_name
SENDGRID_API_KEY=your_sendgrid_api_key
```

### Build Configuration
- Build Command: `npm install --legacy-peer-deps --no-audit --no-fund`
- Start Command: `npm start`
- Node Version: 20.x

### Deployment Steps
1. Upload this repository to GitHub
2. Connect to Railway
3. Set environment variables
4. Deploy automatically

## Development
```bash
npm install
npm run dev
```

## Live Site
https://coaches-ai.com