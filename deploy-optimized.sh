#!/bin/bash
set -e

echo "🚀 Deployment-Optimized Build Process"

# Set production environment
export NODE_ENV=production
export GENERATE_SOURCEMAP=false

# Clean only build outputs
echo "Cleaning previous builds..."
rm -rf dist 2>/dev/null || true

echo "Building frontend with maximum optimization..."
npx vite build --mode production

echo "Building backend with optimization..."
npx esbuild server/index.ts \
  --platform=node \
  --packages=external \
  --bundle \
  --format=esm \
  --outdir=dist \
  --minify \
  --tree-shaking=true \
  --target=node20

# Remove source maps and unnecessary files
echo "Optimizing build output..."
find dist -name "*.map" -delete 2>/dev/null || true
find dist -name "*.txt" -delete 2>/dev/null || true
find dist -name "README*" -delete 2>/dev/null || true

# Compress assets for smaller deployment
echo "Compressing assets..."
if command -v gzip >/dev/null 2>&1; then
    find dist/public -name "*.js" -size +1k -exec gzip -9 -k {} \; 2>/dev/null || true
    find dist/public -name "*.css" -size +1k -exec gzip -9 -k {} \; 2>/dev/null || true
fi

# Calculate and display sizes
TOTAL_SIZE=$(du -sh dist 2>/dev/null | cut -f1 || echo "Unknown")
BACKEND_SIZE="Unknown"
FRONTEND_SIZE="Unknown"

if [ -f "dist/index.js" ]; then
    BACKEND_SIZE=$(du -sh dist/index.js 2>/dev/null | cut -f1 || echo "Unknown")
fi

if [ -d "dist/public" ]; then
    FRONTEND_SIZE=$(du -sh dist/public 2>/dev/null | cut -f1 || echo "Unknown")
fi

echo "✅ Deployment build complete!"
echo "📊 Build Statistics:"
echo "   Total Size: $TOTAL_SIZE"
echo "   Backend: $BACKEND_SIZE"
echo "   Frontend: $FRONTEND_SIZE"

# Check if under 32MB limit
if [ -d "dist" ]; then
    SIZE_BYTES=$(du -sb dist 2>/dev/null | cut -f1 || echo 0)
    SIZE_MB=$((SIZE_BYTES / 1024 / 1024))
    
    if [ $SIZE_MB -lt 32 ]; then
        echo "🎯 SUCCESS: Build size ($SIZE_MB MB) is under 32MB deployment limit!"
    else
        echo "⚠️  WARNING: Build size ($SIZE_MB MB) exceeds 32MB deployment limit"
        echo "   Consider additional optimizations or using external asset storage"
    fi
fi

echo "🚀 Ready for deployment!"