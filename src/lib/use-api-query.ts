"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { buildCacheKey, getStaleFromCache } from "@/lib/api-cache";
import { apiGetJson, type ApiJsonResponse } from "@/lib/api-get";

interface UseApiQueryOptions {
  params?: Record<string, string | undefined>;
  ttl?: number | "static" | "default" | "report" | "dashboard";
  enabled?: boolean;
  keepPrevious?: boolean;
}

interface UseApiQueryResult<T> {
  data: T | null;
  loading: boolean;
  validating: boolean;
  error: string;
  refresh: () => Promise<void>;
}

function readCachedData<T>(
  path: string,
  params?: Record<string, string | undefined>,
): T | null {
  const key = buildCacheKey(path, params);
  const cached = getStaleFromCache<ApiJsonResponse<T>>(key);
  return cached?.success && cached.data !== undefined ? cached.data : null;
}

export function useApiQuery<T>(
  path: string | null,
  options: UseApiQueryOptions = {},
): UseApiQueryResult<T> {
  const enabled = options.enabled !== false && path !== null;
  const paramsKey = useMemo(
    () => JSON.stringify(options.params ?? {}),
    [options.params],
  );

  const [data, setData] = useState<T | null>(() =>
    path && enabled ? readCachedData<T>(path, options.params) : null,
  );
  const [loading, setLoading] = useState(enabled && data === null);
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  const load = useCallback(
    async (force = false) => {
      if (!path || !enabled) return;

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      const hasData = data !== null;
      if (!hasData) setLoading(true);
      else setValidating(true);

      try {
        const json = await apiGetJson<T>(path, {
          params: options.params,
          ttl: options.ttl,
          force: force,
          signal: controller.signal,
        });

        if (controller.signal.aborted) return;

        if (json.success && json.data !== undefined) {
          setData(json.data);
          setError("");
          return;
        }

        if (!options.keepPrevious || !hasData) {
          setData(null);
        }
        setError(json.message || "فشل تحميل البيانات");
      } catch {
        if (controller.signal.aborted) return;
        if (!options.keepPrevious || !hasData) {
          setData(null);
        }
        setError("خطأ في الاتصال بالخادم");
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
          setValidating(false);
        }
      }
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps -- data intentionally excluded to avoid refetch loops
    [path, enabled, paramsKey, options.ttl, options.keepPrevious],
  );

  useEffect(() => {
    if (!path || !enabled) {
      setLoading(false);
      return;
    }

    const cached = readCachedData<T>(path, options.params);
    if (cached !== null) {
      setData(cached);
      setLoading(false);
    }

    void load();
    return () => abortRef.current?.abort();
  }, [path, enabled, paramsKey, load]);

  const refresh = useCallback(async () => {
    await load(true);
  }, [load]);

  return { data, loading, error, validating, refresh };
}

interface UseLazyApiQueryResult<T> {
  data: T | null;
  loading: boolean;
  error: string;
  fetch: (
    path: string,
    params?: Record<string, string | undefined>,
    options?: { ttl?: number | "static" | "default" | "report" | "dashboard" },
  ) => Promise<T | null>;
  reset: () => void;
}

export function useLazyApiQuery<T>(): UseLazyApiQueryResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  const fetch = useCallback(
    async (
      path: string,
      params?: Record<string, string | undefined>,
      options?: { ttl?: number | "static" | "default" | "report" | "dashboard" },
    ) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      const key = buildCacheKey(path, params);
      const cached = readCachedData<T>(path, params);
      if (cached !== null) {
        setData(cached);
      }

      setLoading(true);
      setError("");

      try {
        const json = await apiGetJson<T>(path, {
          params,
          ttl: options?.ttl ?? "report",
          signal: controller.signal,
        });

        if (controller.signal.aborted) return cached;

        if (json.success && json.data !== undefined) {
          setData(json.data);
          return json.data;
        }

        if (cached === null) {
          setData(null);
        }
        setError(json.message || "فشل تحميل البيانات");
        return cached;
      } catch {
        if (controller.signal.aborted) return cached;
        if (cached === null) {
          setData(null);
        }
        setError("خطأ في الاتصال بالخادم");
        return cached;
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    },
    [],
  );

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setData(null);
    setLoading(false);
    setError("");
  }, []);

  useEffect(() => () => abortRef.current?.abort(), []);

  return { data, loading, error, fetch, reset };
}
