"use client";
import { apiFetch } from "@/lib/api-client";

import { useCallback, useEffect, useState } from "react";
import {
  IconCash,
  IconCheck,
  IconFileInvoice,
  IconInbox,
  IconRefresh,
  IconUsersGroup,
} from "@tabler/icons-react";
import { fmtAmt, isFutureYearMonth } from "@/lib/format";
import { payrollFilename } from "@/lib/export-filenames";
import type { PayrollEmployee, PayrollPreview } from "@/lib/types";
import { notifyApiResult } from "@/lib/notify";
import { useToast } from "@/components/ui/ToastProvider";
import { useClientPermissions } from "./ClientPermissionsContext";
import { ReportExportButtons } from "./ReportExportButtons";
import { AppPage, PageHero } from "@/components/ui/PageHero";

const MONTHS = [
  { value: "01", label: "يناير" },
  { value: "02", label: "فبراير" },
  { value: "03", label: "مارس" },
  { value: "04", label: "أبريل" },
  { value: "05", label: "مايو" },
  { value: "06", label: "يونيو" },
  { value: "07", label: "يوليو" },
  { value: "08", label: "أغسطس" },
  { value: "09", label: "سبتمبر" },
  { value: "10", label: "أكتوبر" },
  { value: "11", label: "نوفمبر" },
  { value: "12", label: "ديسمبر" },
];

