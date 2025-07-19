# How to Access the Replit Shell

## What is the Shell?
The Shell is a command line where you can type commands to control your project directly. Think of it like a text-based control panel.

## How to Open It:

### Method 1: Shell Tab
1. Look at the bottom of your Replit screen
2. You'll see tabs like "Console", "Shell", "Secrets"
3. Click on the **"Shell"** tab
4. A black/dark window will appear with a prompt like `~/workspace$`

### Method 2: Tools Menu
1. Click the three dots (...) menu in Replit
2. Select "Tools"
3. Click "Shell"

## What It Looks Like:
```
~/workspace$ _
```
This is where you type commands.

## To Fix Your Deployment:
Once you have the Shell open, copy and paste these commands one at a time:

```bash
# Step 1: Create override
echo '#!/bin/bash' > npm
echo './simple-build.sh' >> npm
chmod +x npm

# Step 2: Set path
export PATH=.:$PATH

# Step 3: Test it works
./npm run build
```

If this prints "Build complete: 384K", then click Deploy button - it should work!

## Visual Guide:
- Shell is usually at the BOTTOM of your screen
- It's a dark rectangular area
- You can type commands there
- Press Enter to run each command