"use client";
import { apiFetch, apiUrl } from "@/lib/api-client";

import { useCallback, useEffect, useState } from "react";
import {
  IconEdit,
  IconPlus,
  IconTrash,
  IconUserPlus,
  IconUsers,
  IconX,
} from "@tabler/icons-react";
import { notifyApiResult } from "@/lib/notify";
import { useToast } from "@/components/ui/ToastProvider";
import type { AssociationUserRole, AssociationUserStatus, AssociationUserView } from "@/lib/types";
import { AppPage, PageHero } from "@/components/ui/PageHero";

const emptyForm = {
  display_name: "",
  username: "",
  password: "",
  role: "accountant" as AssociationUserRole,
  status: "active" as AssociationUserStatus,
};

export function UsersClient() {
  const toast = useToast();
  const [users, setUsers] = useState<AssociationUserView[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState("");

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/api/client/users");
      const json = await res.json();
      if (json.success) setUsers(json.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  function openAdd() {
    setEditId(null);
    setForm(emptyForm);
    setMessage("");
    setModalOpen(true);
  }

  function openEdit(user: AssociationUserView) {
    if (user.is_primary || user.id === "primary") return;
    setEditId(Number(user.id));
    setForm({
      display_name: user.display_name,
      username: user.username,
      password: "",
      role: user.role,
      status: user.status === "active" ? "active" : "inactive",
    });
    setMessage("");
    setModalOpen(true);
  }

  async function handleSave() {
    const path = editId ? `/api/client/users/${editId}` : "/api/client/users";
    setMessage("");
    try {
      const res = await apiFetch(path, {
        method: editId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!json.success) {
        setMessage(json.message ?? "فشل الحفظ");
        toast.error(json.message ?? "فشل حفظ المستخدم");
        return;
      }
      setModalOpen(false);
      toast.success(json.message ?? (editId ? "تم تحديث المستخدم بنجاح" : "تم إضافة المستخدم بنجاح"));
      loadUsers();
    } catch {
      setMessage("خطأ في الاتصال بالخادم");
      toast.error("خطأ في الاتصال بالخادم");
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("هل تريد حذف هذا المستخدم؟")) return;
    const res = await apiFetch(`/api/client/users/${id}`, { method: "DELETE" });
    const json = await res.json();
    if (notifyApiResult(toast, json, { success: "تم حذف المستخدم بنجاح", error: "فشل الحذف" })) {
      loadUsers();
    }
  }

  return (
    <AppPage>
      <PageHero
        kicker="الصلاحيات"
        title="إدارة المستخدمين والصلاحيات"
        description="إضافة مستخدمين فرعيين وتحديد أدوارهم في النظام"
        stat={{ value: users.length, label: "مستخدم" }}
        actions={
          <button type="button" className="btn btn-primary btn-sm" onClick={openAdd}>
            <IconPlus size={14} />
            إضافة مستخدم
          </button>
        }
      />

      <div className="card">
        <div className="tbl-wrap">
          <table>
            <thead>
              <tr>
                <th>المستخدم</th>
                <th>اسم المستخدم</th>
                <th>الدور</th>
                <th>الصلاحيات</th>
                <th>الحالة</th>
                <th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6}>
                    <div className="tbl-empty">جاري التحميل...</div>
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={String(user.id)}>
                    <td style={{ fontWeight: 700 }}>{user.display_name}</td>
                    <td>{user.username}</td>
                    <td>{user.role_label}</td>
                    <td style={{ fontSize: 12, color: "var(--mist)" }}>{user.permissions}</td>
                    <td>
                      <span
                        className={`badge ${user.status === "active" ? "badge-emerald" : "badge-ruby"}`}
                      >
                        {user.status === "active" ? "نشط" : "غير نشط"}
                      </span>
                    </td>
                    <td>
                      {user.is_primary ? (
                        <span style={{ fontSize: 11, color: "var(--mist)" }}>حساب رئيسي</span>
                      ) : (
                        <>
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={() => openEdit(user)}
                          >
                            <IconEdit size={14} />
                          </button>
                          <button
                            type="button"
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDelete(Number(user.id))}
                          >
                            <IconTrash size={14} />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className={`modal-overlay${modalOpen ? " open" : ""}`}>
        <div className="modal">
          <div className="modal-head">
            <div className="modal-title">
              <IconUserPlus size={18} stroke={1.8} />
              {editId ? "تعديل مستخدم" : "إضافة مستخدم"}
            </div>
            <button type="button" className="modal-close" onClick={() => setModalOpen(false)}>
              <IconX size={16} />
            </button>
          </div>
          <div className="modal-body">
            {message ? <div style={{ color: "var(--ruby)", fontSize: 13, marginBottom: 12 }}>{message}</div> : null}
            <div className="form-grid">
              <div className="form-group form-full">
                <label>اسم المستخدم *</label>
                <input
                  value={form.display_name}
                  onChange={(e) => setForm({ ...form, display_name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>اسم الدخول *</label>
                <input
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>{editId ? "كلمة مرور جديدة (اختياري)" : "كلمة المرور *"}</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>الدور</label>
                <select
                  value={form.role}
                  onChange={(e) =>
                    setForm({ ...form, role: e.target.value as AssociationUserRole })
                  }
                >
                  <option value="admin">مدير النظام</option>
                  <option value="accountant">محاسب</option>
                  <option value="auditor">مراجع داخلي</option>
                </select>
              </div>
              <div className="form-group">
                <label>الحالة</label>
                <select
                  value={form.status}
                  onChange={(e) =>
                    setForm({ ...form, status: e.target.value as AssociationUserStatus })
                  }
                >
                  <option value="active">نشط</option>
                  <option value="inactive">غير نشط</option>
                </select>
              </div>
            </div>
          </div>
          <div className="modal-foot">
            <button type="button" className="btn btn-ghost" onClick={() => setModalOpen(false)}>
              إلغاء
            </button>
            <button type="button" className="btn btn-primary" onClick={handleSave}>
              حفظ
            </button>
          </div>
        </div>
      </div>
    </AppPage>
  );
}
