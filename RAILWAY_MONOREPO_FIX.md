# Railway Monorepo Detection Fix

## Problem
Railway is detecting your project as a monorepo when it's actually a single application.

## Solution: Root Directory Setting
In Railway dashboard, set **Root Directory** to:

### Option 1: Leave Empty
- Root directory: (leave blank)
- This tells Railway to use the repository root

### Option 2: Use Dot
- Root directory: `.`
- This explicitly sets root directory

## Project Structure Verification
Your CoachAI project has this structure:
```
CoachAI/
├── package.json          <- Root level
├── server/              <- Application folder
├── client/              <- Application folder
├── shared/              <- Shared code
├── railway.json         <- Railway config
├── nixpacks.toml        <- Build config
└── Procfile            <- Process definition
```

## If Still Having Issues
1. Check your GitHub repository structure
2. Ensure all files are at the root level (not in a subfolder)
3. Make sure `package.json` is at the repository root

## Railway Auto-Detection
Railway should automatically detect:
- Node.js application from `package.json`
- Build configuration from `nixpacks.toml`
- Start command from `Procfile`

Your project is NOT a monorepo - it's a single full-stack application with frontend and backend in one repository.