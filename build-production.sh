#!/bin/bash
set -e

echo "🚀 Production Build - Optimized for Deployment"

# Set production environment
export NODE_ENV=production
export GENERATE_SOURCEMAP=false

# Clean only safe build directories
echo "Cleaning previous builds..."
rm -rf dist 2>/dev/null || true

echo "Building optimized frontend..."
# Build frontend with production optimizations
npx vite build --mode production

echo "Building optimized backend..."
# Build backend with production optimizations
npx esbuild server/index.ts \
  --platform=node \
  --packages=external \
  --bundle \
  --format=esm \
  --outdir=dist \
  --minify \
  --tree-shaking=true \
  --drop:console \
  --drop:debugger

# Remove source maps to reduce size
echo "Removing source maps..."
find dist -name "*.map" -delete 2>/dev/null || true

# Calculate final size
TOTAL_SIZE=$(du -sh dist 2>/dev/null | cut -f1 || echo "Unknown")
echo "✅ Production build complete! Total size: $TOTAL_SIZE"

# Display breakdown if possible
if [ -f "dist/index.js" ]; then
    BACKEND_SIZE=$(du -sh dist/index.js 2>/dev/null | cut -f1 || echo "Unknown")
    echo "Backend: $BACKEND_SIZE"
fi

if [ -d "dist/public" ]; then
    FRONTEND_SIZE=$(du -sh dist/public 2>/dev/null | cut -f1 || echo "Unknown")
    echo "Frontend: $FRONTEND_SIZE"
fi

echo "🎯 Production build ready for deployment!"