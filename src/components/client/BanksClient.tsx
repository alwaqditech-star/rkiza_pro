"use client";
import { apiFetch, apiUrl } from "@/lib/api-client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  IconBuildingBank,
  IconEdit,
  IconInbox,
  IconPlus,
  IconTrash,
  IconX,
} from "@tabler/icons-react";
import { fmtAmt } from "@/lib/format";
import type { BankAccount, BankAccountStatus } from "@/lib/types";

const BANKS = [
  "بنك الراجحي",
  "البنك الأهلي السعودي",
  "بنك الرياض",
  "بنك الإنماء",
  "بنك البلاد",
  "بنك الجزيرة",
  "البنك السعودي الفرنسي",
  "بنك ساب",
  "بنك آخر",
];

const COA_OPTIONS = [
  { code: "11101001", label: "11101001 - حسابات جارية - الراجحي وقف" },
  { code: "11101002", label: "11101002 - حسابات جارية - بنك الراجحي العام" },
  { code: "11101003", label: "11101003 - حسابات جارية - بنك الراجحي قروض" },
  { code: "11101004", label: "11101004 - حسابات جارية - بنك الإنماء" },
  { code: "11101005", label: "11101005 - حسابات جارية - بنك البلاد" },
];

const emptyForm = {
  description: "",
  bank_name: BANKS[0],
  account_number: "",
  iban: "",
  account_owner: "",
  account_code: "11101001",
  opening_balance: "",
  status: "active" as BankAccountStatus,
};

export function BanksClient() {
  const [items, setItems] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState("");

  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/api/client/banks");
      const json = await res.json();
      if (json.success) setItems(json.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  function openAdd() {
    setEditId(null);
    setForm(emptyForm);
    setMessage("");
    setModalOpen(true);
  }

  function openEdit(item: BankAccount) {
    setEditId(item.id);
    setForm({
      description: item.description,
      bank_name: item.bank_name,
      account_number: item.account_number,
      iban: item.iban,
      account_owner: item.account_owner ?? "",
      account_code: item.account_code,
      opening_balance: String(item.opening_balance),
      status: item.status,
    });
    setMessage("");
    setModalOpen(true);
  }

  async function handleSave() {
    const payload = {
      ...form,
      opening_balance: Number(form.opening_balance || 0),
    };
    const url = editId ? `/api/client/banks/${editId}` : "/api/client/banks";
    const method = editId ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!json.success) {
      setMessage(json.message ?? "فشل الحفظ");
      return;
    }
    setModalOpen(false);
    loadItems();
  }

  async function handleDelete(id: number) {
    if (!confirm("هل تريد حذف هذا الحساب البنكي؟")) return;
    const res = await apiFetch(`/api/client/banks/${id}`, { method: "DELETE" });
    const json = await res.json();
    if (json.success) loadItems();
    else alert(json.message ?? "فشل الحذف");
  }

  const activeCount = useMemo(() => items.filter((item) => item.status === "active").length, [items]);

  return (
    <>
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <IconBuildingBank size={18} stroke={1.8} />
            إدارة الحسابات البنكية
          </div>
          <button type="button" className="btn btn-primary btn-sm" onClick={openAdd}>
            <IconPlus size={14} />
            إضافة حساب بنكي
          </button>
        </div>

        {loading ? (
          <div className="tbl-empty">جاري التحميل...</div>
        ) : items.length === 0 ? (
          <div className="tbl-empty">
            <IconInbox size={36} stroke={1.2} style={{ opacity: 0.4 }} />
            لا توجد حسابات بنكية مضافة
          </div>
        ) : (
          <div style={{ padding: 16, display: "grid", gap: 12 }}>
            <div style={{ fontSize: 12, color: "var(--mist)" }}>
              {activeCount} حساب نشط من أصل {items.length}
            </div>
            {items.map((item) => (
              <div
                key={item.id}
                style={{
                  border: "1px solid var(--silver)",
                  borderRadius: "var(--radius-md)",
                  padding: 14,
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, marginBottom: 4 }}>{item.description}</div>
                  <div style={{ fontSize: 13, color: "var(--mist)" }}>{item.bank_name}</div>
                  <div style={{ fontSize: 12, fontFamily: "monospace", marginTop: 6 }}>{item.iban}</div>
                  <div style={{ fontSize: 12, marginTop: 4 }}>
                    رصيد افتتاحي: {fmtAmt(item.opening_balance)} ر.س
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                  <span className={`badge ${item.status === "active" ? "badge-emerald" : "badge-ruby"}`}>
                    {item.status === "active" ? "نشط" : "غير نشط"}
                  </span>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => openEdit(item)}>
                    <IconEdit size={14} />
                  </button>
                  <button type="button" className="btn btn-danger btn-sm" onClick={() => handleDelete(item.id)}>
                    <IconTrash size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={`modal-overlay${modalOpen ? " open" : ""}`}>
        <div className="modal">
          <div className="modal-head">
            <div className="modal-title">
              <IconBuildingBank size={18} stroke={1.8} />
              {editId ? "تعديل حساب بنكي" : "إضافة حساب بنكي"}
            </div>
            <button type="button" className="modal-close" onClick={() => setModalOpen(false)}>
              <IconX size={16} />
            </button>
          </div>
          <div className="modal-body">
            {message ? <div style={{ color: "var(--ruby)", fontSize: 13, marginBottom: 12 }}>{message}</div> : null}
            <div className="form-grid">
              <div className="form-group form-full">
                <label>وصف الحساب *</label>
                <input
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="مثال: الحساب الجاري الرئيسي"
                />
              </div>
              <div className="form-group">
                <label>اسم البنك *</label>
                <select
                  value={form.bank_name}
                  onChange={(e) => setForm({ ...form, bank_name: e.target.value })}
                >
                  {BANKS.map((bank) => (
                    <option key={bank} value={bank}>
                      {bank}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>رقم الحساب *</label>
                <input
                  value={form.account_number}
                  onChange={(e) => setForm({ ...form, account_number: e.target.value })}
                />
              </div>
              <div className="form-group form-full">
                <label>رقم الآيبان (IBAN) *</label>
                <input
                  value={form.iban}
                  onChange={(e) => setForm({ ...form, iban: e.target.value })}
                  style={{ fontFamily: "monospace", letterSpacing: 1 }}
                />
              </div>
              <div className="form-group">
                <label>اسم صاحب الحساب</label>
                <input
                  value={form.account_owner}
                  onChange={(e) => setForm({ ...form, account_owner: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>رمز الحساب المحاسبي</label>
                <select
                  value={form.account_code}
                  onChange={(e) => setForm({ ...form, account_code: e.target.value })}
                >
                  {COA_OPTIONS.map((option) => (
                    <option key={option.code} value={option.code}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>الرصيد الافتتاحي (ر.س)</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.opening_balance}
                  onChange={(e) => setForm({ ...form, opening_balance: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>الحالة</label>
                <select
                  value={form.status}
                  onChange={(e) =>
                    setForm({ ...form, status: e.target.value as BankAccountStatus })
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
              حفظ الحساب
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
