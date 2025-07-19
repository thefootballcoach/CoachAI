import { Request, Response, NextFunction } from 'express';

interface ThrottleConfig {
  windowMs: number;
  maxRequests: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

class RequestThrottler {
  private requests: Map<string, number[]> = new Map();
  private config: ThrottleConfig;

  constructor(config: ThrottleConfig) {
    this.config = config;
    
    // Clean up old entries every 5 minutes
    setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  middleware = (req: Request, res: Response, next: NextFunction) => {
    const key = this.getKey(req);
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    // Get existing requests for this key
    let requests = this.requests.get(key) || [];
    
    // Filter out old requests
    requests = requests.filter(timestamp => timestamp > windowStart);
    
    // Check if limit is exceeded
    if (requests.length >= this.config.maxRequests) {
      return res.status(429).json({
        error: 'Too many requests',
        retryAfter: Math.ceil(this.config.windowMs / 1000)
      });
    }

    // Add current request
    requests.push(now);
    this.requests.set(key, requests);

    // Add rate limit headers
    res.setHeader('X-RateLimit-Limit', this.config.maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, this.config.maxRequests - requests.length));
    res.setHeader('X-RateLimit-Reset', Math.ceil((now + this.config.windowMs) / 1000));

    next();
  };

  private getKey(req: Request): string {
    // Use user ID if authenticated, otherwise IP
    const user = (req as any).user;
    return user?.id ? `user:${user.id}` : `ip:${req.ip}`;
  }

  private cleanup() {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    for (const [key, requests] of this.requests.entries()) {
      const validRequests = requests.filter(timestamp => timestamp > windowStart);
      if (validRequests.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, validRequests);
      }
    }
  }
}

// Pre-configured throttlers for different endpoints
export const generalThrottler = new RequestThrottler({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 1000 // 1000 requests per 15 minutes
});

export const uploadThrottler = new RequestThrottler({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 50 // 50 uploads per hour
});

export const authThrottler = new RequestThrottler({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 10 // 10 auth attempts per 15 minutes
});