export function PayrollClient() {
  const toast = useToast();
  const { canWrite } = useClientPermissions();
  const now = new Date();
  const [month, setMonth] = useState(String(now.getMonth() + 1).padStart(2, "0"));
  const [year, setYear] = useState(String(now.getFullYear()));
  const [preview, setPreview] = useState<PayrollPreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [disbursingId, setDisbursingId] = useState<number | null>(null);

  const loadPreview = useCallback(async () => {
    if (isFutureYearMonth(month, year)) {
      toast.warning("لا يمكن اختيار شهر أو سنة مستقبلية");
      setPreview(null);
      return;
    }
    setLoading(true);
    try {
      const res = await apiFetch(`/api/client/payroll?month=${month}&year=${year}`);
      const json = await res.json();
      if (json.success) setPreview(json.data);
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => {
    loadPreview();
  }, [loadPreview]);

  async function handleGenerate() {
    await loadPreview();
    setGenerated(true);
  }

  async function handlePostJournal() {
    if (!preview) return;
    if (!confirm(`ترحيل قيد مسير رواتب ${preview.month_label} ${preview.year}م؟`)) return;

    const res = await apiFetch("/api/client/payroll", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ month, year: Number(year) }),
    });
    const json = await res.json();
    if (notifyApiResult(toast, json, { success: "تم ترحيل مسير الرواتب بنجاح", error: "فشل الترحيل" })) {
      loadPreview();
    }
  }

  async function handleDisburseEmployee(employee: PayrollEmployee) {
    if (!preview || !employee.net_salary) return;
    if (
      !confirm(
        `صرف راتب ${employee.name} بمبلغ ${fmtAmt(employee.net_salary)} ر.س لشهر ${preview.month_label} ${preview.year}م؟`,
      )
    ) {
      return;
    }

    setDisbursingId(employee.id);
    try {
      const res = await apiFetch("/api/client/payroll/disburse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employee_id: employee.id,
          month,
          year: Number(year),
        }),
      });
      const json = await res.json();
      if (notifyApiResult(toast, json, { success: json.message || "تم صرف الراتب", error: "فشل الصرف" })) {
        await loadPreview();
      }
    } finally {
      setDisbursingId(null);
    }
  }

  const employees: PayrollEmployee[] = preview?.employees ?? [];

  return (
    <AppPage>
      <PageHero
        kicker="الرواتب"
        title="مسير الرواتب"
        description="إنشاء مسير رواتب شهري وترحيله كقيد محاسبي"
        stat={{ value: employees.length, label: "موظف في المسير" }}
        actions={
          <>
            <ReportExportButtons
              disabled={loading || !preview || preview.employees.length === 0}
              buildExportUrl={(format) =>
                `/api/client/payroll/export-${format}?month=${encodeURIComponent(month)}&year=${encodeURIComponent(year)}`
              }
              buildFilename={(extension) => payrollFilename(month, Number(year), extension)}
            />
            <select
              value={month}
              onChange={(e) => {
                const nextMonth = e.target.value;
                if (isFutureYearMonth(nextMonth, year)) {
                  toast.warning("لا يمكن اختيار شهر مستقبلي");
                  return;
                }
                setMonth(nextMonth);
                setGenerated(false);
              }}
              className="coa-search-input"
              style={{ width: "auto", minWidth: 120 }}
            >
              {MONTHS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
            <input
              type="number"
              value={year}
              max={new Date().getFullYear()}
              onChange={(e) => {
                const maxYear = new Date().getFullYear();
                let nextYear = e.target.value;
                if (Number(nextYear) > maxYear) nextYear = String(maxYear);
                setYear(nextYear);
                setGenerated(false);
              }}
              placeholder="السنة"
              className="coa-search-input"
              style={{ width: 90 }}
            />
            {canWrite ? (
              <button type="button" className="btn btn-primary btn-sm" onClick={handleGenerate}>
                <IconRefresh size={14} />
                إنشاء المسير
              </button>
            ) : null}
          </>
        }
      />

      <div className="card">
      {loading ? (
        <div className="tbl-empty">جاري التحميل...</div>
      ) : !generated ? (
        <div className="tbl-empty">
          <IconCash size={36} stroke={1.2} style={{ opacity: 0.4 }} />
          اختر الشهر والسنة ثم اضغط إنشاء المسير
        </div>
      ) : !employees.length ? (
        <div className="tbl-empty">
          <IconUsersGroup size={36} stroke={1.2} style={{ opacity: 0.4 }} />
          لا يوجد موظفون نشطون
        </div>
      ) : preview ? (
        <>
          <div
            style={{
              background: "linear-gradient(135deg,#1B2A4A,#2C4A7C)",
              color: "#fff",
              borderRadius: "var(--radius-md)",
              padding: "14px 18px",
              margin: "0 16px 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 10,
            }}
          >
            <div>
              <div style={{ fontSize: 16, fontWeight: 700 }}>
                مسير رواتب {preview.month_label} {preview.year}م
              </div>
              <div style={{ fontSize: 12, opacity: 0.7, marginTop: 2 }}>
                {employees.length} موظف نشط
                {preview.posted ? " — تم الترحيل" : ""}
                {preview.posted
                  ? ` — تم صرف ${preview.disbursed_count} / ${employees.length}`
                  : ""}
              </div>
            </div>
            {canWrite ? (
              <button
                type="button"
                className="btn btn-sm"
                style={{ background: "rgba(255,255,255,.15)", color: "#fff", fontSize: 12 }}
                onClick={handlePostJournal}
                disabled={preview.posted}
              >
                <IconFileInvoice size={14} />
                {preview.posted ? "تم الترحيل" : "ترحيل قيد الرواتب"}
              </button>
            ) : null}
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 12,
              margin: "0 16px 16px",
            }}
          >
            <div
              style={{
                background: "#fff",
                border: "1px solid var(--silver)",
                borderRadius: "var(--radius-md)",
                padding: 14,
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 11, color: "var(--mist)", marginBottom: 4 }}>
                إجمالي الرواتب
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, direction: "ltr" }}>
                {fmtAmt(preview.total_gross)}
              </div>
            </div>
            <div
              style={{
                background: "#fff",
                border: "1px solid var(--silver)",
                borderRadius: "var(--radius-md)",
                padding: 14,
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 11, color: "var(--mist)", marginBottom: 4 }}>
                التأمينات الاجتماعية
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "var(--ruby)", direction: "ltr" }}>
                {fmtAmt(preview.total_gosi)}
              </div>
            </div>
            <div
              style={{
                background: "#fff",
                border: "1px solid var(--silver)",
                borderRadius: "var(--radius-md)",
                padding: 14,
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 11, color: "var(--mist)", marginBottom: 4 }}>
                صافي المدفوع
              </div>
              <div
                style={{ fontSize: 18, fontWeight: 700, color: "var(--emerald)", direction: "ltr" }}
              >
                {fmtAmt(preview.total_net)}
              </div>
            </div>
          </div>

          <div className="tbl-wrap" style={{ padding: "0 16px 16px" }}>
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>الموظف</th>
                  <th>المسمى</th>
                  <th>الأساسي</th>
                  <th>السكن</th>
                  <th>المواصلات</th>
                  <th>الإجمالي</th>
                  <th>التأمينات</th>
                  <th>الصافي</th>
                  <th>حالة الصرف</th>
                  {preview.posted && canWrite ? <th>إجراء</th> : null}
                </tr>
              </thead>
              <tbody>
                {employees.map((employee, index) => (
                  <tr key={employee.id}>
                    <td>{index + 1}</td>
                    <td style={{ fontWeight: 700 }}>{employee.name}</td>
                    <td>{employee.job_title}</td>
                    <td style={{ direction: "ltr", textAlign: "right" }}>
                      {fmtAmt(employee.basic_salary)}
                    </td>
                    <td style={{ direction: "ltr", textAlign: "right" }}>
                      {fmtAmt(employee.housing_allowance)}
                    </td>
                    <td style={{ direction: "ltr", textAlign: "right" }}>
                      {fmtAmt(employee.transport_allowance)}
                    </td>
                    <td style={{ direction: "ltr", textAlign: "right", fontWeight: 700 }}>
                      {fmtAmt(employee.gross_salary)}
                    </td>
                    <td style={{ direction: "ltr", textAlign: "right", color: "var(--ruby)" }}>
                      {fmtAmt(employee.gosi_amount)}
                    </td>
                    <td
                      style={{
                        direction: "ltr",
                        textAlign: "right",
                        fontWeight: 700,
                        color: "var(--emerald)",
                      }}
                    >
                      {fmtAmt(employee.net_salary)}
                    </td>
                    <td>
                      {employee.disbursed ? (
                        <span className="badge badge-teal" style={{ fontSize: 10 }}>
                          تم الصرف
                          {employee.voucher_number ? ` — ${employee.voucher_number}` : ""}
                        </span>
                      ) : preview.posted ? (
                        <span className="badge badge-slate" style={{ fontSize: 10 }}>
                          لم يُصرف
                        </span>
                      ) : (
                        <span style={{ color: "var(--mist)", fontSize: 12 }}>—</span>
                      )}
                    </td>
                    {preview.posted && canWrite ? (
                      <td>
                        {employee.disbursed ? (
                          <span style={{ color: "var(--mist)", fontSize: 12 }}>—</span>
                        ) : (
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            disabled={disbursingId === employee.id}
                            onClick={() => handleDisburseEmployee(employee)}
                          >
                            <IconCash size={14} />
                            {disbursingId === employee.id ? "جاري الصرف..." : "صرف الراتب"}
                          </button>
                        )}
                      </td>
                    ) : null}
                  </tr>
                ))}
                <tr style={{ background: "var(--teal-pale)", fontWeight: 700 }}>
                  <td colSpan={6} style={{ textAlign: "center" }}>
                    الإجمالي
                  </td>
                  <td style={{ direction: "ltr", textAlign: "right" }}>
                    {fmtAmt(preview.total_gross)}
                  </td>
                  <td style={{ direction: "ltr", textAlign: "right", color: "var(--ruby)" }}>
                    {fmtAmt(preview.total_gosi)}
                  </td>
                  <td style={{ direction: "ltr", textAlign: "right", color: "var(--emerald)" }}>
                    {fmtAmt(preview.total_net)}
                  </td>
                  <td style={{ textAlign: "center", fontSize: 12, color: "var(--mist)" }}>
                    {preview.posted
                      ? preview.all_disbursed
                        ? "اكتمل الصرف"
                        : `${preview.pending_count} متبقي`
                      : "—"}
                  </td>
                  {preview.posted && canWrite ? <td /> : null}
                </tr>
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="tbl-empty">
          <IconInbox size={36} stroke={1.2} style={{ opacity: 0.4 }} />
          لا توجد بيانات
        </div>
      )}
      </div>
    </AppPage>
  );
}
