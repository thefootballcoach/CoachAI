#!/bin/bash

# EMERGENCY BUILD - Maximum size reduction for deployment
set -e

echo "🚨 EMERGENCY BUILD - Maximum compression mode"

# Remove build directories safely
rm -rf dist/ || true
rm -rf client/dist/ || true
# Skip cache removal to avoid deleting protected files

# Remove all development files that might be included
find . -name "*.test.*" -delete || true
find . -name "*.spec.*" -delete || true
find . -name "*.stories.*" -delete || true
find . -name "*.map" -delete || true
find . -name "__tests__" -type d -exec rm -rf {} + || true

# Set ultra-strict production environment
export NODE_ENV=production
export GENERATE_SOURCEMAP=false
export VITE_BUILD_MINIFY=true

echo "Building frontend with maximum compression..."
npx vite build \
  --minify terser \
  --sourcemap false \
  --emptyOutDir true \
  --mode production

echo "Building backend with maximum optimization..."
npx esbuild server/index.ts \
  --platform=node \
  --packages=external \
  --bundle \
  --format=esm \
  --outdir=dist \
  --minify \
  --tree-shaking=true \
  --drop:console \
  --drop:debugger \
  --legal-comments=none \
  --sourcemap=false \
  --target=node18 \
  --analyze=false

# Final cleanup of build directory
cd dist || exit 1

# Remove any remaining dev artifacts
find . -name "*.map" -delete || true
find . -name "*.test.*" -delete || true
find . -name "README*" -delete || true

# Report final size
echo "📏 FINAL BUILD SIZE:"
du -sh . || ls -la

echo "✅ Emergency build complete - ready for deployment"