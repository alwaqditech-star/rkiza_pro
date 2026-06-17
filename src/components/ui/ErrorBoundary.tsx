"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { IconAlertTriangle } from "@tabler/icons-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("UI error:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="card" style={{ margin: 24, textAlign: "center", padding: 32 }}>
          <IconAlertTriangle size={40} stroke={1.5} style={{ color: "var(--ruby)", marginBottom: 12 }} />
          <h2 style={{ fontSize: 18, marginBottom: 8 }}>حدث خطأ غير متوقع</h2>
          <p style={{ color: "var(--mist)", fontSize: 13, marginBottom: 16 }}>
            أعد تحميل الصفحة. إذا استمرت المشكلة تواصل مع الدعم الفني.
          </p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => window.location.reload()}
          >
            إعادة التحميل
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
