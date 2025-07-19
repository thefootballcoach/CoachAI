#!/bin/bash

echo "🔍 Finding Your Railway Deployment URL"
echo "====================================="
echo ""

# Railway project details
PROJECT_ID="f12cfec5-3a69-42fa-8945-5e608ab0bc53"
PROJECT_URL="https://railway.app/project/$PROJECT_ID"

echo "📍 Railway Project: $PROJECT_URL"
echo ""

echo "🔗 How to Find Your Deployment URL:"
echo "1. Go to: $PROJECT_URL"
echo "2. Click on your main service (should show as 'web' or similar)"
echo "3. Look for the 'Deployments' tab"
echo "4. Find the latest successful deployment"
echo "5. Look for the deployment URL (usually shows as a clickable link)"
echo ""

echo "📱 Common Railway URL Patterns:"
echo "   - https://[service-name]-production-[hash].up.railway.app"
echo "   - https://web-production-[hash].up.railway.app"
echo "   - https://main-production-[hash].up.railway.app"
echo ""

echo "🚀 Manual Steps:"
echo "1. Open Railway dashboard in your browser"
echo "2. Navigate to your CoachAI project"
echo "3. Click on the main service"
echo "4. Look for 'Settings' tab → 'Domains' section"
echo "5. The public URL should be displayed there"
echo ""

echo "⚠️  If No URL is Shown:"
echo "- Check if the deployment is actually running (green status)"
echo "- Verify the service is listening on PORT environment variable"
echo "- Check deployment logs for any binding errors"
echo ""

echo "🔍 Next Steps:"
echo "1. Copy the deployment URL from Railway dashboard"
echo "2. Test it in your browser"
echo "3. You should see your CoachAI login page"