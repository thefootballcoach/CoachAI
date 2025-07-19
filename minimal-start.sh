#!/bin/bash
# Minimal production start script that avoids all common issues

echo "Starting CoachAI Production Server..."

# Set minimal required environment
export NODE_ENV=production

# Use default port if not set
export PORT=${PORT:-5000}

# Start server directly without any complex setup
exec node dist/index.js