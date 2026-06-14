"use client";
import { apiFetch, apiUrl } from "@/lib/api-client";

import { Fragment, useCallback, useEffect, useState } from "react";
import {
  IconArrowDownCircle,
  IconArrowUpCircle,
  IconCheck,
  IconChevronDown,
  IconDownload,
  IconEye,
  IconFileTypePdf,
  IconInbox,
  IconPlus,
  IconPrinter,
  IconTrash,
  IconX,
} from "@tabler/icons-react";
import { arabicAmount, fmtAmt, fmtDate, isFutureDate, today } from "@/lib/format";
import { downloadExportFile } from "@/lib/client-download";
import type { VoucherType } from "@/lib/types";
import { useClientPermissions } from "./ClientPermissionsContext";
import { AppPage, PageHero } from "@/components/ui/PageHero";
import { DateInput } from "@/components/ui/DateInputs";

interface CoaOption {
  account_code: string;
  account_name: string;
}

interface JournalLine {
  account_code: string;
  debit_amount: number;
  credit_amount: number;
}

interface VoucherItem {
  id: number;
  voucher_number: string;
  voucher_date: string;
  beneficiary_name: string | null;
  total_amount: number;
  account_name?: string;
  meta: {
    purpose: string;
    method: string;
    ref: string;
    notes: string;
    account_code: string;
  };
  entries?: JournalLine[];
}

interface VouchersManagerProps {
  voucherType: VoucherType;
}

const RECEIPT_ACCOUNTS: CoaOption[] = [
  { account_code: "31101001", account_name: "الزكاة" },
  { account_code: "31102001", account_name: "تبرعات مقيدة نقدية - كفالات" },
  { account_code: "31102002", account_name: "تبرعات مقيدة - مساعدات" },
  { account_code: "31102003", account_name: "تبرعات مقيدة - برامج موسمية" },
  { account_code: "31105001", account_name: "المنح الحكومي - تأسيس" },
  { account_code: "31201001", account_name: "التبرع العام" },
  { account_code: "31201002", account_name: "الاستقطاعات الأوامر المستديمة" },
  { account_code: "31205001", account_name: "الاشتراكات" },
  { account_code: "31301001", account_name: "تبرعات نقدية أوقاف" },
  { account_code: "31303001", account_name: "ريع الأوقاف" },
];

const PAYMENT_ACCOUNTS: CoaOption[] = [
  { account_code: "42101001", account_name: "مصارف الزكاة الشرعية" },
  { account_code: "42102001", account_name: "برامج وأنشطة - كفالات" },
  { account_code: "42102002", account_name: "برامج وأنشطة - مساعدات" },
  { account_code: "42102004", account_name: "برامج وأنشطة - السلة الغذائية" },
  { account_code: "41101001", account_name: "الرواتب والأجور الأساسية" },
  { account_code: "41203001", account_name: "الكهرباء" },
  { account_code: "41203002", account_name: "المياه" },
  { account_code: "41203003", account_name: "الهاتف والإنترنت" },
  { account_code: "41203009", account_name: "الإيجارات" },
  { account_code: "41204001", account_name: "مصاريف التدريب والتأهيل" },
  { account_code: "44106", account_name: "جمع الأموال - دعاية وإعلان" },
];

