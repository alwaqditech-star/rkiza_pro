"use client";
import { apiFetch, apiUrl } from "@/lib/api-client";

import { useCallback, useEffect, useState } from "react";
import {
  IconDownload,
  IconEdit,
  IconFileTypePdf,
  IconPlus,
  IconRefresh,
  IconTrash,
  IconUserPlus,
} from "@tabler/icons-react";
import { AppPage, PageHero } from "@/components/ui/PageHero";

interface Association {
  id: number;
  association_name: string;
  username: string;
  subscription_start: string;
  subscription_end: string;
  status: "active" | "expired";
  days_remaining: number;
  subscription_alert: boolean;
}

interface CreatedCredentials {
  association_name: string;
  username: string;
  password: string;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("ar-SA");
}

export default function SubscribersPage() {
  const [associations, setAssociations] = useState<Association[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [associationName, setAssociationName] = useState("");
  const [creating, setCreating] = useState(false);
  const [credentials, setCredentials] = useState<CreatedCredentials | null>(null);
  const [renewingId, setRenewingId] = useState<number | null>(null);
  const [editing, setEditing] = useState<Association | null>(null);
  const [editUsername, setEditUsername] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editConfirmPassword, setEditConfirmPassword] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiFetch("/api/admin/associations");
      const json = await res.json();
      if (!json.success) {
        setError(json.message || "فشل تحميل البيانات");
        return;
      }
      setAssociations(json.data);
    } catch {
      setError("خطأ في الاتصال بالخادم");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!associationName.trim()) return;

    setCreating(true);
    setError("");
    setSuccess("");
    setCredentials(null);

    try {
      const res = await apiFetch("/api/admin/associations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ association_name: associationName.trim() }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.message || "فشل إنشاء الجمعية");
        return;
      }
      setCredentials({
        association_name: json.data.association_name,
        username: json.data.username,
        password: json.data.password,
      });
      setAssociationName("");
      setSuccess("تم إنشاء حساب الجمعية بنجاح");
      await loadData();
    } catch {
      setError("خطأ في الاتصال بالخادم");
    } finally {
      setCreating(false);
    }
  }

  async function handleRenew(id: number) {
    setRenewingId(id);
    setError("");
    setSuccess("");
    try {
      const res = await apiFetch(`/api/admin/associations/${id}/renew`, {
        method: "POST",
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.message || "فشل تجديد الاشتراك");
        return;
      }
      setSuccess(json.message);
      await loadData();
    } catch {
      setError("خطأ في الاتصال بالخادم");
    } finally {
      setRenewingId(null);
    }
  }

  function openEditModal(assoc: Association) {
    setEditing(assoc);
    setEditUsername(assoc.username);
    setEditPassword("");
    setEditConfirmPassword("");
    setError("");
  }

  function closeEditModal() {
    setEditing(null);
    setEditUsername("");
    setEditPassword("");
    setEditConfirmPassword("");
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;

    const trimmedUsername = editUsername.trim();
    if (!trimmedUsername) {
      setError("اسم المستخدم مطلوب");
      return;
    }

    if (editPassword && editPassword.length < 6) {
      setError("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
      return;
    }

    if (editPassword && editPassword !== editConfirmPassword) {
      setError("كلمتا المرور غير متطابقتين");
      return;
    }

    setSavingEdit(true);
    setError("");
    setSuccess("");

    try {
      const payload: { username: string; password?: string } = {
        username: trimmedUsername,
      };
      if (editPassword) {
        payload.password = editPassword;
      }

      const res = await apiFetch(`/api/admin/associations/${editing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.message || "فشل تحديث البيانات");
        return;
      }
      setSuccess(json.message || "تم تحديث بيانات الجمعية بنجاح");
      closeEditModal();
      await loadData();
    } catch {
      setError("خطأ في الاتصال بالخادم");
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleDelete(id: number, name: string) {
    if (!confirm(`هل تريد حذف الجمعية "${name}"؟`)) return;

    setError("");
    setSuccess("");
    try {
      const res = await apiFetch(`/api/admin/associations/${id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.message || "فشل حذف الجمعية");
        return;
      }
      setSuccess(json.message);
      await loadData();
    } catch {
      setError("خطأ في الاتصال بالخادم");
    }
  }

  async function handleExportPdf() {
    setExportingPdf(true);
    setError("");
    setSuccess("");
    try {
      const res = await apiFetch("/api/admin/associations/export-pdf");
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        setError(json?.message || json?.error || "فشل تصدير PDF");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `kashf-almushtarikin-${new Date().toISOString().slice(0, 10)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      setSuccess("تم تصدير كشف المشتركين PDF بنجاح");
    } catch {
      setError("خطأ في تصدير PDF");
    } finally {
      setExportingPdf(false);
    }
  }

  async function handleExport() {
    try {
      const res = await apiFetch("/api/admin/reports?format=excel");
      if (!res.ok) {
        const json = await res.json();
        setError(json.message || "فشل تصدير التقرير");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "rikaz-admin-reports.xlsx";
      a.click();
      URL.revokeObjectURL(url);
      setSuccess("تم تصدير التقرير بنجاح");
    } catch {
      setError("خطأ في تصدير التقرير");
    }
  }

  return (
    <AppPage>
      <PageHero
        kicker="إدارة المشتركين"
        title="اشتراكات الجمعيات"
        description="إنشاء حسابات جمعيات جديدة ومتابعة الاشتراكات والتجديد"
        stat={{ value: associations.length, label: "جمعية مسجلة" }}
      />

      {error ? <div className="page-alert error">{error}</div> : null}
      {success ? <div className="page-alert success">{success}</div> : null}

      <div className="card">
        <div className="card-section-title">
          <IconUserPlus size={18} stroke={1.8} />
          إضافة جمعية جديدة
        </div>
        <form onSubmit={handleCreate}>
          <div className="form-grid">
            <div className="form-group form-full">
              <label>اسم الجمعية</label>
              <input
                type="text"
                value={associationName}
                onChange={(e) => setAssociationName(e.target.value)}
                placeholder="مثال: جمعية الخير التعاونية"
                required
              />
              <small style={{ fontSize: 11, color: "var(--mist)", marginTop: 4 }}>
                سيُستخدم نفس الاسم كاسم مستخدم للدخول
              </small>
            </div>
          </div>
          <div style={{ marginTop: 14, display: "flex", gap: 8 }}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={creating}
            >
              <IconPlus size={16} stroke={1.8} />
              {creating ? "جاري الإنشاء..." : "إنشاء حساب"}
            </button>
          </div>
        </form>

        {credentials && (
          <div className="credentials-box">
            <div style={{ fontWeight: 700, marginBottom: 8, color: "var(--teal-dark)" }}>
              بيانات الدخول — {credentials.association_name}
            </div>
            <div style={{ fontSize: 13, lineHeight: 1.8 }}>
              <div>
                اسم المستخدم:{" "}
                <strong style={{ direction: "ltr", display: "inline-block" }}>
                  {credentials.username}
                </strong>
              </div>
              <div>
                كلمة المرور:{" "}
                <strong style={{ direction: "ltr", display: "inline-block" }}>
                  {credentials.password}
                </strong>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-toolbar">
          <div className="card-section-title">
            <IconRefresh size={18} stroke={1.8} />
            قائمة المشتركين
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button type="button" className="btn btn-ghost btn-sm" onClick={loadData}>
              <IconRefresh size={16} stroke={1.8} />
              تحديث
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handleExportPdf}
              disabled={exportingPdf || loading}
            >
              <IconFileTypePdf size={16} stroke={1.8} />
              {exportingPdf ? "جاري التصدير..." : "تصدير PDF"}
            </button>
            <button type="button" className="btn btn-gold btn-sm" onClick={handleExport}>
              <IconDownload size={16} stroke={1.8} />
              تصدير Excel
            </button>
          </div>
        </div>

        <div className="tbl-wrap">
          <table>
            <thead>
              <tr>
                <th>الجمعية</th>
                <th>اسم المستخدم</th>
                <th>نهاية الاشتراك</th>
                <th>المتبقي</th>
                <th>الحالة</th>
                <th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="tbl-empty">
                    جاري التحميل...
                  </td>
                </tr>
              ) : associations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="tbl-empty">
                    لا توجد جمعيات
                  </td>
                </tr>
              ) : (
                associations.map((assoc) => (
                  <tr
                    key={assoc.id}
                    className={assoc.subscription_alert ? "row-alert" : ""}
                  >
                    <td style={{ fontWeight: 600 }}>{assoc.association_name}</td>
                    <td style={{ direction: "ltr", textAlign: "right" }}>
                      {assoc.username}
                    </td>
                    <td>{formatDate(assoc.subscription_end)}</td>
                    <td>
                      <span
                        className={`badge ${
                          assoc.subscription_alert ? "badge-ruby" : "badge-teal"
                        }`}
                      >
                        {assoc.days_remaining} يوم
                      </span>
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          assoc.status === "active"
                            ? "badge-emerald"
                            : "badge-ruby"
                        }`}
                      >
                        {assoc.status === "active" ? "نشط" : "منتهي"}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => openEditModal(assoc)}
                          title="تعديل اسم المستخدم وكلمة المرور"
                        >
                          <IconEdit size={14} stroke={1.8} />
                          تعديل
                        </button>
                        <button
                          type="button"
                          className="btn btn-success btn-sm"
                          disabled={renewingId === assoc.id}
                          onClick={() => handleRenew(assoc.id)}
                        >
                          <IconRefresh size={14} stroke={1.8} />
                          {renewingId === assoc.id ? "..." : "تجديد"}
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() =>
                            handleDelete(assoc.id, assoc.association_name)
                          }
                        >
                          <IconTrash size={14} stroke={1.8} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <div
          className="modal-overlay open"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeEditModal();
          }}
        >
          <div className="modal" style={{ maxWidth: 480 }}>
            <div className="modal-head">
              <div className="modal-title">
                <IconEdit size={18} stroke={1.8} />
                تعديل بيانات الدخول — {editing.association_name}
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={closeEditModal}
                aria-label="إغلاق"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSaveEdit}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group form-full">
                    <label htmlFor="edit-username">اسم المستخدم</label>
                    <input
                      id="edit-username"
                      type="text"
                      value={editUsername}
                      onChange={(e) => setEditUsername(e.target.value)}
                      dir="ltr"
                      required
                    />
                  </div>
                  <div className="form-group form-full">
                    <label htmlFor="edit-password">كلمة المرور الجديدة</label>
                    <input
                      id="edit-password"
                      type="password"
                      value={editPassword}
                      onChange={(e) => setEditPassword(e.target.value)}
                      placeholder="اتركه فارغاً إذا لا تريد التغيير"
                      dir="ltr"
                    />
                  </div>
                  <div className="form-group form-full">
                    <label htmlFor="edit-confirm">تأكيد كلمة المرور</label>
                    <input
                      id="edit-confirm"
                      type="password"
                      value={editConfirmPassword}
                      onChange={(e) => setEditConfirmPassword(e.target.value)}
                      placeholder="أعد كتابة كلمة المرور الجديدة"
                      dir="ltr"
                    />
                  </div>
                </div>
              </div>
              <div className="modal-foot">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={closeEditModal}
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={savingEdit}
                >
                  {savingEdit ? "جاري الحفظ..." : "حفظ التعديلات"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppPage>
  );
}
