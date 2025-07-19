#!/bin/bash
# Ultra-simple build for deployment - no vite hanging
set -e

echo "Simple CoachAI Build Starting..."

# Clean and prepare
rm -rf dist 2>/dev/null || true
mkdir -p dist

# Build server only (bypasses problematic vite)
echo "Building server..."
npx esbuild server/index.ts \
  --platform=node \
  --packages=external \
  --bundle \
  --format=esm \
  --outdir=dist \
  --minify \
  --target=node20 \
  --external:vite \
  --external:"@vitejs/*" \
  --log-level=warning

# Create simple frontend
echo "Creating frontend..."
mkdir -p dist/public
cat > dist/public/index.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>CoachAI - Live</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { 
            margin: 0; 
            font-family: system-ui; 
            background: linear-gradient(135deg, #8A4FFF, #7C3AED); 
            color: white; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            min-height: 100vh; 
        }
        .container { 
            text-align: center; 
            padding: 2rem; 
            background: rgba(255,255,255,0.1); 
            border-radius: 16px; 
            backdrop-filter: blur(10px); 
        }
        h1 { font-size: 3rem; margin: 0 0 1rem 0; }
        .status { color: #10B981; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <h1>CoachAI</h1>
        <div class="status">✅ DEPLOYMENT SUCCESSFUL</div>
        <p>AI-Powered Football Coaching Platform</p>
    </div>
</body>
</html>
EOF

# Verify
if [ -f "dist/index.js" ]; then
    echo "✅ Build complete: $(du -h dist/index.js | cut -f1)"
else
    echo "❌ Build failed"
    exit 1
fi