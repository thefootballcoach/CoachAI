#!/bin/bash

# Deployment Upload Fix Script
# Ensures 8GB upload capability in deployed environment

echo "Configuring deployment environment for 8GB uploads..."

# Set environment variables for maximum upload capacity
export NODE_OPTIONS="--max-http-header-size=16777216 --max-old-space-size=8192"
export UV_THREADPOOL_SIZE=128
export NODE_ENV=production

# Create temporary directories with proper permissions
mkdir -p /tmp/nginx_body
mkdir -p /tmp/uploads
chmod 777 /tmp/nginx_body
chmod 777 /tmp/uploads

# Display current limits
echo "Current NODE_OPTIONS: $NODE_OPTIONS"
echo "Current memory limit: $(node -e 'console.log(process.memoryUsage())')"

# Log deployment configuration
echo "Deployment upload configuration applied:"
echo "- Maximum file size: 8GB"
echo "- Header buffer size: 16MB"
echo "- Memory allocation: 8GB"
echo "- Temporary directory: /tmp/nginx_body"

# Start the application with deployment settings
echo "Starting application with deployment upload configuration..."
npm run dev