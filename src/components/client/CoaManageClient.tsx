"use client";
import { apiFetch, apiUrl } from "@/lib/api-client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { IconListTree, IconPlus, IconSearch, IconTrash, IconX } from "@tabler/icons-react";
import { notifyApiResult } from "@/lib/notify";
import { useToast } from "@/components/ui/ToastProvider";
import type { ChartOfAccount } from "@/lib/types";
import { AppPage, PageHero } from "@/components/ui/PageHero";

const GROUP_LABELS: Record<string, string> = {
  assets: "الأصول",
  liabilities: "الالتزامات",
  revenue: "الإيرادات",
  expenses: "المصروفات",
  other: "أخرى",
};

const emptyForm = {
  account_code: "",
  account_name: "",
  account_type: "assets",
  allow_payment: "No" as "Yes" | "No",
};

export function CoaManageClient() {
  const toast = useToast();
  const [accounts, setAccounts] = useState<ChartOfAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState("");

  const loadAccounts = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const res = await apiFetch("/api/client/coa");
      const json = await res.json();
      if (json.success) {
        setAccounts(json.data);
      } else {
        setLoadError(json.message ?? "تعذّر تحميل الدليل المحاسبي");
        setAccounts([]);
      }
    } catch {
      setLoadError("تعذّر الاتصال بالخادم");
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return accounts;
    return accounts.filter(
      (acc) =>
        acc.account_name.toLowerCase().includes(q) ||
        acc.account_code.includes(q),
    );
  }, [accounts, search]);

  async function handleSave() {
    const accountCode = form.account_code.trim();
    const accountName = form.account_name.trim();
    if (!accountCode || !accountName) {
      setMessage("رمز الحساب واسم الحساب مطلوبان");
      return;
    }

    setMessage("");
    try {
      const res = await apiFetch("/api/client/coa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          account_code: accountCode,
          account_name: accountName,
          account_type: form.account_type,
          parent_code: accountCode.slice(0, -1) || null,
          allow_payment: form.allow_payment,
        }),
      });
      const json = await res.json();
      if (!json.success) {
        setMessage(json.message ?? "فشل الإضافة");
        toast.error(json.message ?? "فشل إضافة الحساب");
        return;
      }

      setModalOpen(false);
      setForm(emptyForm);
      setSearch(accountCode);
      toast.success(json.message ?? "تمت إضافة الحساب بنجاح");
      await loadAccounts();
    } catch {
      toast.error("خطأ في الاتصال بالخادم");
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("هل تريد حذف هذا الحساب؟")) return;
    const res = await apiFetch(`/api/client/coa/${id}`, { method: "DELETE" });
    const json = await res.json();
    if (notifyApiResult(toast, json, { success: "تم حذف الحساب بنجاح", error: "فشل الحذف" })) {
      await loadAccounts();
    }
  }

  return (
    <AppPage>
      <PageHero
        kicker="الدليل المحاسبي"
        title="إدارة الدليل المحاسبي"
        description="إضافة وتعديل وحذف حسابات الدليل المحاسبي للجمعية"
        stat={{ value: accounts.length, label: "حساب" }}
        actions={
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => {
              setMessage("");
              setForm(emptyForm);
              setModalOpen(true);
            }}
          >
            <IconPlus size={14} />
            إضافة حساب
          </button>
        }
      />

      <div className="card">
        {loadError ? (
          <div className="tbl-empty" style={{ color: "var(--ruby)" }}>
            {loadError}
          </div>
        ) : null}

        <div className="coa-toolbar">
          <div className="coa-search-wrap">
            <IconSearch size={16} stroke={1.8} className="coa-search-icon" />
            <input
              className="coa-search-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث في الحسابات..."
            />
          </div>
          {!loading && accounts.length > 0 ? (
            <span className="coa-count-chip">{filtered.length} حساب</span>
          ) : null}
        </div>

        <div className="tbl-wrap">
          <table>
            <thead>
              <tr>
                <th>رمز الحساب</th>
                <th>اسم الحساب</th>
                <th>المجموعة</th>
                <th>النوع</th>
                <th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5}>
                    <div className="tbl-empty">جاري التحميل...</div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <div className="tbl-empty">لا توجد حسابات</div>
                  </td>
                </tr>
              ) : (
                filtered.map((acc) => {
                  const isCustom = Boolean(acc.is_custom);
                  return (
                    <tr key={acc.id}>
                      <td style={{ fontFamily: "monospace", fontSize: 12, color: "var(--mist)" }}>
                        {acc.account_code}
                      </td>
                      <td style={{ fontWeight: 600 }}>{acc.account_name}</td>
                      <td>
                        <span className="badge badge-slate" style={{ fontSize: 10 }}>
                          {GROUP_LABELS[acc.account_type] ?? acc.account_type}
                        </span>
                      </td>
                      <td>
                        {isCustom ? (
                          <span className="badge badge-gold" style={{ fontSize: 10 }}>
                            مخصص
                          </span>
                        ) : (
                          <span className="badge badge-teal" style={{ fontSize: 10 }}>
                            أصلي
                          </span>
                        )}
                      </td>
                      <td>
                        {isCustom ? (
                          <button
                            type="button"
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDelete(acc.id)}
                          >
                            <IconTrash size={14} />
                          </button>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className={`modal-overlay${modalOpen ? " open" : ""}`}>
        <div className="modal" style={{ maxWidth: 500 }}>
          <div className="modal-head">
            <div className="modal-title">
              <IconPlus size={18} stroke={1.8} />
              إضافة حساب جديد
            </div>
            <button type="button" className="modal-close" onClick={() => setModalOpen(false)}>
              <IconX size={16} />
            </button>
          </div>
          <div className="modal-body">
            {message ? <div style={{ color: "var(--ruby)", fontSize: 13, marginBottom: 12 }}>{message}</div> : null}
            <div className="form-grid">
              <div className="form-group">
                <label>رمز الحساب *</label>
                <input
                  value={form.account_code}
                  onChange={(e) => setForm({ ...form, account_code: e.target.value })}
                  placeholder="مثال: 11101006"
                />
              </div>
              <div className="form-group">
                <label>التصنيف الرئيسي</label>
                <select
                  value={form.account_type}
                  onChange={(e) => setForm({ ...form, account_type: e.target.value })}
                >
                  <option value="assets">1 - الأصول</option>
                  <option value="liabilities">2 - الالتزامات</option>
                  <option value="revenue">3 - الإيرادات</option>
                  <option value="expenses">4 - المصروفات</option>
                </select>
              </div>
              <div className="form-group form-full">
                <label>اسم الحساب (عربي) *</label>
                <input
                  value={form.account_name}
                  onChange={(e) => setForm({ ...form, account_name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>يظهر في سندات الصرف</label>
                <select
                  value={form.allow_payment}
                  onChange={(e) =>
                    setForm({ ...form, allow_payment: e.target.value as "Yes" | "No" })
                  }
                >
                  <option value="No">لا</option>
                  <option value="Yes">نعم</option>
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
