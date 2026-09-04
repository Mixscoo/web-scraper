import { processSingleton } from "./singleton";

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class MemoryCache {
  private store = new Map<string, CacheEntry<unknown>>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes

  get<T>(key: string): { data: T; cachedAt: string } | null {
    const entry = this.store.get(key) as CacheEntry<T> | undefined;
    if (!entry) return null;
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.store.delete(key);
      return null;
    }
    return {
      data: entry.data,
      cachedAt: new Date(entry.timestamp).toISOString(),
    };
  }

  set<T>(key: string, data: T, ttl?: number): void {
    // Limit cache size to prevent memory leaks
    if (this.store.size > 500) {
      const oldest = this.store.keys().next().value;
      if (oldest) this.store.delete(oldest);
    }
    this.store.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl ?? this.defaultTTL,
    });
  }

  generateKey(...parts: string[]): string {
    return parts.map((p) => p.toLowerCase().trim()).join(":");
  }

  clear(): void {
    this.store.clear();
  }
}

export const cache = processSingleton("cache", () => new MemoryCache());
