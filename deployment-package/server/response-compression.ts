import { Request, Response, NextFunction } from 'express';
import { createGzip, createDeflate } from 'zlib';
import { pipeline } from 'stream';

// Middleware for response compression
export function compressionMiddleware(req: Request, res: Response, next: NextFunction) {
  const acceptEncoding = req.headers['accept-encoding'] || '';
  
  // Skip compression for small responses
  const originalJson = res.json.bind(res);
  res.json = function(obj: any) {
    const jsonString = JSON.stringify(obj);
    
    // Only compress responses larger than 1KB
    if (jsonString.length < 1024) {
      return originalJson.call(this, obj);
    }
    
    // Apply compression based on client support
    if (acceptEncoding.includes('gzip')) {
      res.setHeader('Content-Encoding', 'gzip');
      res.setHeader('Content-Type', 'application/json');
      
      const gzip = createGzip({ level: 6 }); // Balanced compression level
      res.setHeader('Content-Length', ''); // Remove content-length for streaming
      
      pipeline(
        Buffer.from(jsonString),
        gzip,
        res,
        (err) => {
          if (err) console.error('Compression error:', err);
        }
      );
    } else if (acceptEncoding.includes('deflate')) {
      res.setHeader('Content-Encoding', 'deflate');
      res.setHeader('Content-Type', 'application/json');
      
      const deflate = createDeflate({ level: 6 });
      res.setHeader('Content-Length', '');
      
      pipeline(
        Buffer.from(jsonString),
        deflate,
        res,
        (err) => {
          if (err) console.error('Compression error:', err);
        }
      );
    } else {
      return originalJson.call(this, obj);
    }
  };
  
  next();
}

// Response optimization middleware
export function responseOptimizationMiddleware(req: Request, res: Response, next: NextFunction) {
  // Set performance headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Optimize caching for static assets
  if (req.url.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/)) {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable'); // 1 year
  }
  
  // Set cache headers for API responses
  if (req.url.startsWith('/api/')) {
    // Short cache for dynamic content
    res.setHeader('Cache-Control', 'private, max-age=60'); // 1 minute
    
    // Conditional requests support
    const ifNoneMatch = req.headers['if-none-match'];
    if (ifNoneMatch) {
      res.setHeader('ETag', ifNoneMatch);
    }
  }
  
  next();
}