#!/bin/bash

# Minimal build for deployment size optimization
set -e

echo "🔨 Starting minimal production build..."

# Clean previous builds
rm -rf dist/

# Set strict production environment
export NODE_ENV=production
export GENERATE_SOURCEMAP=false

# Build frontend with maximum compression
echo "📦 Building optimized frontend..."
npx vite build --minify terser --sourcemap false

# Build backend with aggressive optimization
echo "🔧 Building optimized backend..."
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
  --analyze=false

# Report size
echo "📏 Build size:"
du -sh dist/

echo "✅ Minimal build completed!"
