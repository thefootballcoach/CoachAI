# Fix Nixpacks Build Error

## The Problem
Railway is failing to build because of an undefined 'npm' variable in nixpacks.toml.

## Solution
Replace your nixpacks.toml file with this corrected version:

### Updated nixpacks.toml
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

## What Changed
- Removed `npm` from nixPkgs (it comes with nodejs_20 automatically)
- Kept `nodejs_20` and `ffmpeg` for your video processing needs
- Install command remains the same

## Steps to Fix
1. Go to your GitHub repository
2. Edit the `nixpacks.toml` file
3. Replace the content with the version above
4. Commit the changes
5. Railway will automatically redeploy

This will resolve the "undefined variable 'npm'" error and allow your deployment to succeed.