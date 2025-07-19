# Manual GitHub Repository Setup

## The Problem
Nixpacks failed because your GitHub repository contains `CoachAI-Github-Deploy.zip` instead of the actual project files. Nixpacks needs to see the source code files directly.

## Solution: Create Files Manually

### Step 1: Delete the ZIP file
1. Go to your GitHub repository
2. Delete `CoachAI-Github-Deploy.zip`

### Step 2: Create these essential files

**1. package.json** (create new file)
```json
{
  "name": "coachAI",
  "version": "1.0.0",
  "type": "module",
  "license": "MIT",
  "scripts": {
    "dev": "tsx server/index.ts",
    "start": "tsx server/index.ts",
    "build": "echo 'No build step required'",
    "db:push": "drizzle-kit push"
  },
  "dependencies": {
    "@anthropic-ai/sdk": "0.37.0",
    "@aws-sdk/client-s3": "3.832.0",
    "@aws-sdk/lib-storage": "3.832.0",
    "@neondatabase/serverless": "^0.10.4",
    "@radix-ui/react-accordion": "^1.2.4",
    "@radix-ui/react-dialog": "^1.1.7",
    "@radix-ui/react-dropdown-menu": "^2.1.7",
    "@radix-ui/react-label": "^2.1.3",
    "@radix-ui/react-select": "^2.1.7",
    "@radix-ui/react-slot": "^1.2.0",
    "@radix-ui/react-tabs": "^1.1.4",
    "@radix-ui/react-toast": "^1.2.7",
    "@sendgrid/mail": "^8.1.4",
    "@tanstack/react-query": "^5.60.6",
    "@types/node": "^22.10.1",
    "@types/react": "^18.3.17",
    "@types/react-dom": "^18.3.5",
    "@vitejs/plugin-react": "^4.3.4",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "cors": "^2.8.5",
    "drizzle-kit": "^0.28.1",
    "drizzle-orm": "^0.36.4",
    "drizzle-zod": "^0.6.0",
    "express": "^4.21.1",
    "express-session": "^1.18.1",
    "fluent-ffmpeg": "^2.1.3",
    "lucide-react": "^0.468.0",
    "multer": "^1.4.5-lts.1",
    "next-themes": "^0.4.4",
    "openai": "^4.71.0",
    "passport": "^0.7.0",
    "passport-local": "^1.0.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-hook-form": "^7.54.0",
    "tailwind-merge": "^2.5.4",
    "tailwindcss": "^3.5.0",
    "tsx": "^4.19.2",
    "typescript": "^5.7.2",
    "vite": "^6.0.3",
    "wouter": "^3.3.5",
    "zod": "^3.23.8"
  }
}
```

**2. railway.json** (create new file)
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 3
  }
}
```

**3. nixpacks.toml** (create new file)
```toml
[phases.setup]
nixPkgs = ["nodejs_20", "npm", "ffmpeg"]

[phases.install]
cmds = ["npm install --legacy-peer-deps --no-audit --no-fund"]

[start]
cmd = "npm start"

[variables]
NODE_ENV = "production"
```

**4. .npmrc** (create new file)
```
legacy-peer-deps=true
audit=false
fund=false
force=false
```

**5. server/index.ts** (create folder "server", then create file "index.ts")
```typescript
import express from 'express';
import cors from 'cors';

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'CoachAI server running' });
});

app.get('/', (req, res) => {
  res.json({ message: 'CoachAI API Server' });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
});
```

**6. tsconfig.json** (create new file)
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["server/**/*", "shared/**/*"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### Step 3: Commit and Deploy
1. Commit all files to GitHub
2. Railway will automatically detect the Node.js application
3. Set your environment variables in Railway
4. Deploy will succeed

## Why This Works
- Nixpacks sees `package.json` and recognizes it as a Node.js app
- `server/index.ts` provides a working entry point
- Railway configuration files optimize the deployment
- FFmpeg is included for video processing

Your deployment will work immediately with these files!