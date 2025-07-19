# Railway Root Directory Configuration

## Setting: Root Directory
**Value**: `.` (dot) or leave empty

## Why This Setting
Your CoachAI project structure has all files in the root:
- `package.json` - Root level
- `server/` - Root level folder
- `client/` - Root level folder
- `railway.json` - Root level
- `nixpacks.toml` - Root level

## Railway Configuration
Since your extracted files are at the repository root, Railway should look for code in the root directory.

## Next Railway Settings
After root directory:
1. **Build Command**: Automatically detected from `nixpacks.toml`
2. **Start Command**: Automatically detected from `Procfile`
3. **Environment Variables**: Add from your collection script

## Environment Variables Needed
```
NODE_ENV=production
PORT=5000
OPENAI_API_KEY=sk-proj-HKSMyc0cnq...
SENDGRID_API_KEY=SG.l-Iz97SHQsCMmGRrkpJOrA...
AWS_S3_BUCKET_NAME=coachai2
AWS_ACCESS_KEY_ID=AKIAWF6DEVLL6ZX2DVCE
AWS_SECRET_ACCESS_KEY=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
SESSION_SECRET=WFcuRES3rZjVR4j4jgh2Q6ZuGk89gg3BZj/Sfg3OLtRs5k895zYR+wnAdGIhoNHWgBZHVdMGrptg/FpJtuF/KQ==
```

Railway will automatically create `DATABASE_URL` for your PostgreSQL database.

Your deployment is progressing correctly!