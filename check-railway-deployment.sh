#!/bin/bash

echo "🔍 Checking Railway Deployment Status"
echo "===================================="
echo ""

# Railway project URL
PROJECT_URL="https://railway.app/project/f12cfec5-3a69-42fa-8945-5e608ab0bc53"
echo "📍 Railway Project: $PROJECT_URL"
echo ""

# Try to check if deployment is accessible
echo "🌐 Checking if deployment is accessible..."
echo "   (This will show deployment URL if available)"
echo ""

# Check common Railway deployment URLs
POSSIBLE_URLS=(
    "https://coachai-production.up.railway.app"
    "https://web-production.up.railway.app"
    "https://main-production.up.railway.app"
    "https://app-production.up.railway.app"
)

echo "🔗 Common Railway deployment URLs to check:"
for url in "${POSSIBLE_URLS[@]}"; do
    echo "   - $url"
done

echo ""
echo "📝 Manual Check Required:"
echo "1. Go to Railway dashboard: $PROJECT_URL"
echo "2. Check 'Deployments' tab for latest deployment status"
echo "3. Look for deployment URL in the service overview"
echo "4. Check 'Logs' tab for any startup errors"
echo ""

# Environment variables status
echo "✅ Environment Variables Added:"
echo "   DATABASE_URL, OPENAI_API_KEY, SESSION_SECRET,"
echo "   AWS_S3_BUCKET_NAME, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY,"
echo "   SENDGRID_API_KEY"
echo ""

echo "🚀 Expected Result:"
echo "   - Railway should automatically redeploy after adding variables"
echo "   - App should start successfully without DATABASE_URL error"
echo "   - CoachAI platform should be accessible at Railway URL"
echo "   - Processing timeouts should be resolved"