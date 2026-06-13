"use client";

import { useEffect } from "react";
import { fetchAndApplyTheme } from "@/lib/theme";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    void fetchAndApplyTheme();
  }, []);

  return children;
}
