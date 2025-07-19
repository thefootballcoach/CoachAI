# Railway NPM Install Fix

## Problem
Railway build is failing at `npm install --force` step with exit code 1.

## Solution
Update nixpacks.toml to handle dependency installation properly:

---

## File: nixpacks.toml
Replace your nixpacks.toml with this:
```toml
[phases.setup]
nixPkgs = ["nodejs_20", "npm"]

[phases.install]
cmds = [
  "npm ci --legacy-peer-deps || npm install --legacy-peer-deps --no-audit --no-fund",
  "npm ls || true"
]

[start]
cmd = "npm start"

[variables]
NODE_ENV = "development"
NPM_CONFIG_AUDIT = "false"
NPM_CONFIG_FUND = "false"
NPM_CONFIG_LEGACY_PEER_DEPS = "true"
```

## What This Does
- Uses `npm ci` first (faster, more reliable)
- Falls back to `npm install` if `npm ci` fails
- Adds `--legacy-peer-deps` flag to handle dependency conflicts
- Disables audit and fund checks that can cause failures
- Sets environment variables for npm configuration
- Ignores npm ls errors that don't affect functionality

## Steps
1. Replace your nixpacks.toml file in GitHub with the content above
2. Commit the changes
3. Railway will automatically redeploy with proper dependency installation

This should resolve the npm install failure and get your CoachAI platform running on Railway.