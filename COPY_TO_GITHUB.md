# Copy These Files to Your GitHub Repository

## RAILWAY.JSON
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "NODE_ENV=development npm run dev",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 3
  }
}
```

## NIXPACKS.TOML
```toml
[phases.setup]
nixPkgs = ["nodejs_20", "npm"]

[phases.install]
cmds = ["npm install --force"]

[start]
cmd = "NODE_ENV=development npm run dev"
```

## .NPMRC
```
audit=false
fund=false
legacy-peer-deps=true
```

## PACKAGE.JSON (Update scripts section)
```json
{
  "scripts": {
    "dev": "NODE_ENV=development tsx server/index.ts",
    "build": "vite build && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist",
    "start": "NODE_ENV=development tsx server/index.ts"
  }
}
```

## Instructions
1. Copy each file content above exactly as shown
2. Replace the corresponding files in your GitHub repository
3. Make sure the start command uses NODE_ENV=development
4. Railway will automatically redeploy with development mode

This will force Railway to run in development mode like Replit, solving the client files error.