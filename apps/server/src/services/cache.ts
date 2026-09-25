type CacheRecord = {
  expiresAt: number;
  value: Promise<unknown>;
};

const CACHE_MAX_ENTRIES = 500;
const CACHE_TTL_MS = 30_000;

class MemoryCache {
  private readonly records = new Map<string, CacheRecord>();

  constructor(
    private readonly ttlMs: number,
    private readonly maxEntries: number
  ) {}

  async getOrSet<T>(key: string, loader: () => Promise<T>): Promise<T> {
    const existing = this.records.get(key);
    if (existing) {
      if (existing.expiresAt > Date.now()) {
        this.records.delete(key);
        this.records.set(key, existing);
        return existing.value as Promise<T>;
      }
      this.records.delete(key);
    }

    const value = Promise.resolve().then(loader);
    void value.catch(() => {
      if (this.records.get(key)?.value === value) {
        this.records.delete(key);
      }
    });

    this.records.set(key, {
      expiresAt: Date.now() + this.ttlMs,
      value,
    });
    this.evictOverflow();

    return value;
  }

  delete(key: string): void {
    this.records.delete(key);
  }

  deleteByPrefix(prefix: string): void {
    for (const key of this.records.keys()) {
      if (key.startsWith(prefix)) {
        this.records.delete(key);
      }
    }
  }

  private evictOverflow(): void {
    while (this.records.size > this.maxEntries) {
      const oldestKey = this.records.keys().next().value;
      if (oldestKey === undefined) {
        return;
      }
      this.records.delete(oldestKey);
    }
  }
}

export const cacheKeys = {
  allSchemas: 'schemas:all',
  notes: (schemaId: string): string => `notes:${encodeURIComponent(schemaId)}:`,
  schema: (schemaId: string): string =>
    `schemas:id:${encodeURIComponent(schemaId)}`,
};

export const queryCache = new MemoryCache(CACHE_TTL_MS, CACHE_MAX_ENTRIES);
