"use client";

import { useEffect } from "react";
import { prefetchApiGet } from "@/lib/api-get";

/** يحمّل مسبقاً البيانات الأكثر استخداماً بعد تسجيل الدخول */
export function DataPrefetcher() {
  useEffect(() => {
    prefetchApiGet("/api/client/coa", { ttl: "static" });
    prefetchApiGet("/api/client/journals/accounts", { ttl: "static" });
    prefetchApiGet("/api/client/dashboard", { ttl: "dashboard" });
  }, []);

  return null;
}
