"use client";
import { apiFetch } from "@/lib/api-client";
import { syncSessionCookie } from "@/lib/session-bridge";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { IconLock, IconScale } from "@tabler/icons-react";
import { PASSWORD_MIN_LENGTH_MESSAGE, isPasswordLongEnough } from "@/lib/password-policy";

export default function FirstLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (!isPasswordLongEnough(password)) {
      setError(PASSWORD_MIN_LENGTH_MESSAGE);
      return;
    }

    if (password !== confirm) {
      setError("كلمتا المرور غير متطابقتين");
      return;
    }

    setLoading(true);
    try {
      const res = await apiFetch("/api/auth/first-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ new_password: password }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.message || "فشل تحديث كلمة المرور");
        return;
      }
      if (json.token) {
        await syncSessionCookie(json.token);
      }
      router.push("/client");
      router.refresh();
    } catch {
      setError("خطأ في الاتصال بالخادم");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div id="login-screen" className="show">
      <div className="login-box">
        <div className="login-logo">
          <div className="login-logo-icon">
            <IconLock size={28} stroke={1.8} />
          </div>
          <h1>تغيير كلمة المرور</h1>
          <p>يجب تغيير كلمة المرور قبل الدخول إلى النظام</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="login-field">
            <label htmlFor="new-password">كلمة المرور الجديدة</label>
            <input
              id="new-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="login-field">
            <label htmlFor="confirm-password">تأكيد كلمة المرور</label>
            <input
              id="confirm-password"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? "جاري الحفظ..." : "حفظ والمتابعة"}
          </button>
          {error ? (
            <div className="login-error" style={{ display: "block" }}>
              {error}
            </div>
          ) : null}
        </form>

        <div className="login-users-hint">
          <IconScale size={14} style={{ display: "inline", marginLeft: 4 }} />
          ركاز — نظام المحاسبة للقطاع غير الربحي
        </div>
      </div>
    </div>
  );
}
