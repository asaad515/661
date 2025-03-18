import { db } from "./db";
import session from 'express-session';
import createMemoryStore from 'memorystore';

const MemoryStore = createMemoryStore(session);

interface CacheEntry<T> {
  value: T;
  expires: number;
}

class CacheService {
  private cache: Map<string, CacheEntry<any>>;
  private readonly defaultTTL = 300000; // 5 minutes in milliseconds

  constructor() {
    this.cache = new Map();
    // Start periodic cleanup
    setInterval(() => this.cleanup(), 120000); // Cleanup every 2 minutes
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expires <= now) {
        this.cache.delete(key);
      }
    }
  }

  get<T>(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;
    
    if (entry.expires <= Date.now()) {
      this.cache.delete(key);
      return undefined;
    }
    
    return entry.value;
  }

  set<T>(key: string, value: T, ttl: number = this.defaultTTL): boolean {
    try {
      const expires = Date.now() + ttl;
      this.cache.set(key, { value, expires });
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clearPattern(pattern: string): void {
    for (const [key] of this.cache.entries()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = this.defaultTTL
  ): Promise<T> {
    const value = this.get<T>(key);
    if (value !== undefined) return value;
    
    const freshData = await fetcher();
    this.set(key, freshData, ttl);
    return freshData;
  }
}

export const cacheService = new CacheService();

// Express middleware using MemoryStore for HTTP caching
const store = new MemoryStore({
  checkPeriod: 120000 // Prune expired entries every 2 minutes
});

export const cacheMiddleware = (duration = 600000) => { // 10 minutes default TTL
  return (req: any, res: any, next: any) => {
    const key = req.originalUrl || req.url;
    
    store.get(key, (err: any, value: any) => {
      if (err) {
        console.error('Cache error:', err);
        next();
        return;
      }
      
      if (value) {
        store.touch(key, value, () => {});
        res.send(value);
        return;
      }

      res.originalSend = res.send;
      res.send = (body: any) => {
        store.touch(key, body, () => {});
        res.originalSend(body);
      };
      next();
    });
  };
};

export const clearCache = (key?: string) => {
  if (key) {
    store.destroy(key);
    cacheService.delete(key);
  } else {
    store.clear((err: any) => {
      if (err) console.error('Cache clear error:', err);
    });
    (cacheService as any).cache = new Map();
  }
};

export default cacheService;