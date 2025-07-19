# Railway Final Fix - Development Mode

## Problem
Railway is still trying to run in production mode and looking for `/app/client/index.html` files that don't exist.

## Solution
Update your package.json and Railway configuration files:

---

## File 1: package.json (Update the scripts section)
Find your package.json file and update the scripts section to this:
```json
{
  "scripts": {
    "dev": "tsx server/index.ts",
    "build": "vite build && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist",
    "start": "tsx server/index.ts",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:push": "drizzle-kit push",
    "db:studio": "drizzle-kit studio"
  }
}
```

## File 2: railway.json
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

## File 3: nixpacks.toml
```toml
[phases.setup]
nixPkgs = ["nodejs_20", "npm"]

[phases.install]
cmds = ["npm install --force"]

[start]
cmd = "npm start"

[variables]
NODE_ENV = "development"
```

## File 4: .npmrc
```
legacy-peer-deps=true
force=true
audit=false
```

---

## What This Does
- Forces Railway to run `npm start` which runs `tsx server/index.ts`
- Sets NODE_ENV=development as an environment variable
- Uses the same development setup as Replit
- Avoids looking for built client files

## Steps
1. Update these 4 files in your GitHub repository
2. Commit the changes
3. Railway will automatically redeploy in development mode

Your CoachAI platform will then work properly!