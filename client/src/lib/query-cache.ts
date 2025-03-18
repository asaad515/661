import { useCallback, useEffect, useRef } from 'react';
import { CacheManager } from './cache-manager';

interface QueryConfig<T> {
  key: string;
  fetcher: () => Promise<T>;
  staleTime?: number;
  cacheTime?: number;
  prefetch?: boolean;
  retryCount?: number;
  retryDelay?: number;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  dependencies?: any[];
}

interface QueryState<T> {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
  isStale: boolean;
  lastUpdated: number | null;
}

export class QueryCache {
  private static instance: QueryCache;
  private cache: CacheManager;
  private prefetchQueue: Set<string>;
  private activeQueries: Map<string, Promise<any>>;
  private subscribers: Map<string, Set<(state: QueryState<any>) => void>>;

  private constructor() {
    this.cache = CacheManager.getInstance();
    this.prefetchQueue = new Set();
    this.activeQueries = new Map();
    this.subscribers = new Map();

    this.startPrefetchWorker();
  }

  static getInstance(): QueryCache {
    if (!QueryCache.instance) {
      QueryCache.instance = new QueryCache();
    }
    return QueryCache.instance;
  }

  private startPrefetchWorker(): void {
    setInterval(() => {
      this.processPrefetchQueue();
    }, 1000);
  }

  private async processPrefetchQueue(): Promise<void> {
    for (const key of this.prefetchQueue) {
      const cachedData = await this.cache.get(key);
      if (!cachedData) {
        // سيتم تحميل البيانات عند الحاجة الفعلية
        continue;
      }
      this.prefetchQueue.delete(key);
    }
  }

  async query<T>(config: QueryConfig<T>): Promise<QueryState<T>> {
    const {
      key,
      fetcher,
      staleTime = 5 * 60 * 1000, // 5 دقائق
      cacheTime = 30 * 60 * 1000, // 30 دقيقة
      retryCount = 3,
      retryDelay = 1000,
      onSuccess,
      onError
    } = config;

    let attempts = 0;
    const state: QueryState<T> = {
      data: null,
      error: null,
      isLoading: true,
      isStale: false,
      lastUpdated: null
    };

    try {
      // التحقق من وجود استعلام نشط
      let activeQuery = this.activeQueries.get(key);
      if (activeQuery) {
        return activeQuery;
      }

      // التحقق من الكاش
      const cachedData = await this.cache.get<T>(key);
      if (cachedData) {
        const cacheTimestamp = await this.cache.get<number>(`${key}:timestamp`);
        const isStale = cacheTimestamp ? Date.now() - cacheTimestamp > staleTime : true;

        state.data = cachedData;
        state.isStale = isStale;
        state.lastUpdated = cacheTimestamp || null;
        state.isLoading = isStale; // تحميل في الخلفية إذا كانت البيانات قديمة

        if (!isStale) {
          this.notifySubscribers(key, state);
          return state;
        }
      }

      // إنشاء وتخزين الاستعلام النشط
      const queryPromise = (async () => {
        while (attempts < retryCount) {
          try {
            const data = await fetcher();
            
            state.data = data;
            state.error = null;
            state.isLoading = false;
            state.isStale = false;
            state.lastUpdated = Date.now();

            // تحديث الكاش
            await this.cache.set(key, data, { expiry: cacheTime });
            await this.cache.set(`${key}:timestamp`, Date.now());

            onSuccess?.(data);
            this.notifySubscribers(key, state);
            this.activeQueries.delete(key);

            return state;
          } catch (error) {
            attempts++;
            if (attempts === retryCount) {
              state.error = error as Error;
              state.isLoading = false;
              onError?.(error as Error);
              this.notifySubscribers(key, state);
              this.activeQueries.delete(key);
              throw error;
            }
            await new Promise(resolve => setTimeout(resolve, retryDelay * attempts));
          }
        }

        return state;
      })();

      this.activeQueries.set(key, queryPromise);
      return queryPromise;
    } catch (error) {
      state.error = error as Error;
      state.isLoading = false;
      onError?.(error as Error);
      this.notifySubscribers(key, state);
      throw error;
    }
  }

  subscribe(key: string, callback: (state: QueryState<any>) => void): () => void {
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set());
    }

    const subscribers = this.subscribers.get(key)!;
    subscribers.add(callback);

    return () => {
      subscribers.delete(callback);
      if (subscribers.size === 0) {
        this.subscribers.delete(key);
      }
    };
  }

  private notifySubscribers(key: string, state: QueryState<any>): void {
    const subscribers = this.subscribers.get(key);
    if (subscribers) {
      subscribers.forEach(callback => callback(state));
    }
  }

  prefetch(key: string): void {
    this.prefetchQueue.add(key);
  }

  invalidate(key: string): void {
    this.cache.invalidate(key);
    this.cache.invalidate(`${key}:timestamp`);
    this.notifySubscribers(key, {
      data: null,
      error: null,
      isLoading: true,
      isStale: true,
      lastUpdated: null
    });
  }

  invalidatePattern(pattern: RegExp): void {
    this.cache.invalidatePattern(pattern);
  }
}

// هوك مخصص لاستخدام الاستعلامات
export function useQuery<T>(config: QueryConfig<T>) {
  const cache = QueryCache.getInstance();
  const stateRef = useRef<QueryState<T>>({
    data: null,
    error: null,
    isLoading: true,
    isStale: false,
    lastUpdated: null
  });

  const updateState = useCallback((newState: QueryState<T>) => {
    stateRef.current = newState;
  }, []);

  useEffect(() => {
    const unsubscribe = cache.subscribe(config.key, updateState);

    if (config.prefetch) {
      cache.prefetch(config.key);
    }

    cache.query(config).catch(console.error);

    return () => {
      unsubscribe();
    };
  }, [config.key, ...(config.dependencies || [])]);

  const refetch = useCallback(() => {
    return cache.query(config);
  }, [config]);

  const invalidate = useCallback(() => {
    cache.invalidate(config.key);
  }, [config.key]);

  return {
    ...stateRef.current,
    refetch,
    invalidate
  };
}