export function VouchersManager({ voucherType }: VouchersManagerProps) {
  const { canWrite, canDelete } = useClientPermissions();
  const isReceipt = voucherType === "receipt";
  const [items, setItems] = useState<VoucherItem[]>([]);
  const [accounts, setAccounts] = useState<CoaOption[]>(
    isReceipt ? RECEIPT_ACCOUNTS : PAYMENT_ACCOUNTS,
  );
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewItem, setPreviewItem] = useState<VoucherItem | null>(null);
  const [openJournal, setOpenJournal] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [printingId, setPrintingId] = useState<number | null>(null);
  const [exportingExcel, setExportingExcel] = useState(false);
  const [exportingListPdf, setExportingListPdf] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    date: today(),
    beneficiary: "",
    amount: "",
    method: "نقداً",
    account_code: isReceipt ? "31101001" : "42101001",
    ref: "",
    purpose: "",
    notes: "",
  });

  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`/api/client/vouchers?type=${voucherType}`);
      const json = await res.json();
      if (json.success) setItems(json.data);
    } finally {
      setLoading(false);
    }
  }, [voucherType]);

  useEffect(() => {
    loadItems();
    apiFetch("/api/client/coa")
      .then((r) => r.json())
      .then((json) => {
        if (!json.success) return;
        const defaults = isReceipt ? RECEIPT_ACCOUNTS : PAYMENT_ACCOUNTS;
        const fromDb = (json.data as CoaOption[]).filter((acc) =>
          isReceipt
            ? acc.account_code.startsWith("3")
            : acc.account_code.startsWith("4") || acc.account_code.startsWith("41"),
        );
        if (fromDb.length) {
          setAccounts(
            fromDb.slice(0, 40).map((acc) => ({
              account_code: acc.account_code,
              account_name: acc.account_name,
            })),
          );
        } else {
          setAccounts(defaults);
        }
      })
      .catch(() => undefined);
  }, [isReceipt, loadItems]);

  const amountWords = form.amount ? arabicAmount(Number(form.amount)) : "";

  async function handleSave(print = false) {
    setError("");
    const amount = Number(form.amount);
    if (!form.beneficiary.trim() || !amount || !form.purpose.trim()) {
      setError("يرجى تعبئة الحقول المطلوبة");
      return;
    }
    if (isFutureDate(form.date)) {
      setError("لا يمكن اختيار تاريخ مستقبلي — اختر اليوم أو تاريخاً سابقاً");
      return;
    }

    setSaving(true);
    try {
      const res = await apiFetch("/api/client/vouchers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          voucher_type: voucherType,
          voucher_date: form.date,
          beneficiary_name: form.beneficiary.trim(),
          amount,
          account_code: form.account_code,
          purpose: form.purpose.trim(),
          method: form.method,
          ref: form.ref,
          notes: form.notes,
        }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.message || "فشل حفظ السند");
        return;
      }

      setModalOpen(false);
      setForm({
        date: today(),
        beneficiary: "",
        amount: "",
        method: "نقداً",
        account_code: isReceipt ? "31101001" : "42101001",
        ref: "",
        purpose: "",
        notes: "",
      });
      await loadItems();

      if (print) {
        const detailRes = await apiFetch(`/api/client/vouchers/${json.data.id}`);
        const detailJson = await detailRes.json();
        if (detailJson.success) {
          setPreviewItem(detailJson.data);
          setPreviewOpen(true);
        }
      }
    } catch {
      setError("خطأ في الاتصال بالخادم");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("هل تريد حذف هذا السند؟")) return;
    await apiFetch(`/api/client/vouchers/${id}`, { method: "DELETE" });
    await loadItems();
  }

  async function handlePrintPdf(id: number, voucherNumber: string) {
    setPrintingId(id);
    const prefix = isReceipt ? "sanad-qabd" : "sanad-sarf";
    try {
      await downloadExportFile(
        `/api/client/vouchers/${id}/export-pdf`,
        `${prefix}-${voucherNumber.replace(/[^\w-]+/g, "_")}.pdf`,
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : "فشل تصدير PDF");
    } finally {
      setPrintingId(null);
    }
  }

  function getAccountLabel(code: string) {
    return accounts.find((acc) => acc.account_code === code)?.account_name ?? code;
  }

  async function handleExportExcel() {
    setExportingExcel(true);
    const prefix = isReceipt ? "sanadat-qabd" : "sanadat-sarf";
    try {
      await downloadExportFile(
        `/api/client/vouchers/export-excel?type=${voucherType}`,
        `${prefix}-${new Date().toISOString().slice(0, 10)}.xlsx`,
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : "خطأ في تصدير Excel");
    } finally {
      setExportingExcel(false);
    }
  }

  async function handleExportListPdf() {
    setExportingListPdf(true);
    const prefix = isReceipt ? "sanadat-qabd" : "sanadat-sarf";
    try {
      await downloadExportFile(
        `/api/client/vouchers/export-pdf?type=${voucherType}`,
        `${prefix}-${new Date().toISOString().slice(0, 10)}.pdf`,
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : "خطأ في تصدير PDF");
    } finally {
      setExportingListPdf(false);
    }
  }

  return (
    <AppPage>
      <PageHero
        kicker={isReceipt ? "سندات القبض" : "سندات الصرف"}
        title={isReceipt ? "سندات القبض" : "سندات الصرف"}
        description={
          isReceipt
            ? "تسجيل ومتابعة سندات قبض التبرعات والإيرادات"
            : "تسجيل ومتابعة سندات صرف المصروفات والالتزامات"
        }
        variant={isReceipt ? "emerald" : "gold"}
        stat={{ value: items.length, label: "سند" }}
        actions={
          <>
            <button
              type="button"
              className={`btn btn-sm ${isReceipt ? "btn-success" : "btn-gold"}`}
              disabled={exportingExcel || loading}
              onClick={handleExportExcel}
            >
              <IconDownload size={16} stroke={1.8} />
              {exportingExcel ? "جاري التصدير..." : "تصدير Excel"}
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              disabled={exportingListPdf || loading}
              onClick={handleExportListPdf}
            >
              <IconFileTypePdf size={16} stroke={1.8} />
              {exportingListPdf ? "جاري التصدير..." : "تصدير PDF"}
            </button>
            <button
              type="button"
              className={`btn btn-sm ${isReceipt ? "btn-success" : "btn-gold"}`}
              onClick={() => setModalOpen(true)}
              disabled={!canWrite}
              style={!canWrite ? { display: "none" } : undefined}
            >
              <IconPlus size={16} stroke={1.8} />
              {isReceipt ? "سند قبض جديد" : "سند صرف جديد"}
            </button>
          </>
        }
      />

      <div className="card">
        <div className="tbl-wrap">
          <table>
            <thead>
              <tr>
                <th>رقم السند</th>
                <th>التاريخ</th>
                <th>{isReceipt ? "المستلم من" : "المستفيد"}</th>
                <th>المبلغ (ر.س)</th>
                <th>طريقة الدفع</th>
                <th>الغرض</th>
                <th>الحساب</th>
                <th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8}>
                    <div className="tbl-empty">جاري التحميل...</div>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <div className="tbl-empty">
                      <IconInbox size={36} stroke={1.2} style={{ opacity: 0.4 }} />
                      {isReceipt ? "لا توجد سندات قبض" : "لا توجد سندات صرف"}
                    </div>
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <Fragment key={item.id}>
                    <tr>
                      <td>
                        <span className={`badge ${isReceipt ? "badge-teal" : "badge-ruby"}`}>
                          {item.voucher_number}
                        </span>
                      </td>
                      <td>{fmtDate(item.voucher_date)}</td>
                      <td style={{ fontWeight: 600 }}>{item.beneficiary_name}</td>
                      <td
                        style={{
                          direction: "ltr",
                          textAlign: "right",
                          fontWeight: 700,
                          color: isReceipt ? "var(--emerald)" : "var(--ruby)",
                        }}
                      >
                        {fmtAmt(item.total_amount)}
                      </td>
                      <td>{item.meta.method}</td>
                      <td>{item.meta.purpose}</td>
                      <td>
                        <span className="badge badge-slate" style={{ fontSize: 10 }}>
                          {item.account_name || getAccountLabel(item.meta.account_code)}
                        </span>
                      </td>
                      <td style={{ display: "flex", gap: 6 }}>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => {
                            setPreviewItem(item);
                            setPreviewOpen(true);
                          }}
                        >
                          <IconEye size={14} />
                        </button>
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          disabled={printingId === item.id}
                          onClick={() => handlePrintPdf(item.id, item.voucher_number)}
                          title="طباعة PDF"
                        >
                          <IconPrinter size={14} />
                        </button>
                        {canDelete ? (
                          <button
                            type="button"
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDelete(item.id)}
                          >
                            <IconTrash size={14} />
                          </button>
                        ) : null}
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={8} style={{ padding: "0 14px 10px", background: "var(--snow)" }}>
                        <div className="voucher-journal-accordion">
                          <div
                            className="vja-header"
                            onClick={() =>
                              setOpenJournal(openJournal === item.id ? null : item.id)
                            }
                            onKeyDown={(e) =>
                              e.key === "Enter" &&
                              setOpenJournal(openJournal === item.id ? null : item.id)
                            }
                            role="button"
                            tabIndex={0}
                          >
                            <span>
                              <IconArrowDownCircle
                                size={14}
                                style={{ marginLeft: 6, display: "inline" }}
                              />
                              القيد المحاسبي المرتبط
                            </span>
                            <IconChevronDown size={14} />
                          </div>
                          {openJournal === item.id && item.entries ? (
                            <div className="vja-body open">
                              <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
                                <thead>
                                  <tr style={{ background: "var(--fog)" }}>
                                    <th style={{ padding: "6px 10px", textAlign: "right" }}>الحساب</th>
                                    <th style={{ padding: "6px 10px", textAlign: "center" }}>مدين</th>
                                    <th style={{ padding: "6px 10px", textAlign: "center" }}>دائن</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {item.entries.map((line) => (
                                    <tr key={`${line.account_code}-${line.debit_amount}`}>
                                      <td style={{ padding: "6px 10px" }}>
                                        {getAccountLabel(line.account_code)}
                                      </td>
                                      <td
                                        style={{
                                          padding: "6px 10px",
                                          textAlign: "center",
                                          color: "var(--emerald)",
                                          fontWeight: 700,
                                          direction: "ltr",
                                        }}
                                      >
                                        {line.debit_amount > 0 ? fmtAmt(line.debit_amount) : "—"}
                                      </td>
                                      <td
                                        style={{
                                          padding: "6px 10px",
                                          textAlign: "center",
                                          color: "var(--ruby)",
                                          fontWeight: 700,
                                          direction: "ltr",
                                        }}
                                      >
                                        {line.credit_amount > 0 ? fmtAmt(line.credit_amount) : "—"}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  </Fragment>
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
              {isReceipt ? (
                <IconArrowDownCircle size={18} stroke={1.8} />
              ) : (
                <IconArrowUpCircle size={18} stroke={1.8} />
              )}
              {isReceipt ? "سند قبض جديد" : "سند صرف جديد"}
            </div>
            <button type="button" className="modal-close" onClick={() => setModalOpen(false)}>
              <IconX size={18} />
            </button>
          </div>
          <div className="modal-body">
            <div className="form-grid">
              <div className="form-group">
                <label>التاريخ *</label>
                <DateInput
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                />
              </div>
              <div className="form-group form-full">
                <label>{isReceipt ? "استُلم من السيد / الجهة *" : "صُرف إلى السيد / الجهة *"}</label>
                <input
                  value={form.beneficiary}
                  onChange={(e) => setForm({ ...form, beneficiary: e.target.value })}
                  placeholder={isReceipt ? "اسم المتبرع أو الجهة" : "اسم المستفيد"}
                />
              </div>
              <div className="form-group">
                <label>المبلغ (ر.س) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div className="form-group">
                <label>طريقة الدفع</label>
                <select
                  value={form.method}
                  onChange={(e) => setForm({ ...form, method: e.target.value })}
                >
                  <option>نقداً</option>
                  <option>تحويل بنكي</option>
                  <option>شيك</option>
                  <option>بطاقة ائتمان</option>
                  <option>شيك مصرفي</option>
                </select>
              </div>
              <div className="form-group form-full">
                <label>المبلغ كتابةً</label>
                <input
                  readOnly
                  value={amountWords}
                  style={{
                    color: isReceipt ? "var(--teal-dark)" : "var(--ruby)",
                    fontWeight: 700,
                  }}
                />
              </div>
              <div className="form-group">
                <label>{isReceipt ? "الحساب الدائن" : "الحساب المدين"}</label>
                <select
                  value={form.account_code}
                  onChange={(e) => setForm({ ...form, account_code: e.target.value })}
                >
                  {accounts.map((acc) => (
                    <option key={acc.account_code} value={acc.account_code}>
                      {acc.account_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>رقم المرجع</label>
                <input
                  value={form.ref}
                  onChange={(e) => setForm({ ...form, ref: e.target.value })}
                  placeholder="رقم الشيك / العملية"
                />
              </div>
              <div className="form-group form-full">
                <label>البيان / الغرض *</label>
                <input
                  value={form.purpose}
                  onChange={(e) => setForm({ ...form, purpose: e.target.value })}
                  placeholder={isReceipt ? "الغرض من الاستلام" : "الغرض من الصرف"}
                />
              </div>
              <div className="form-group form-full">
                <label>ملاحظات</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </div>
            </div>
            {error ? (
              <div className="login-error" style={{ display: "block", marginTop: 12 }}>
                {error}
              </div>
            ) : null}
          </div>
          <div className="modal-foot">
            <button type="button" className="btn btn-ghost" onClick={() => setModalOpen(false)}>
              إلغاء
            </button>
            <button
              type="button"
              className={`btn ${isReceipt ? "btn-success" : "btn-gold"}`}
              disabled={saving}
              onClick={() => handleSave(false)}
            >
              <IconCheck size={16} />
              حفظ السند
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={saving}
              onClick={() => handleSave(true)}
            >
              <IconPrinter size={16} />
              حفظ وطباعة
            </button>
          </div>
        </div>
      </div>

      <div className={`modal-overlay${previewOpen ? " open" : ""}`}>
        <div className="modal" style={{ maxWidth: 620 }}>
          <div className="modal-head">
            <div className="modal-title">
              <IconPrinter size={18} stroke={1.8} />
              معاينة السند
            </div>
            <button type="button" className="modal-close" onClick={() => setPreviewOpen(false)}>
              <IconX size={18} />
            </button>
          </div>
          <div className="modal-body">
            {previewItem ? (
              <div className="voucher-preview">
                <div className="voucher-head">
                  <div className="org">Rikaz Accounting</div>
                  <h2>{isReceipt ? "سند قبض" : "سند صرف"}</h2>
                  <div className="vnum">{previewItem.voucher_number}</div>
                </div>
                <div className="voucher-meta">
                  <div className="meta-item">
                    <div className="meta-label">التاريخ</div>
                    <div className="meta-val">{fmtDate(previewItem.voucher_date)}</div>
                  </div>
                  <div className="meta-item">
                    <div className="meta-label">{isReceipt ? "من" : "إلى"}</div>
                    <div className="meta-val">{previewItem.beneficiary_name}</div>
                  </div>
                </div>
                <div className="amount-display">
                  <div className="amount-num">{fmtAmt(previewItem.total_amount)}</div>
                  <div className="amount-currency">ريال سعودي</div>
                  <div className="amount-words">
                    {arabicAmount(previewItem.total_amount)}
                  </div>
                </div>
                <div className="meta-item">
                  <div className="meta-label">البيان</div>
                  <div className="meta-val">{previewItem.meta.purpose}</div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </AppPage>
  );
}
