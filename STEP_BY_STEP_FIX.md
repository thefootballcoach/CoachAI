# STEP-BY-STEP FIX FOR 404 ERROR

## What You Need to Do (5 Minutes)

### Step 1: Go to GitHub
1. Open your web browser
2. Go to **github.com**
3. Sign in to your account
4. Find your repository (probably named "coaching-platform")

### Step 2: Edit vercel.json File
1. In your repository, click on the file named **vercel.json**
2. Click the **pencil icon** (Edit this file)
3. **Delete everything** in the file
4. **Copy and paste** this exact content:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json", 
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist/public"
      }
    },
    {
      "src": "server/index.ts",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "server/index.ts"
    },
    {
      "src": "/(.*)",
      "dest": "dist/public/index.html"
    }
  ],
  "functions": {
    "server/index.ts": {
      "maxDuration": 30
    }
  }
}
```

### Step 3: Save the Changes
1. Scroll down to the bottom
2. In the commit message box, type: "Fix 404 error"
3. Click **"Commit changes"**

### Step 4: Wait for Automatic Deployment
1. Vercel will automatically detect the change
2. It will rebuild and redeploy your app
3. Wait 2-3 minutes for the deployment to complete

### Step 5: Test Your Website
1. Go to your Vercel deployment URL
2. Your coaching platform should now load correctly
3. No more 404 error!

## That's It!
The 404 error will be fixed once you update that one file in GitHub.