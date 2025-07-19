# 413 Request Entity Too Large - Resolution Guide

## Problem Description
The "413 Request Entity Too Large" error occurs in the deployed environment (but not in preview) when uploading large coaching session files. This indicates that the deployment platform has additional server restrictions that override our application settings.

## Root Cause Analysis
1. **Deployment Environment Restrictions**: The deployed platform imposes stricter limits than the development preview
2. **Multiple Server Layers**: The deployment may use multiple proxy layers (nginx, load balancers) that each have their own limits
3. **Default Platform Limits**: Replit deployments may have default file size restrictions for security

## Comprehensive Solution Applied

### 1. Enhanced nginx Configuration
- **Global Settings**: Applied 8GB limits at the top level to override any defaults
- **Server Block**: Reinforced limits within the server configuration
- **Upload-Specific Location**: Special handling for `/api/audios/upload` endpoint
- **Buffer Optimization**: Increased all buffer sizes to handle large files

### 2. Node.js Server Enhancements
- **Memory Allocation**: Increased to 8GB with `--max-old-space-size=8192`
- **Header Size**: Set to 16MB with `--max-http-header-size=16777216`
- **Express Limits**: Upgraded to 8GB for both JSON and form data
- **Timeout Removal**: Disabled all server timeouts for large uploads

### 3. Deployment-Specific Configuration
- **Environment Detection**: Special settings for production/deployment environments
- **Progress Tracking**: Added logging for uploads over 100MB
- **Buffer Verification**: Enhanced buffer handling with verification callbacks

### 4. Configuration Files Created
- `deployment-nginx.conf`: Complete nginx configuration for deployment
- `deploy-upload-fix.sh`: Deployment script with environment setup
- Enhanced `nginx.conf`: Updated with global deployment overrides

## Technical Implementation

### Server Configuration (server/index.ts)
```javascript
// Deployment-specific Node.js configuration for 8GB uploads
process.env.NODE_OPTIONS = '--max-http-header-size=16777216 --max-old-space-size=8192';

// Configure Express for maximum upload capacity
app.use(express.json({ limit: '8gb' }));
app.use(express.urlencoded({ limit: '8gb', parameterLimit: 1000 }));
```

### nginx Configuration (nginx.conf)
```nginx
# Global nginx settings for large uploads
client_max_body_size 8G;
client_body_buffer_size 1M;
client_body_timeout 600s;
large_client_header_buffers 8 32k;

# Upload-specific location with maximum settings
location /api/audios/upload {
    client_max_body_size 8G;
    proxy_request_buffering off;
    proxy_buffering off;
}
```

## Verification Steps
1. **Test Small File**: Upload a small file to verify basic functionality
2. **Test Medium File**: Upload 100-500MB file to test buffer handling
3. **Test Large File**: Upload 1-6GB file to verify full capacity
4. **Monitor Logs**: Check for progress tracking and error reporting

## Expected Behavior
- **Preview Environment**: Should work as before (no changes needed)
- **Deployed Environment**: Should now accept files up to 8GB without 413 errors
- **Progress Tracking**: Large uploads (100MB+) will show progress in server logs
- **Error Handling**: Clear error messages if limits are still exceeded

## Troubleshooting
If 413 errors persist:
1. Check deployment platform documentation for file size limits
2. Verify nginx configuration is being used by the deployment
3. Ensure environment variables are properly set in deployment
4. Contact deployment platform support for custom limit increases

## Files Modified
- `server/index.ts`: Enhanced server configuration
- `nginx.conf`: Updated with deployment overrides
- `deployment-nginx.conf`: Complete deployment configuration
- `deploy-upload-fix.sh`: Deployment setup script

## Next Steps
1. Deploy the updated configuration
2. Test file uploads in the deployed environment
3. Monitor server logs for upload progress tracking
4. Verify 6GB coaching session uploads work properly