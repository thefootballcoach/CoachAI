#!/bin/bash

echo "🔍 DEPLOYMENT SIZE ANALYSIS"
echo "=========================="

echo ""
echo "📊 Total dist/ size:"
if [ -d "dist" ]; then
    du -sh dist/
else
    echo "❌ No dist/ directory found. Run ./emergency-build.sh first"
    exit 1
fi

echo ""
echo "📁 File count in dist/:"
find dist/ -type f | wc -l

echo ""
echo "📋 Largest files in dist/:"
find dist/ -type f -exec ls -lah {} \; | sort -k5 -hr | head -10

echo ""
echo "🗂️ Directory structure:"
tree dist/ 2>/dev/null || find dist/ -type d

echo ""
echo "💾 File types breakdown:"
echo "JavaScript files:"
find dist/ -name "*.js" | wc -l
echo "CSS files:"
find dist/ -name "*.css" | wc -l
echo "HTML files:"
find dist/ -name "*.html" | wc -l
echo "Other files:"
find dist/ -type f ! -name "*.js" ! -name "*.css" ! -name "*.html" | wc -l

echo ""
echo "🎯 DEPLOYMENT READINESS:"
total_files=$(find dist/ -type f | wc -l)
total_size=$(du -s dist/ | cut -f1)

if [ $total_files -lt 50 ] && [ $total_size -lt 51200 ]; then
    echo "✅ READY FOR DEPLOYMENT"
    echo "   Files: $total_files (< 50 limit)"
    echo "   Size: ${total_size}KB (< 50MB estimated limit)"
else
    echo "⚠️ MAY STILL BE TOO LARGE"
    echo "   Files: $total_files"
    echo "   Size: ${total_size}KB"
    echo "   Consider further optimization"
fi