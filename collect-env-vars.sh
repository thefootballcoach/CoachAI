#!/bin/bash

echo "🔧 CoachAI Environment Variables Collection Script"
echo "================================================="
echo ""
echo "Copy these environment variables to your Railway project:"
echo ""

# Check if we're in Replit environment
if [ -n "$REPLIT_DEPLOYMENT" ] || [ -n "$REPL_OWNER" ]; then
    echo "📍 Detected Replit environment - collecting current variables..."
    echo ""
    
    # Database URL
    if [ -n "$DATABASE_URL" ]; then
        echo "✅ DATABASE_URL=$DATABASE_URL"
    else
        echo "❌ DATABASE_URL=<not set - add PostgreSQL service in Railway>"
    fi
    
    # OpenAI API Key
    if [ -n "$OPENAI_API_KEY" ]; then
        echo "✅ OPENAI_API_KEY=$OPENAI_API_KEY"
    else
        echo "❌ OPENAI_API_KEY=<not set>"
    fi
    
    # Session Secret
    if [ -n "$SESSION_SECRET" ]; then
        echo "✅ SESSION_SECRET=$SESSION_SECRET"
    else
        echo "❌ SESSION_SECRET=<generate random string>"
    fi
    
    # AWS S3 Variables
    if [ -n "$AWS_S3_BUCKET_NAME" ]; then
        echo "✅ AWS_S3_BUCKET_NAME=$AWS_S3_BUCKET_NAME"
    else
        echo "⚠️  AWS_S3_BUCKET_NAME=<optional - for file storage>"
    fi
    
    if [ -n "$AWS_ACCESS_KEY_ID" ]; then
        echo "✅ AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID"
    else
        echo "⚠️  AWS_ACCESS_KEY_ID=<optional - for file storage>"
    fi
    
    if [ -n "$AWS_SECRET_ACCESS_KEY" ]; then
        echo "✅ AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY"
    else
        echo "⚠️  AWS_SECRET_ACCESS_KEY=<optional - for file storage>"
    fi
    
    # SendGrid API Key
    if [ -n "$SENDGRID_API_KEY" ]; then
        echo "✅ SENDGRID_API_KEY=$SENDGRID_API_KEY"
    else
        echo "⚠️  SENDGRID_API_KEY=<optional - for email notifications>"
    fi
    
else
    echo "❌ Not running in Replit environment"
    echo "   Please run this script in your Replit project to collect variables"
fi

echo ""
echo "🚀 Next Steps:"
echo "1. Copy the ✅ variables above"
echo "2. Go to Railway dashboard → Variables tab"
echo "3. Add each variable using 'New Variable' button"
echo "4. Railway will automatically redeploy with new environment"
echo ""
echo "📍 Railway Project: https://railway.app/project/f12cfec5-3a69-42fa-8945-5e608ab0bc53"