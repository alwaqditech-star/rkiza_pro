"use client";

import { useEffect } from "react";
import { hydrateApiTokenFromSession } from "@/lib/session-bridge";

export function SessionHydrator() {
  useEffect(() => {
    void hydrateApiTokenFromSession();
  }, []);

  return null;
}
