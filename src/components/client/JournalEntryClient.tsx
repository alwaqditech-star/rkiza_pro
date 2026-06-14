"use client";
import { apiFetch, apiUrl } from "@/lib/api-client";

import { useCallback, useEffect, useState } from "react";
import {
  IconCheck,
  IconInbox,
  IconPlus,
  IconRefresh,
  IconTrash,
} from "@tabler/icons-react";
import { fmtAmt, isFutureDate, today } from "@/lib/format";
import { useClientPermissions } from "./ClientPermissionsContext";
import { AppPage, PageHero } from "@/components/ui/PageHero";
import { DateInput } from "@/components/ui/DateInputs";

interface CoaOption {
  account_code: string;
  account_name: string;
}

interface JournalLineForm {
  account_code: string;
  debit: string;
  credit: string;
}

const ENTRY_TYPES = ["قيد عادي", "قيد ترحيل", "قيد تسوية", "قيد إقفال"];

export function JournalEntryClient() {
  const { canWrite } = useClientPermissions();
  const [accounts, setAccounts] = useState<CoaOption[]>([]);
  const [journalNumber, setJournalNumber] = useState("");
  const [journalDate, setJournalDate] = useState(today());
  const [reference, setReference] = useState("");
  const [entryType, setEntryType] = useState(ENTRY_TYPES[0]);
  const [description, setDescription] = useState("");
  const [lines, setLines] = useState<JournalLineForm[]>([
    { account_code: "", debit: "", credit: "" },
    { account_code: "", debit: "", credit: "" },
  ]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadNextNumber = useCallback(async () => {
    const res = await apiFetch("/api/client/journals/next-number");
    const json = await res.json();
    if (json.success) setJournalNumber(json.data.journal_number);
  }, []);

  useEffect(() => {
    loadNextNumber();
    apiFetch("/api/client/coa")
      .then((r) => r.json())
      .then((json) => {
        if (json.success) {
          setAccounts(
            (json.data as CoaOption[]).map((acc) => ({
              account_code: acc.account_code,
              account_name: acc.account_name,
            })),
          );
        }
      })
      .catch(() => undefined);
  }, [loadNextNumber]);

  const totalDebit = lines.reduce((sum, line) => sum + Number(line.debit || 0), 0);
  const totalCredit = lines.reduce((sum, line) => sum + Number(line.credit || 0), 0);
  const diff = Math.abs(totalDebit - totalCredit);
  const balanced = totalDebit > 0 || totalCredit > 0 ? diff < 0.01 : false;

  function resetForm() {
    setJournalDate(today());
    setReference("");
    setEntryType(ENTRY_TYPES[0]);
    setDescription("");
    setLines([
      { account_code: "", debit: "", credit: "" },
      { account_code: "", debit: "", credit: "" },
    ]);
    setError("");
    setSuccess("");
    loadNextNumber();
  }

  function addLine(hint?: "debit" | "credit") {
    setLines((prev) => [
      ...prev,
      {
        account_code: "",
        debit: hint === "debit" ? "" : "",
        credit: hint === "credit" ? "" : "",
      },
    ]);
  }

  function updateLine(index: number, patch: Partial<JournalLineForm>) {
    setLines((prev) =>
      prev.map((line, i) => (i === index ? { ...line, ...patch } : line)),
    );
  }

  function removeLine(index: number) {
    if (lines.length <= 2) {
      setError("القيد يحتاج سطرين على الأقل");
      return;
    }
    setLines((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSave() {
    setError("");
    setSuccess("");
    if (!description.trim()) {
      setError("يرجى إدخال البيان العام للقيد");
      return;
    }
    if (!balanced) {
      setError("القيد غير متوازن — المدين ≠ الدائن");
      return;
    }
    if (isFutureDate(journalDate)) {
      setError("لا يمكن اختيار تاريخ مستقبلي");
      return;
    }

    setSaving(true);
    try {
      const res = await apiFetch("/api/client/journals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          journal_date: journalDate,
          description: description.trim(),
          reference,
          entry_type: entryType,
          lines: lines
            .filter((line) => line.account_code && (line.debit || line.credit))
            .map((line) => ({
              account_code: line.account_code,
              debit_amount: Number(line.debit || 0),
              credit_amount: Number(line.credit || 0),
            })),
        }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.message || "فشل حفظ القيد");
        return;
      }
      setSuccess(json.message || "تم حفظ القيد بنجاح");
      resetForm();
    } catch {
      setError("خطأ في الاتصال بالخادم");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppPage>
      <PageHero
        kicker="المحاسبة"
        title="قيد اليومية الجديد"
        description="إنشاء قيد محاسبي يدوي متوازن بين المدين والدائن"
        actions={
          canWrite ? (
            <>
              <button type="button" className="btn btn-ghost btn-sm" onClick={resetForm}>
                <IconRefresh size={16} stroke={1.8} />
                تفريغ
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                disabled={saving}
                onClick={handleSave}
              >
                <IconCheck size={16} stroke={1.8} />
                {saving ? "جاري الحفظ..." : "حفظ القيد"}
              </button>
            </>
          ) : undefined
        }
      />

      <div className="card">

      <div className="form-grid" style={{ marginBottom: 14 }}>
        <div className="form-group">
          <label>رقم القيد</label>
          <input readOnly value={journalNumber} />
        </div>
        <div className="form-group">
          <label>التاريخ</label>
          <DateInput
            value={journalDate}
            onChange={(e) => setJournalDate(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label>المرجع / رقم المستند</label>
          <input
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="اختياري"
          />
        </div>
        <div className="form-group">
          <label>نوع القيد</label>
          <select value={entryType} onChange={(e) => setEntryType(e.target.value)}>
            {ENTRY_TYPES.map((type) => (
              <option key={type}>{type}</option>
            ))}
          </select>
        </div>
        <div className="form-group form-full">
          <label>البيان العام</label>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="وصف القيد المحاسبي..."
          />
        </div>
      </div>

      <div className="je-lines-wrap">
        <div className="je-line-header">
          <span>الحساب</span>
          <span />
          <span style={{ textAlign: "center" }}>مدين (ر.س)</span>
          <span style={{ textAlign: "center" }}>دائن (ر.س)</span>
        </div>
        {lines.map((line, index) => (
          <div
            key={`line-${index}`}
            className="je-line-row"
            style={index % 2 === 0 ? { background: "var(--snow)" } : undefined}
          >
            <select
              value={line.account_code}
              onChange={(e) => updateLine(index, { account_code: e.target.value })}
            >
              <option value="">— اختر الحساب —</option>
              {accounts.map((acc) => (
                <option key={acc.account_code} value={acc.account_code}>
                  {acc.account_code} - {acc.account_name}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="del-btn"
              onClick={() => removeLine(index)}
              title="حذف السطر"
            >
              <IconTrash size={16} />
            </button>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={line.debit}
              onChange={(e) => updateLine(index, { debit: e.target.value })}
            />
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={line.credit}
              onChange={(e) => updateLine(index, { credit: e.target.value })}
            />
          </div>
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => addLine()}>
          <IconPlus size={14} />
          إضافة سطر جديد
        </button>
        {totalDebit > 0 || totalCredit > 0 ? (
          <span className={`je-balance-ok ${balanced ? "ok" : "err"}`}>
            {balanced ? "✓ القيد متوازن" : `⚠ فرق: ${fmtAmt(diff)} ر.س`}
          </span>
        ) : null}
      </div>

      <div className="je-totals">
        <div className="je-total-box debit">
          <div className="lbl">إجمالي المدين</div>
          <div className="val">{fmtAmt(totalDebit)}</div>
        </div>
        <div className="je-total-box credit">
          <div className="lbl">إجمالي الدائن</div>
          <div className="val">{fmtAmt(totalCredit)}</div>
        </div>
      </div>

      {error ? (
        <div className="login-error" style={{ display: "block", marginTop: 12 }}>
          {error}
        </div>
      ) : null}
      {success ? (
        <div
          className="je-balance-ok ok"
          style={{ display: "block", marginTop: 12, textAlign: "center" }}
        >
          {success}
        </div>
      ) : null}
      </div>
    </AppPage>
  );
}
