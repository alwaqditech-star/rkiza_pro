"use client";

import { useLayoutEffect } from "react";
import {
  hydrateApiTokenFromSession,
  storeApiToken,
} from "@/lib/session-bridge";

interface SessionHydratorProps {
  initialToken?: string;
}

export function SessionHydrator({ initialToken }: SessionHydratorProps) {
  useLayoutEffect(() => {
    if (initialToken) {
      storeApiToken(initialToken);
      return;
    }

    void hydrateApiTokenFromSession();
  }, [initialToken]);

  return null;
}
