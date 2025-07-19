#!/bin/bash
# Start server with explicit large header support

export NODE_OPTIONS="--max-http-header-size=2097152"  # 2MB headers
echo "Starting server with NODE_OPTIONS: $NODE_OPTIONS"

npm run dev