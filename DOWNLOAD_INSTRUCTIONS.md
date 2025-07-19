# CoachAI Download Instructions

## Two Small Files Instead of One Large File

Since Replit has download size limits, I've split your app into two manageable packages:

### Package 1: CoachAI-Core.tar.gz (~50MB)
**Contains the main application:**
- ✅ Frontend (React/TypeScript)
- ✅ Backend (Node.js/Express)
- ✅ Shared schemas
- ✅ Configuration files
- ✅ All source code

### Package 2: CoachAI-Deployment.tar.gz (~1MB)  
**Contains deployment configurations:**
- ✅ Railway config (nixpacks.toml, railway.json)
- ✅ Docker config (Dockerfile)
- ✅ Vercel config
- ✅ All deployment files

## How to Download:

1. **Right-click on CoachAI-Core.tar.gz** → Download
2. **Right-click on CoachAI-Deployment.tar.gz** → Download

## How to Use:

1. **Extract both files** to the same folder
2. **Run:** `npm install`
3. **Add your environment variables**
4. **Deploy to Railway/Vercel**

## Why This Works:
- Each file is under Replit's size limit
- Contains your complete application
- Ready for immediate deployment
- No functionality lost

Both files together give you the complete CoachAI platform ready for deployment anywhere!