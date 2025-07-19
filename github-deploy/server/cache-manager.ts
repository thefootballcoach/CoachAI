import { LRUCache } from 'lru-cache';

interface CacheOptions {
  maxSize?: number;
  ttl?: number; // Time to live in milliseconds
}

class CacheManager {
  private caches: Map<string, LRUCache<string, any>> = new Map();

  // Create or get a cache instance
  getCache(name: string, options: CacheOptions = {}) {
    if (!this.caches.has(name)) {
      this.caches.set(name, new LRUCache({
        max: options.maxSize || 500,
        ttl: options.ttl || 5 * 60 * 1000, // 5 minutes default
        allowStale: false,
        updateAgeOnGet: true,
        updateAgeOnHas: true,
      }));
    }
    return this.caches.get(name)!;
  }

  // Cache decorator for expensive operations
  async withCache<T>(
    cacheKey: string,
    operation: () => Promise<T>,
    cacheName: string = 'default',
    ttl?: number
  ): Promise<T> {
    const cache = this.getCache(cacheName, { ttl });
    
    // Check if we have cached result
    const cached = cache.get(cacheKey);
    if (cached !== undefined) {
      return cached;
    }

    // Execute operation and cache result
    try {
      const result = await operation();
      cache.set(cacheKey, result);
      return result;
    } catch (error) {
      // Don't cache errors
      throw error;
    }
  }

  // Invalidate cache entries
  invalidate(cacheKey: string, cacheName: string = 'default') {
    const cache = this.caches.get(cacheName);
    if (cache) {
      cache.delete(cacheKey);
    }
  }

  // Clear entire cache
  clear(cacheName?: string) {
    if (cacheName) {
      const cache = this.caches.get(cacheName);
      if (cache) {
        cache.clear();
      }
    } else {
      // Clear all caches
      this.caches.forEach(cache => cache.clear());
    }
  }

  // Get cache statistics
  getStats() {
    const stats: Record<string, any> = {};
    this.caches.forEach((cache, name) => {
      stats[name] = {
        size: cache.size,
        calculatedSize: cache.calculatedSize,
        max: cache.max,
        maxSize: cache.maxSize,
      };
    });
    return stats;
  }
}

export const cacheManager = new CacheManager();

// Specialized caches with optimized settings
export const userCache = cacheManager.getCache('users', { maxSize: 1000, ttl: 10 * 60 * 1000 }); // 10 min
export const videoCache = cacheManager.getCache('videos', { maxSize: 2000, ttl: 5 * 60 * 1000 }); // 5 min
export const feedbackCache = cacheManager.getCache('feedback', { maxSize: 1000, ttl: 15 * 60 * 1000 }); // 15 min
export const clubCache = cacheManager.getCache('clubs', { maxSize: 200, ttl: 30 * 60 * 1000 }); // 30 min