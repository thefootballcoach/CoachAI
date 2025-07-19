#!/bin/bash

# Deployment optimization script for reducing bundle size
# This script applies multiple optimization strategies to meet deployment size limits

echo "🚀 Starting deployment optimization..."

# 1. Clean up development files and dependencies
echo "🧹 Cleaning development files..."
rm -rf node_modules/.cache
rm -rf .next
rm -rf dist
rm -rf client/dist
rm -rf client/.vite
rm -rf server/dist

# 2. Remove development-only files
echo "📁 Removing development files..."
find . -name "*.test.ts" -delete
find . -name "*.test.tsx" -delete  
find . -name "*.spec.ts" -delete
find . -name "*.spec.tsx" -delete
find . -name "*.stories.ts" -delete
find . -name "*.stories.tsx" -delete
find . -name "__tests__" -type d -exec rm -rf {} +
find . -name ".vscode" -type d -exec rm -rf {} +
find . -name ".idea" -type d -exec rm -rf {} +

# 3. Remove large script files that aren't needed for production
echo "📜 Cleaning script files..."
if [ -d "scripts" ]; then
    # Keep only essential scripts
    cd scripts
    ls -la | grep -E "\.(ts|js)$" | wc -l
    cd ..
    echo "Found scripts directory with multiple files. Consider reducing for deployment."
fi

# 4. Optimize images and assets
echo "🖼️ Optimizing assets..."
if command -v optipng &> /dev/null; then
    find . -name "*.png" -exec optipng -o7 {} \;
fi

if command -v jpegoptim &> /dev/null; then
    find . -name "*.jpg" -exec jpegoptim --max=85 {} \;
    find . -name "*.jpeg" -exec jpegoptim --max=85 {} \;
fi

# 5. Build with production optimizations
echo "🔨 Building with optimizations..."

# Set production environment
export NODE_ENV=production
export GENERATE_SOURCEMAP=false

# Build frontend with optimizations
npm run build

# 6. Post-build optimizations
echo "📦 Post-build optimizations..."

if [ -d "dist" ]; then
    cd dist
    
    # Remove source maps
    find . -name "*.map" -delete
    
    # Compress JavaScript files
    if command -v terser &> /dev/null; then
        find . -name "*.js" -not -path "*/node_modules/*" -exec terser {} --compress --mangle --output {} \;
    fi
    
    # Compress CSS files
    if command -v cleancss &> /dev/null; then
        find . -name "*.css" -exec cleancss -o {} {} \;
    fi
    
    cd ..
fi

# 7. Create compressed archives of assets
echo "🗜️ Creating compressed assets..."
if [ -d "dist/public" ]; then
    cd dist/public
    
    # Create gzip versions
    find . -type f \( -name "*.js" -o -name "*.css" -o -name "*.html" -o -name "*.svg" \) -exec gzip -9 -k {} \;
    
    # Create brotli versions if available
    if command -v brotli &> /dev/null; then
        find . -type f \( -name "*.js" -o -name "*.css" -o -name "*.html" -o -name "*.svg" \) -exec brotli -q 11 -k {} \;
    fi
    
    cd ../..
fi

# 8. Generate size report
echo "📊 Generating size report..."
if [ -d "dist" ]; then
    echo "=== BUILD SIZE REPORT ===" > deployment-size-report.txt
    echo "Generated: $(date)" >> deployment-size-report.txt
    echo "" >> deployment-size-report.txt
    
    echo "Total dist directory size:" >> deployment-size-report.txt
    du -sh dist >> deployment-size-report.txt
    echo "" >> deployment-size-report.txt
    
    echo "Largest files in dist:" >> deployment-size-report.txt
    find dist -type f -exec ls -lah {} \; | sort -k5 -hr | head -20 >> deployment-size-report.txt
    echo "" >> deployment-size-report.txt
    
    echo "File type breakdown:" >> deployment-size-report.txt
    echo "JavaScript files:" >> deployment-size-report.txt
    find dist -name "*.js" -exec ls -lah {} \; | awk '{sum += $5} END {print "Total JS:", sum/1024/1024, "MB"}' >> deployment-size-report.txt
    
    echo "CSS files:" >> deployment-size-report.txt
    find dist -name "*.css" -exec ls -lah {} \; | awk '{sum += $5} END {print "Total CSS:", sum/1024/1024, "MB"}' >> deployment-size-report.txt
    
    echo "Image files:" >> deployment-size-report.txt
    find dist -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" -o -name "*.gif" -o -name "*.svg" | wc -l >> deployment-size-report.txt
    
    cat deployment-size-report.txt
fi

# 9. Final cleanup
echo "🔧 Final cleanup..."

# Remove any remaining development artifacts
rm -f .env.development
rm -f .env.local
rm -f .env.test

# Clean package files that might have been copied
rm -f dist/package.json 2>/dev/null
rm -f dist/package-lock.json 2>/dev/null
rm -f dist/yarn.lock 2>/dev/null

# 10. Verify build
echo "✅ Verifying build..."
if [ -f "dist/index.js" ]; then
    echo "✓ Server build found"
else
    echo "✗ Server build missing"
    exit 1
fi

if [ -d "dist/public" ]; then
    echo "✓ Client build found"
else
    echo "✗ Client build missing"
    exit 1
fi

echo ""
echo "🎉 Deployment optimization completed!"
echo "📏 Final size: $(du -sh dist | cut -f1)"
echo "📋 Size report saved to: deployment-size-report.txt"
echo ""
echo "💡 Next steps:"
echo "   - Review the size report"
echo "   - Test the application locally"
echo "   - Deploy to production"