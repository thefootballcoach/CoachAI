# Railway Build Fix - Remove Dockerfile

## Problem
Railway is using a Dockerfile instead of nixpacks, causing npm install failures.

## Solution
Delete the Dockerfile and use only nixpacks configuration:

---

## Step 1: Delete Dockerfile
In your GitHub repository, **delete** the `Dockerfile` file completely.

## Step 2: Update nixpacks.toml
Replace your nixpacks.toml with this:
```toml
[phases.setup]
nixPkgs = ["nodejs_20", "npm"]

[phases.install]
cmds = ["npm install --legacy-peer-deps"]

[start]
cmd = "npm start"

[variables]
NODE_ENV = "development"
```

## Step 3: Update railway.json
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm start"
  }
}
```

## Step 4: Update package.json scripts
Make sure your package.json scripts section looks like this:
```json
{
  "scripts": {
    "dev": "tsx server/index.ts",
    "start": "tsx server/index.ts",
    "build": "vite build && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist"
  }
}
```

---

## What This Does
- **Removes Dockerfile** - Forces Railway to use nixpacks instead
- **Simplifies npm install** - Uses only --legacy-peer-deps flag
- **Uses development mode** - Runs tsx server/index.ts directly
- **Avoids build step** - No client building required

## Steps
1. **Delete the Dockerfile** from your GitHub repository
2. Update the other 3 files with the content above
3. Commit all changes
4. Railway will automatically redeploy using nixpacks

This should resolve the npm install failure and get your CoachAI platform running properly.