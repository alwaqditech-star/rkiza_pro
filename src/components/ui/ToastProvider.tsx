"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  IconAlertTriangle,
  IconCheck,
  IconInfoCircle,
  IconX,
} from "@tabler/icons-react";

type ToastVariant = "success" | "error" | "info" | "warning";

interface ToastItem {
  id: number;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
  warning: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const TOAST_DURATION_MS = 4200;
const MAX_TOASTS = 5;
let nextToastId = 0;

const ICONS: Record<ToastVariant, typeof IconCheck> = {
  success: IconCheck,
  error: IconX,
  info: IconInfoCircle,
  warning: IconAlertTriangle,
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback(
    (message: string, variant: ToastVariant) => {
      const text = message.trim();
      if (!text) return;

      const id = ++nextToastId;
      setToasts((prev) => [...prev.slice(-(MAX_TOASTS - 1)), { id, message: text, variant }]);
      window.setTimeout(() => dismiss(id), TOAST_DURATION_MS);
    },
    [dismiss],
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      success: (message) => push(message, "success"),
      error: (message) => push(message, "error"),
      info: (message) => push(message, "info"),
      warning: (message) => push(message, "warning"),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-stack" aria-live="polite" aria-atomic="false">
        {toasts.map((toast) => {
          const Icon = ICONS[toast.variant];
          return (
            <div
              key={toast.id}
              className={`toast toast-${toast.variant}`}
              role="status"
            >
              <span className="toast-icon" aria-hidden="true">
                <Icon size={18} stroke={2} />
              </span>
              <span className="toast-message">{toast.message}</span>
              <button
                type="button"
                className="toast-close"
                onClick={() => dismiss(toast.id)}
                aria-label="إغلاق"
              >
                <IconX size={14} stroke={2} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}
