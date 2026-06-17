interface CacheEntry<T = unknown> {
  data: T;
  expiresAt: number;
}

export const CACHE_TTL = {
  static: 5 * 60_000,
  default: 60_000,
  report: 2 * 60_000,
  dashboard: 30_000,
} as const;

const store = new Map<string, CacheEntry>();
const inflight = new Map<string, Promise<unknown>>();

export function buildCacheKey(
  path: string,
  params?: Record<string, string | undefined>,
): string {
  if (!params) return path;
  const entries = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== "")
    .sort(([a], [b]) => a.localeCompare(b));
  if (entries.length === 0) return path;
  const qs = entries.map(([key, value]) => `${key}=${value}`).join("&");
  return `${path}?${qs}`;
}

export function getFreshFromCache<T>(key: string): T | null {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }
  return entry.data as T;
}

export function getStaleFromCache<T>(key: string): T | null {
  const entry = store.get(key);
  return entry ? (entry.data as T) : null;
}

export function setCacheEntry<T>(key: string, data: T, ttlMs: number): void {
  store.set(key, { data, expiresAt: Date.now() + ttlMs });
}

export function invalidateCache(pattern?: string): void {
  if (!pattern) {
    store.clear();
    return;
  }

  for (const key of store.keys()) {
    if (key.includes(pattern)) {
      store.delete(key);
    }
  }
}

export function invalidateCacheForMutation(path: string): void {
  const normalized = path.split("?")[0];

  if (normalized.includes("/coa")) {
    invalidateCache("/api/client/coa");
  }
  if (normalized.includes("/journals")) {
    invalidateCache("/api/client/journal");
  }
  if (normalized.includes("/vouchers")) {
    invalidateCache("/api/client/voucher");
  }
  if (normalized.includes("/employees")) {
    invalidateCache("/api/client/employees");
  }
  if (normalized.includes("/banks")) {
    invalidateCache("/api/client/banks");
  }
  if (normalized.includes("/payroll")) {
    invalidateCache("/api/client/payroll");
  }
  if (normalized.includes("/fiscal")) {
    invalidateCache("/api/client/fiscal");
  }
  if (normalized.includes("/indicators")) {
    invalidateCache("/api/client/indicators");
  }
  if (normalized.includes("/org-settings")) {
    invalidateCache("/api/client/org-settings");
  }
  if (normalized.includes("/users")) {
    invalidateCache("/api/client/users");
  }
  if (
    normalized.includes("/ledger") ||
    normalized.includes("/statement") ||
    normalized.includes("/trial")
  ) {
    invalidateCache(normalized.includes("/trial") ? "/api/client/trial" : "/api/client/");
  }
  invalidateCache("/api/client/dashboard");
}

export async function fetchWithCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options?: { ttl?: number; force?: boolean },
): Promise<T> {
  if (!options?.force) {
    const cached = getFreshFromCache<T>(key);
    if (cached !== null) return cached;
  }

  const pending = inflight.get(key);
  if (pending) return pending as Promise<T>;

  const promise = fetcher()
    .then((data) => {
      setCacheEntry(key, data, options?.ttl ?? CACHE_TTL.default);
      return data;
    })
    .finally(() => {
      inflight.delete(key);
    });

  inflight.set(key, promise);
  return promise;
}
