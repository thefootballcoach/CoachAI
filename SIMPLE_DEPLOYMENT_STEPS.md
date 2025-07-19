# Simple Fix for Railway Deployment

## Quick Fix Required

Your Railway deployment is failing because of a simple configuration error in nixpacks.toml.

### Step 1: Edit nixpacks.toml in GitHub
Go to your GitHub repository and replace the nixpacks.toml content with:

```toml
[phases.setup]
nixPkgs = ["nodejs_20", "ffmpeg"]

[phases.install]
cmds = ["npm install --legacy-peer-deps --no-audit --no-fund"]

[start]
cmd = "npm start"

[variables]
NODE_ENV = "production"
```

### What's Fixed
- Removed `npm` from nixPkgs (npm comes with nodejs_20 automatically)
- This fixes the "undefined variable 'npm'" error

### Step 2: Commit Changes
Save the file and commit in GitHub.

### Step 3: Automatic Redeploy
Railway will automatically detect the change and redeploy successfully.

## Result
Your CoachAI application will deploy without the Nixpacks error and be fully operational on Railway.