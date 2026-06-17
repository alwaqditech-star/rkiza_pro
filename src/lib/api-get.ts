import { apiFetch } from "@/lib/api-client";
import {
  buildCacheKey,
  CACHE_TTL,
  fetchWithCache,
  type CACHE_TTL as CacheTtlMap,
} from "@/lib/api-cache";

export interface ApiJsonResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

type TtlPreset = keyof typeof CacheTtlMap;

function resolveTtl(ttl?: number | TtlPreset): number {
  if (typeof ttl === "number") return ttl;
  if (ttl) return CACHE_TTL[ttl];
  return CACHE_TTL.default;
}

function buildRequestPath(
  path: string,
  params?: Record<string, string | undefined>,
): string {
  if (!params) return path;
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") {
      search.set(key, value);
    }
  }
  const query = search.toString();
  return query ? `${path}?${query}` : path;
}

export async function apiGetJson<T>(
  path: string,
  options?: {
    params?: Record<string, string | undefined>;
    ttl?: number | TtlPreset;
    force?: boolean;
    signal?: AbortSignal;
    cache?: boolean;
  },
): Promise<ApiJsonResponse<T>> {
  const requestPath = buildRequestPath(path, options?.params);
  const useCache = options?.cache !== false;

  const fetcher = async () => {
    const res = await apiFetch(requestPath, { signal: options?.signal });
    return (await res.json()) as ApiJsonResponse<T>;
  };

  if (!useCache) {
    return fetcher();
  }

  const key = buildCacheKey(path, options?.params);
  return fetchWithCache(key, fetcher, {
    ttl: resolveTtl(options?.ttl),
    force: options?.force,
  });
}

export function prefetchApiGet<T>(
  path: string,
  options?: {
    params?: Record<string, string | undefined>;
    ttl?: number | TtlPreset;
  },
): void {
  void apiGetJson<T>(path, { ...options, cache: true });
}
