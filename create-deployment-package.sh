#!/bin/bash

echo "Creating deployment package for Vercel..."

# Create a clean directory for deployment
mkdir -p deployment-package
cd deployment-package

echo "Copying essential files..."

# Copy core application files
cp -r ../client ./
cp -r ../server ./
cp -r ../shared ./

# Copy configuration files
cp ../package.json ./
cp ../package-lock.json ./ 2>/dev/null || true
cp ../tsconfig.json ./
cp ../vite.config.ts ./
cp ../tailwind.config.ts ./
cp ../postcss.config.js ./
cp ../components.json ./
cp ../drizzle.config.ts ./
cp ../vercel.json ./
cp ../.gitignore ./

echo "Removing problematic directories..."
# Remove large directories that cause deployment issues
rm -rf scripts/ 2>/dev/null || true
rm -rf uploads/ 2>/dev/null || true
rm -rf dist/ 2>/dev/null || true
rm -rf node_modules/ 2>/dev/null || true
rm -rf .git/ 2>/dev/null || true
rm -rf attached_assets/ 2>/dev/null || true

echo "Creating deployment archive..."
cd ..
tar -czf deployment-package.tar.gz deployment-package/

echo "✅ Deployment package created: deployment-package.tar.gz"
echo "📁 Size:"
du -sh deployment-package.tar.gz

echo ""
echo "📋 Next steps:"
echo "1. Download deployment-package.tar.gz from the Files panel"
echo "2. Extract it on your computer"
echo "3. Upload the contents to GitHub"
echo "4. Deploy to Vercel"