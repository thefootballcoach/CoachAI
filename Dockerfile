# Use official Node.js runtime
FROM node:20-alpine

# Install FFmpeg for audio processing
RUN apk add --no-cache ffmpeg

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --force

# Copy source code
COPY . .

# Build the application (skip if build fails)
RUN npm run build || echo "Build failed, continuing with dev mode"

# Expose port
EXPOSE 5000

# No healthcheck for Railway deployment

# Start the application
CMD ["npm", "run", "dev"]