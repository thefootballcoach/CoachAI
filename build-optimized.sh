#!/bin/bash

# Optimized build script for deployment
set -e

echo "🔨 Starting optimized build..."

# Clean previous builds
rm -rf dist/
rm -rf client/dist/

# Set production environment variables
export NODE_ENV=production
export GENERATE_SOURCEMAP=false
export INLINE_RUNTIME_CHUNK=false

# Build frontend with size optimizations
echo "📦 Building frontend..."
npx vite build --minify terser --sourcemap false

# Build backend with optimizations
echo "🔧 Building backend..."
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
  --sourcemap=false

echo "✅ Build completed successfully!"

# Report final size
if [ -d "dist" ]; then
  echo "📏 Final build size: $(du -sh dist | cut -f1)"
fi