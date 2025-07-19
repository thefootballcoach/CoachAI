#!/bin/bash
set -e

echo "🚀 Starting optimized build process..."

# Remove development files that increase bundle size
echo "Cleaning development artifacts..."
rm -rf build-*.js
rm -rf test-*.js
rm -rf debug-*.html
rm -rf debug-*.cjs
rm -rf demo-*.cjs
rm -rf fix-*.cjs
rm -rf clear-*.cjs
rm -rf cookies_*.txt
rm -rf generated-icon.png

# Remove large attached assets (they'll be recreated in production)
echo "Removing large attached assets..."
rm -rf attached_assets/*

# Remove unnecessary node_modules for production build
echo "Optimizing node_modules..."
# Remove development-only packages that shouldn't be in production bundle
rm -rf node_modules/puppeteer*
rm -rf node_modules/html-pdf-node*
rm -rf node_modules/html2canvas*
rm -rf node_modules/@babel/parser*
rm -rf node_modules/@babel/traverse*
rm -rf node_modules/@babel/types*
rm -rf node_modules/typescript*
rm -rf node_modules/drizzle-kit*
rm -rf node_modules/@types/node*
rm -rf node_modules/@esbuild*
rm -rf node_modules/esbuild/bin*

# Remove unused Radix UI components
rm -rf node_modules/@radix-ui/react-accordion*
rm -rf node_modules/@radix-ui/react-context-menu*
rm -rf node_modules/@radix-ui/react-hover-card*
rm -rf node_modules/@radix-ui/react-menubar*
rm -rf node_modules/@radix-ui/react-radio-group*
rm -rf node_modules/@radix-ui/react-toggle*

# Remove heavy chart dependencies not essential for core functionality
rm -rf node_modules/d3-*
rm -rf node_modules/recharts-scale*

# Clean build artifacts (only safe directories)
echo "Cleaning previous builds..."
rm -rf dist
rm -rf client/.vite 2>/dev/null || true
rm -rf node_modules/.cache 2>/dev/null || true

# Set NODE_ENV for production optimizations
export NODE_ENV=production
export GENERATE_SOURCEMAP=false

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
find dist -name "*.map" -delete

# Compress assets
echo "Compressing static assets..."
find dist/public -name "*.js" -exec gzip -9 -k {} \;
find dist/public -name "*.css" -exec gzip -9 -k {} \;

# Calculate final size
TOTAL_SIZE=$(du -sh dist | cut -f1)
echo "✅ Optimized build complete! Total size: $TOTAL_SIZE"

# Display breakdown
echo "📊 Build breakdown:"
echo "Backend: $(du -sh dist/index.js | cut -f1)"
echo "Frontend: $(du -sh dist/public | cut -f1)"

echo "🎯 Bundle optimization complete!"