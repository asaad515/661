type CacheItem<T> = {
  data: T;
  timestamp: number;
  expiry: number;
};

export class CacheManager {
  private static instance: CacheManager;
  private cache: Map<string, CacheItem<any>>;
  private subscribers: Map<string, Set<(data: any) => void>>;
  private defaultExpiry: number = 5 * 60 * 1000; // 5 minutes

  private constructor() {
    this.cache = new Map();
    this.subscribers = new Map();
  }

  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  async get<T>(key: string, fetcher?: () => Promise<T>, expiry?: number): Promise<T | null> {
    const item = this.cache.get(key);
    const now = Date.now();

    if (item && now - item.timestamp < item.expiry) {
      return item.data;
    }

    if (fetcher) {
      try {
        const data = await fetcher();
        this.set(key, data, expiry);
        return data;
      } catch (error) {
        console.error(`Failed to fetch data for key ${key}:`, error);
        return null;
      }
    }

    return null;
  }

  set<T>(key: string, data: T, expiry: number = this.defaultExpiry): void {
    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      expiry,
    };

    this.cache.set(key, item);
    this.notifySubscribers(key, data);
  }

  subscribe<T>(key: string, callback: (data: T) => void): () => void {
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set());
    }

    const subscribers = this.subscribers.get(key)!;
    subscribers.add(callback);

    // Return unsubscribe function
    return () => {
      subscribers.delete(callback);
      if (subscribers.size === 0) {
        this.subscribers.delete(key);
      }
    };
  }

  private notifySubscribers(key: string, data: any): void {
    const subscribers = this.subscribers.get(key);
    if (subscribers) {
      subscribers.forEach(callback => callback(data));
    }
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }

  invalidatePattern(pattern: RegExp): void {
    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        this.invalidate(key);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }
}

// هوك مخصص لاستخدام الكاش
export function useCache<T>(
  key: string,
  fetcher?: () => Promise<T>,
  options: {
    expiry?: number;
    onSuccess?: (data: T) => void;
    onError?: (error: any) => void;
  } = {}
) {
  const cache = CacheManager.getInstance();
  const [data, setData] = React.useState<T | null>(null);
  const [error, setError] = React.useState<Error | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const result = await cache.get(key, fetcher, options.expiry);
        if (mounted) {
          setData(result);
          options.onSuccess?.(result);
        }
      } catch (err) {
        if (mounted) {
          setError(err as Error);
          options.onError?.(err);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    fetchData();

    const unsubscribe = cache.subscribe(key, (newData) => {
      if (mounted) {
        setData(newData);
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [key]);

  return { data, error, isLoading };
}