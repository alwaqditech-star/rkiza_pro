"use client";

import { FormEvent, useState } from "react";
import { IconScale } from "@tabler/icons-react";
import { apiFetch } from "@/lib/api-client";
import { syncSessionCookie } from "@/lib/session-bridge";

export function LoginScreen() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await apiFetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim(),
        }),
      });

      let json: {
        success?: boolean;
        message?: string;
        token?: string;
        data?: { role?: string; is_first_login?: boolean };
      };
      try {
        json = await res.json();
      } catch {
        setError(
          res.status === 404
            ? "خادم API غير متاح — تحقق من نشر rkiza-api على Vercel"
            : `خطأ في الاتصال بالخادم (${res.status})`,
        );
        return;
      }

      if (!res.ok || !json.success) {
        setError(json.message || "بيانات الدخول غير صحيحة");
        return;
      }

      if (!json.token) {
        setError("استجابة غير صالحة من الخادم");
        return;
      }

      await syncSessionCookie(json.token);

      const data = json.data;
      if (!data) {
        setError("استجابة غير صالحة من الخادم");
        return;
      }

      let target = "/client";
      if (data.role === "admin") {
        target = "/admin";
      } else if (data.is_first_login) {
        target = "/client/first-login";
      }

      window.location.assign(target);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "خطأ في الاتصال بالخادم";
      setError(message || "خطأ في الاتصال بالخادم");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div id="login-screen" className="show">
      <div className="login-box">
        <div className="login-logo">
          <div className="login-logo-icon">
            <IconScale size={28} stroke={1.8} />
          </div>
          <h1>ركاز</h1>
          <p>نظام المحاسبة للقطاع غير الربحي</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="login-field">
            <label htmlFor="username">اسم المستخدم</label>
            <input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              placeholder="مثال: admin أو rikaz_admin"
              dir="ltr"
              required
            />
          </div>
          <div className="login-field">
            <label htmlFor="password">كلمة المرور</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              placeholder="كلمة المرور الأصلية — وليس password_hash"
              dir="ltr"
              required
            />
          </div>
          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? "جاري الدخول..." : "تسجيل الدخول"}
          </button>
          {error ? (
            <div className="login-error" style={{ display: "block" }}>
              {error}
            </div>
          ) : null}
        </form>
      </div>
    </div>
  );
}
