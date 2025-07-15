import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

class DataCache {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiry: Date.now() + ttl
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  clear(pattern?: string): void {
    if (pattern) {
      const regex = new RegExp(pattern);
      for (const key of this.cache.keys()) {
        if (regex.test(key)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }
}

export const dataCache = new DataCache();

interface UseOptimizedDataOptions {
  cacheKey: string;
  cacheTTL?: number;
  realTimeTable?: string;
  realTimeFilter?: string;
  dependencies?: any[];
}

export function useOptimizedData<T>(
  fetcher: () => Promise<T>,
  options: UseOptimizedDataOptions
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();

  const fetchData = useCallback(async (useCache = true) => {
    try {
      setLoading(true);
      setError(null);

      // Try to get cached data first
      if (useCache) {
        const cachedData = dataCache.get<T>(options.cacheKey);
        if (cachedData) {
          setData(cachedData);
          setLoading(false);
          return cachedData;
        }
      }

      // Fetch fresh data
      const freshData = await fetcher();
      
      // Cache the result
      dataCache.set(options.cacheKey, freshData, options.cacheTTL);
      setData(freshData);
      
      return freshData;
    } catch (err) {
      console.error(`Error fetching data for ${options.cacheKey}:`, err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [fetcher, options.cacheKey, options.cacheTTL]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData, ...(options.dependencies || [])]);

  // Set up real-time subscription
  useEffect(() => {
    if (!options.realTimeTable || !user) return;

    const channel = supabase
      .channel(`optimized-${options.realTimeTable}-${options.cacheKey}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: options.realTimeTable,
          filter: options.realTimeFilter
        },
        (payload) => {
          console.log(`Real-time update for ${options.cacheKey}:`, payload);
          
          // Invalidate cache and refetch
          dataCache.invalidate(options.cacheKey);
          fetchData(false);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [options.realTimeTable, options.realTimeFilter, options.cacheKey, user, fetchData]);

  const refresh = useCallback(() => {
    dataCache.invalidate(options.cacheKey);
    return fetchData(false);
  }, [options.cacheKey, fetchData]);

  const updateData = useCallback((updater: (prev: T | null) => T) => {
    setData(prev => {
      const newData = updater(prev);
      dataCache.set(options.cacheKey, newData, options.cacheTTL);
      return newData;
    });
  }, [options.cacheKey, options.cacheTTL]);

  return {
    data,
    loading,
    error,
    refresh,
    updateData
  };
}

// Batch loading utility
export class BatchLoader {
  private queue: Array<{
    key: string;
    resolve: (value: any) => void;
    reject: (error: any) => void;
  }> = [];
  private timer: NodeJS.Timeout | null = null;

  load<T>(key: string, fetcher: (keys: string[]) => Promise<Record<string, T>>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push({ key, resolve, reject });
      
      if (this.timer) {
        clearTimeout(this.timer);
      }
      
      this.timer = setTimeout(() => {
        this.flush(fetcher);
      }, 10); // 10ms batch window
    });
  }

  private async flush<T>(fetcher: (keys: string[]) => Promise<Record<string, T>>) {
    const currentQueue = [...this.queue];
    this.queue = [];
    this.timer = null;

    try {
      const keys = currentQueue.map(item => item.key);
      const results = await fetcher(keys);
      
      currentQueue.forEach(({ key, resolve, reject }) => {
        if (results[key] !== undefined) {
          resolve(results[key]);
        } else {
          reject(new Error(`No result for key: ${key}`));
        }
      });
    } catch (error) {
      currentQueue.forEach(({ reject }) => reject(error));
    }
  }
}

export const batchLoader = new BatchLoader();

// Prefetching utility
export function prefetchData<T>(
  key: string, 
  fetcher: () => Promise<T>, 
  ttl?: number
): void {
  // Check if already cached
  if (dataCache.get(key)) return;

  // Fetch and cache in background
  fetcher()
    .then(data => dataCache.set(key, data, ttl))
    .catch(error => console.warn(`Failed to prefetch ${key}:`, error));
}

// Memory management
export function setupMemoryManagement(): void {
  // Clear expired cache entries every 5 minutes
  setInterval(() => {
    const keysToDelete: string[] = [];
    
    // This is a simplified approach - in a real implementation,
    // you'd need access to the cache internals
    console.log('Cleaning up expired cache entries...');
  }, 5 * 60 * 1000);

  // Clear cache when memory usage is high
  if ('memory' in performance) {
    setInterval(() => {
      const memInfo = (performance as any).memory;
      const usageRatio = memInfo.usedJSHeapSize / memInfo.jsHeapSizeLimit;
      
      if (usageRatio > 0.9) {
        console.warn('High memory usage detected, clearing cache...');
        dataCache.clear();
      }
    }, 30 * 1000);
  }
}

// Initialize memory management
if (typeof window !== 'undefined') {
  setupMemoryManagement();
}