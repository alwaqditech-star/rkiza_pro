"use client";
import { apiFetch } from "@/lib/api-client";
import { resolveMediaUrl } from "@/lib/media-url";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  IconCamera,
  IconDeviceFloppy,
  IconUserCircle,
} from "@tabler/icons-react";
import { AppPage, PageHero } from "@/components/ui/PageHero";
import { useToast } from "@/components/ui/ToastProvider";

interface AdminProfile {
  id: number;
  username: string;
  name: string;
  avatar_url: string | null;
}

export default function AdminProfilePage() {
  const toast = useToast();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function loadProfile() {
      setLoading(true);
      try {
        const res = await apiFetch("/api/admin/profile");
        const json = await res.json();
        if (!json.success) {
          setError(json.message || "فشل تحميل الملف الشخصي");
          return;
        }
        setProfile(json.data);
        setUsername(json.data.username);
        setAvatarPreview(resolveMediaUrl(json.data.avatar_url));
      } catch {
        setError("خطأ في الاتصال بالخادم");
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

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

    if (!username.trim()) {
      setError("اسم المستخدم مطلوب");
      return;
    }
    if (password && password.length < 6) {
      setError("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
      return;
    }
    if (password && password !== confirmPassword) {
      setError("كلمتا المرور غير متطابقتين");
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("username", username.trim());
      if (password) {
        formData.append("password", password);
        formData.append("confirm_password", confirmPassword);
      }
      if (avatarFile) {
        formData.append("avatar", avatarFile);
      }

      const res = await apiFetch("/api/admin/profile", {
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
      setPassword("");
      setConfirmPassword("");
      setAvatarFile(null);
      if (json.data?.avatar_url) {
        setAvatarPreview(resolveMediaUrl(json.data.avatar_url));
      }
      router.refresh();
    } catch {
      setError("خطأ في الاتصال بالخادم");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <AppPage>
        <div className="card">
          <div className="tbl-empty">جاري تحميل الملف الشخصي...</div>
        </div>
      </AppPage>
    );
  }

  return (
    <AppPage>
      {error ? <div className="page-alert error">{error}</div> : null}
      {success ? <div className="page-alert success">{success}</div> : null}

      <PageHero
        kicker="حساب المدير"
        title="الملف الشخصي"
        description="تحديث اسم المستخدم وكلمة المرور وصورة الحساب"
      />

      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="profile-avatar-wrap">
            <div className="profile-avatar">
              {avatarPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarPreview} alt="صورة المدير" />
              ) : (
                (profile?.name || profile?.username || "م").charAt(0)
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
            <div className="profile-avatar-hint">
              JPG أو PNG — حتى 2 ميجابايت
            </div>
          </div>

          <div className="form-grid">
            <div className="form-group form-full">
              <label htmlFor="admin-name">الاسم المعروض</label>
              <input
                id="admin-name"
                type="text"
                value={profile?.name ?? ""}
                readOnly
                style={{ background: "var(--fog)" }}
              />
            </div>
            <div className="form-group form-full">
              <label htmlFor="admin-username">اسم المستخدم</label>
              <input
                id="admin-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                dir="ltr"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="admin-password">كلمة المرور الجديدة</label>
              <input
                id="admin-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="اتركه فارغاً إذا لا تريد التغيير"
                dir="ltr"
              />
            </div>
            <div className="form-group">
              <label htmlFor="admin-confirm">تأكيد كلمة المرور</label>
              <input
                id="admin-confirm"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="أعد كتابة كلمة المرور"
                dir="ltr"
              />
            </div>
          </div>

          <div style={{ marginTop: 18, display: "flex", gap: 8 }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              <IconDeviceFloppy size={16} stroke={1.8} />
              {saving ? "جاري الحفظ..." : "حفظ التعديلات"}
            </button>
          </div>
        </form>
      </div>
    </AppPage>
  );
}
