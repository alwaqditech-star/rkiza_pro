"use client";
import { apiFetch } from "@/lib/api-client";
import { resolveMediaUrl } from "@/lib/media-url";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { IconCamera, IconUserCircle, IconX } from "@tabler/icons-react";
import type { ClientSession } from "@/lib/types";
import { useToast } from "@/components/ui/ToastProvider";
import { PASSWORD_MIN_LENGTH_MESSAGE, isPasswordLongEnough } from "@/lib/password-policy";

interface ClientProfileModalProps {
  open: boolean;
  session: ClientSession;
  onClose: () => void;
}

interface ProfileData {
  association_name: string;
  username: string;
  avatar_url: string | null;
}

export function ClientProfileModal({
  open,
  session,
  onClose,
}: ClientProfileModalProps) {
  const toast = useToast();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [associationName, setAssociationName] = useState(session.association_name);
  const [username, setUsername] = useState(session.username);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    resolveMediaUrl(session.avatar_url),
  );
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const isSubUser = Boolean(session.is_sub_user);

  useEffect(() => {
    if (!open) return;

    setError("");
    setSuccess("");
    setPassword("");
    setConfirmPassword("");
    setAvatarFile(null);
    setLoading(true);

    apiFetch("/api/client/profile")
      .then((res) => res.json())
      .then((json: { success: boolean; data?: ProfileData; message?: string }) => {
        if (!json.success || !json.data) {
          setError(json.message || "فشل تحميل البيانات");
          return;
        }
        setAssociationName(json.data.association_name);
        setUsername(json.data.username);
        setAvatarPreview(resolveMediaUrl(json.data.avatar_url));
      })
      .catch(() => setError("خطأ في الاتصال بالخادم"))
      .finally(() => setLoading(false));
  }, [open, session.association_name, session.username]);

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!associationName.trim()) {
      setError("اسم الجمعية مطلوب");
      return;
    }
    if (!username.trim()) {
      setError("اسم المستخدم مطلوب");
      return;
    }
    if (password && !isPasswordLongEnough(password)) {
      setError(PASSWORD_MIN_LENGTH_MESSAGE);
      return;
    }
    if (password && password !== confirmPassword) {
      setError("كلمتا المرور غير متطابقتين");
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("association_name", associationName.trim());
      formData.append("username", username.trim());
      if (password) {
        formData.append("password", password);
        formData.append("confirm_password", confirmPassword);
      }
      if (avatarFile) {
        formData.append("avatar", avatarFile);
      }

      const res = await apiFetch("/api/client/profile", {
        method: "PUT",
        body: formData,
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.message || "فشل حفظ التعديلات");
        toast.error(json.message || "فشل حفظ التعديلات");
        return;
      }

      toast.success(json.message || "تم تحديث الملف الشخصي بنجاح");
      if (json.data?.avatar_url) {
        setAvatarPreview(resolveMediaUrl(json.data.avatar_url));
      }
      setAvatarFile(null);
      setPassword("");
      setConfirmPassword("");
      router.refresh();
      setTimeout(() => onClose(), 800);
    } catch {
      setError("خطأ في الاتصال بالخادم");
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div
      className="modal-overlay open"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal" style={{ maxWidth: 520 }}>
        <div className="modal-head">
          <div className="modal-title">
            <IconUserCircle size={18} stroke={1.8} />
            الملف الشخصي — {session.association_name}
          </div>
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="إغلاق"
          >
            <IconX size={18} />
          </button>
        </div>

        {loading ? (
          <div className="modal-body">
            <div className="tbl-empty">جاري التحميل...</div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              {error && (
                <div
                  className="login-error"
                  style={{ display: "block", marginBottom: 12 }}
                >
                  {error}
                </div>
              )}
              {success && (
                <div
                  style={{
                    background: "var(--emerald-pale)",
                    color: "var(--emerald)",
                    padding: "10px 14px",
                    borderRadius: "var(--radius-sm)",
                    marginBottom: 12,
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  {success}
                </div>
              )}

              {isSubUser ? (
                <div style={{ padding: "8px 0 16px", fontSize: 13, color: "var(--slate)", lineHeight: 1.7 }}>
                  <div style={{ fontWeight: 700, marginBottom: 8 }}>
                    {session.display_name || session.username}
                  </div>
                  <div>الجمعية: {session.association_name}</div>
                  <div style={{ marginTop: 12, color: "var(--mist)" }}>
                    تعديل بيانات الجمعية متاح لمدير الجمعية فقط.
                  </div>
                </div>
              ) : (
                <>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  marginBottom: 20,
                  gap: 10,
                }}
              >
                <div
                  style={{
                    width: 100,
                    height: 100,
                    borderRadius: "50%",
                    overflow: "hidden",
                    border: "3px solid var(--silver)",
                    background: "var(--teal-pale)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 36,
                    fontWeight: 700,
                    color: "var(--teal-dark)",
                  }}
                >
                  {avatarPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={avatarPreview}
                      alt="صورة الجمعية"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    associationName.charAt(0) || username.charAt(0) || "ج"
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  style={{ display: "none" }}
                  onChange={handleAvatarChange}
                />
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <IconCamera size={16} stroke={1.8} />
                  {avatarPreview ? "تغيير الصورة" : "إضافة صورة"}
                </button>
              </div>

              <div className="form-grid">
                <div className="form-group form-full">
                  <label htmlFor="client-assoc-name">اسم الجمعية</label>
                  <input
                    id="client-assoc-name"
                    type="text"
                    value={associationName}
                    onChange={(e) => setAssociationName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group form-full">
                  <label htmlFor="client-username">اسم المستخدم</label>
                  <input
                    id="client-username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    dir="ltr"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="client-password">كلمة المرور الجديدة</label>
                  <input
                    id="client-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="اتركه فارغاً إذا لا تريد التغيير"
                    dir="ltr"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="client-confirm">تأكيد كلمة المرور</label>
                  <input
                    id="client-confirm"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="أعد كتابة كلمة المرور"
                    dir="ltr"
                  />
                </div>
              </div>
                </>
              )}
            </div>
            <div className="modal-foot">
              <button type="button" className="btn btn-ghost" onClick={onClose}>
                {isSubUser ? "إغلاق" : "إلغاء"}
              </button>
              {!isSubUser ? (
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? "جاري الحفظ..." : "حفظ التعديلات"}
                </button>
              ) : null}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
