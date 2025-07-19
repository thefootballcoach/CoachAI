# Fixed Railway Configuration

## Problem
The command `NODE_ENV=development` is being treated as an executable name instead of an environment variable.

## Solution
Update these files in your GitHub repository:

---

## File 1: railway.json
Copy this exactly:
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm run dev",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 3
  }
}
```

## File 2: nixpacks.toml
Copy this exactly:
```toml
[phases.setup]
nixPkgs = ["nodejs_20", "npm"]

[phases.install]
cmds = ["npm install --force"]

[start]
cmd = "npm run dev"

[variables]
NODE_ENV = "development"
```

## File 3: .npmrc
Copy this exactly:
```
legacy-peer-deps=true
force=true
audit=false
```

---

## What Changed
- Removed `NODE_ENV=development` from the start commands
- Added `NODE_ENV = "development"` as an environment variable in nixpacks.toml
- This properly sets the environment variable instead of treating it as a command

## Steps
1. Edit these 3 files in your GitHub repository
2. Replace their contents with the code above
3. Commit the changes
4. Railway will automatically redeploy successfully

Your CoachAI platform will then work at the Railway URL!