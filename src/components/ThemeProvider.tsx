"use client";

import { useEffect } from "react";
import { fetchAndApplyTheme } from "@/lib/theme";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { ToastProvider } from "@/components/ui/ToastProvider";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    void fetchAndApplyTheme();
  }, []);

  return (
    <ErrorBoundary>
      <ToastProvider>{children}</ToastProvider>
    </ErrorBoundary>
  );
}
