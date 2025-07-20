import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { startCleanupSchedule } from "./cleanup";
import { systemMonitor } from "./system-monitor";
import { responseOptimizationMiddleware } from "./response-compression";
import { generalThrottler } from "./request-throttling";
import path from "path";
import http from "http";
import fs from "fs";

// Load version information
const VERSION_INFO = {
  version: "1.2.1", 
  build: "2025-07-20",
  description: "Fixed AI duplicate feedback creation bug + eliminated placeholder content",
  deploymentTrigger: "2025-07-20T21:27:00Z"
};

// Deployment-specific Node.js configuration for 8GB uploads
process.env.NODE_OPTIONS = '--max-http-header-size=16777216 --max-old-space-size=8192'; // 16MB headers, 8GB memory
console.log("Set NODE_OPTIONS:", process.env.NODE_OPTIONS);

// Additional Node.js server limits for deployment
process.setMaxListeners(0);

// Detect deployment environment and apply specific configurations
const isDeployment = process.env.NODE_ENV === 'production' || 
                     process.env.REPLIT_DEPLOYMENT || 
                     process.env.REPL_OWNER ||
                     !process.env.REPL_SLUG?.includes('preview');

if (isDeployment) {
  console.log("DEPLOYMENT ENVIRONMENT DETECTED - Applying 8GB upload configuration");
  
  // Force deployment-specific Node.js settings
  process.env.UV_THREADPOOL_SIZE = '128';
  process.env.NODE_NO_WARNINGS = '1';
  
  // Override any platform limits with aggressive settings
  import('v8').then(v8 => v8.setFlagsFromString('--max-old-space-size=8192'));
  
  // Log deployment detection
  console.log("Deployment settings applied:", {
    nodeEnv: process.env.NODE_ENV,
    replitDeployment: process.env.REPLIT_DEPLOYMENT,
    replOwner: process.env.REPL_OWNER,
    replSlug: process.env.REPL_SLUG
  });
} else {
  console.log("Preview environment detected - using standard configuration");
}

const app = express();

// Create HTTP server with maximum header size limits
const server = http.createServer({
  maxHeaderSize: 16777216 // 16MB headers - matches NODE_OPTIONS
}, app);

// Set server timeout properties after creation
server.timeout = 0;
server.headersTimeout = 0;
server.requestTimeout = 0;

// Add performance optimization middleware first
app.use(responseOptimizationMiddleware);

// Add request throttling for API protection
app.use('/api', generalThrottler.middleware);

// Configure Express for maximum upload capacity - deployment override
app.use(express.json({ 
  limit: '8gb', // Increase to maximum for deployment compatibility
  verify: (req, res, buf) => {
    // Track upload progress for large files
    if (buf.length > 100 * 1024 * 1024) { // 100MB+
      console.log(`Large JSON upload: ${(buf.length / 1024 / 1024).toFixed(1)}MB`);
    }
  }
}));
app.use(express.urlencoded({ 
  extended: true,
  limit: '8gb', // Increase to maximum for deployment
  parameterLimit: 1000,
  verify: (req, res, buf) => {
    // Track upload progress for large form data
    if (buf.length > 100 * 1024 * 1024) { // 100MB+
      console.log(`Large form upload: ${(buf.length / 1024 / 1024).toFixed(1)}MB`);
    }
  }
}));

// Deployment-specific upload middleware
if (isDeployment) {
  console.log("Applying deployment-specific upload middleware");
  
  // Override any deployment platform limits with aggressive middleware
  app.use('/api/audios/upload', (req, res, next) => {
    console.log("DEPLOYMENT UPLOAD MIDDLEWARE: Processing large file upload");
    
    // Force deployment-specific settings for this request
    req.setTimeout(0);
    res.setTimeout(0);
    
    // Set maximum limits for deployment environment
    if (req.socket) {
      req.socket.setTimeout(0);
      req.socket.setNoDelay(true);
      req.socket.setKeepAlive(true);
    }
    
    // Log deployment upload attempt
    console.log("Deployment upload request:", {
      method: req.method,
      url: req.url,
      contentLength: req.headers['content-length'],
      contentType: req.headers['content-type']
    });
    
    next();
  });
}

// Configure server for large uploads with comprehensive settings
app.use((req, res, next) => {
  // Set no timeouts for large file uploads
  req.setTimeout(0);
  res.setTimeout(0);
  
  // Set socket options for large requests
  if (req.socket) {
    req.socket.setMaxListeners(0);
    req.socket.setTimeout(0);
  }
  
  // Set response headers to handle large requests with proper CORS for credentials
  res.setHeader('Accept-Ranges', 'bytes');
  
  // Fix CORS for authentication - allow specific origin with credentials
  const origin = req.headers.origin;
  if (origin && (origin.includes('localhost') || origin.includes('replit'))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5000');
  }
  
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With, Cookie');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  next();
});

// Health check endpoint for Railway deployment
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: VERSION_INFO.version
  });
});

// Version endpoint for deployment tracking
app.get('/api/version', (req, res) => {
  res.json({
    ...VERSION_INFO,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    isDeployment: isDeployment,
    uptime: process.uptime()
  });
});

// Serve test upload page for debugging
app.get('/test-upload', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'test-large-upload.html'));
});

// Serve frontend debug tool
app.get('/debug-frontend-upload.html', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'debug-frontend-upload.html'));
});

// Add custom middleware to handle large uploads
app.use((req, res, next) => {
  // Set extended timeouts for large multipart requests
  if (req.headers['content-type']?.includes('multipart/form-data')) {
    req.setTimeout(60 * 60 * 1000); // 60 minutes for 6GB files
    res.setTimeout(60 * 60 * 1000);
  }
  next();
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
    console.error('Express error handler triggered:', {
      error: err.message,
      code: err.code,
      status: err.status,
      url: req.url,
      method: req.method,
      contentLength: req.headers['content-length'],
      isDeployment: isDeployment
    });

    // Enhanced deployment-specific error handling for uploads
    if (err.status === 413 || err.code === 'LIMIT_FILE_SIZE' || err.message.includes('too large')) {
      console.error('413 Error detected - Deployment environment:', isDeployment);
      
      if (isDeployment) {
        // Deployment-specific 413 error handling
        console.error('DEPLOYMENT 413 ERROR - Platform restriction detected');
        return res.status(413).json({
          error: 'Deployment upload limit exceeded',
          message: 'Upload failed due to deployment platform restrictions. This works in preview but fails in deployment.',
          maxSize: '8GB configured but platform may have lower limits',
          received: req.headers['content-length'],
          environment: 'deployment',
          suggestion: 'Try smaller file or contact support for platform limit increase'
        });
      } else {
        return res.status(413).json({
          error: 'Request entity too large',
          message: 'Upload size exceeds server limits',
          maxSize: '8GB',
          received: req.headers['content-length'],
          environment: 'preview'
        });
      }
    }
    const status = err.status || err.statusCode || 500;
    let message = err.message || "Internal Server Error";
    
    // Handle specific error types
    if (err.code === 'LIMIT_FILE_SIZE') {
      message = "File size too large. Maximum allowed size is 8GB.";
    } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      message = "Unexpected file field.";
    } else if (err.type === 'entity.too.large') {
      message = "Request entity too large. Maximum allowed size is 8GB.";
    }
    
    console.error(`[ERROR] ${status}: ${message}`, {
      code: err.code,
      type: err.type,
      path: req.path,
      method: req.method
    });
    
    // Log upload errors for tracking
    if (err.code === 'LIMIT_FILE_SIZE' || err.type === 'entity.too.large') {
      import("./error-logger").then(({ errorLogger }) => {
        errorLogger.logUploadError(req, err, {
          fileSize: req.get('content-length'),
          errorCode: err.code,
          errorType: err.type
        }).catch(console.error);
      });
    }
    
    res.status(status).json({ message });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Use Railway's PORT environment variable or fallback to 5000
  // Railway automatically sets PORT environment variable for production
  // this serves both the API and the client.
  const port = process.env.PORT || 5000;
  
  const startServer = () => {
    // Configure server for large file uploads
    server.maxHeadersCount = 0;
    server.timeout = 30 * 60 * 1000; // 30 minutes
    server.requestTimeout = 30 * 60 * 1000;
    server.keepAliveTimeout = 30 * 60 * 1000;
    server.headersTimeout = 30 * 60 * 1000;
    
    server.listen({
      port,
      host: "0.0.0.0",
    }, async () => {
      log(`serving on port ${port}`);

      // Start processing monitor
      console.log('Starting processing monitor...');
      const { processingMonitor } = await import('./processing-monitor');
      processingMonitor.start();
      
      // Start the automated cleanup system
      startCleanupSchedule();
      systemMonitor.start();
    }).on('error', (e: any) => {
      if (e.code === 'EADDRINUSE') {
        // In production deployment, try alternative ports instead of infinite retry
        if (process.env.NODE_ENV === 'production') {
          const alternativePorts = [3000, 4000, 8080, 8000];
          for (const altPort of alternativePorts) {
            try {
              server.listen({
                port: altPort,
                host: "0.0.0.0",
                reusePort: true,
              }, () => {
                log(`serving on alternative port ${altPort}`);
                startCleanupSchedule();
                systemMonitor.start();
              });
              return;
            } catch (err) {
              continue;
            }
          }
          log(`ERROR: All ports busy. Cannot start server.`);
          process.exit(1);
        } else {
          // In development, exit gracefully instead of infinite retry
          log(`Port ${port} is busy. Please stop other servers first.`);
          process.exit(1);
        }
      } else {
        throw e;
      }
    });
  };
  
  startServer();
})();
