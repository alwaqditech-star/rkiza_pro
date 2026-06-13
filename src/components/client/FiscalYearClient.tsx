"use client";
import { apiFetch, apiUrl } from "@/lib/api-client";

import { useCallback, useEffect, useState } from "react";
import {
  IconCalendarStats,
  IconHistory,
  IconLock,
  IconLockOpen,
} from "@tabler/icons-react";
import { fmtAmt, fmtDate } from "@/lib/format";
import type { FiscalStatus } from "@/lib/types";
import { AppPage, PageHero } from "@/components/ui/PageHero";

export function FiscalYearClient() {
  const [status, setStatus] = useState<FiscalStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [newYear, setNewYear] = useState("");
  const [message, setMessage] = useState("");

  const loadStatus = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/api/client/fiscal");
      const json = await res.json();
      if (json.success) {
        setStatus(json.data);
        setNewYear(String(json.data.current_fiscal_year + 1));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  async function handleClose() {
    if (
      !confirm(
        `هل تريد إقفال السنة المالية ${status?.current_fiscal_year}م؟\nسيتم إنشاء قيد الإقفال تلقائياً.`,
      )
    ) {
      return;
    }
    const res = await apiFetch("/api/client/fiscal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "close" }),
    });
    const json = await res.json();
    setMessage(json.message ?? "");
    if (json.success) setStatus(json.data);
  }

  async function handleOpen() {
    const year = Number(newYear);
    if (!year) return;
    if (!confirm(`فتح السنة المالية الجديدة ${year}م؟`)) return;

    const res = await apiFetch("/api/client/fiscal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "open", year }),
    });
    const json = await res.json();
    setMessage(json.message ?? "");
    if (json.success) setStatus(json.data);
  }

  return (
    <AppPage>
      <PageHero
        kicker="الإعدادات المالية"
        title="إدارة السنة المالية"
        description="متابعة السنة الحالية وإقفال السنوات السابقة وفتح سنة جديدة"
        stat={
          status
            ? { value: status.current_fiscal_year, label: "السنة الحالية" }
            : undefined
        }
      />

      <div className="card">
      {message ? (
        <div className="page-alert success">{message}</div>
      ) : null}

      {loading || !status ? (
        <div className="tbl-empty">جاري التحميل...</div>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }} className="dash-two-col">
            <div
              style={{
                background: "var(--ruby-pale)",
                border: "1.5px solid var(--ruby)",
                borderRadius: "var(--radius-md)",
                padding: 20,
              }}
            >
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: "var(--ruby)",
                  marginBottom: 8,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <IconLock size={18} />
                إقفال السنة المالية
              </div>
              <p style={{ fontSize: 13, color: "var(--slate)", marginBottom: 16, lineHeight: 1.6 }}>
                إقفال السنة المالية الحالية يعني ترحيل الأرصدة وإنشاء قيد الإقفال تلقائياً.
              </p>
              <div
                style={{
                  background: "#fff",
                  borderRadius: "var(--radius-sm)",
                  padding: 12,
                  marginBottom: 14,
                }}
              >
                <div style={{ fontSize: 12, color: "var(--mist)" }}>السنة المالية الحالية</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: "var(--ink)" }}>
                  {status.current_fiscal_year}م
                </div>
              </div>
              <button type="button" className="btn btn-danger" onClick={handleClose}>
                <IconLock size={14} />
                إقفال السنة المالية
              </button>
            </div>

            <div
              style={{
                background: "var(--emerald-pale)",
                border: "1.5px solid var(--emerald)",
                borderRadius: "var(--radius-md)",
                padding: 20,
              }}
            >
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: "var(--emerald)",
                  marginBottom: 8,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <IconLockOpen size={18} />
                فتح سنة مالية جديدة
              </div>
              <p style={{ fontSize: 13, color: "var(--slate)", marginBottom: 16, lineHeight: 1.6 }}>
                فتح سنة مالية جديدة بعد الإقفال. سيتم تحديث السنة الحالية في إعدادات الجمعية.
              </p>
              <div className="form-group" style={{ marginBottom: 14 }}>
                <label>سنة مالية جديدة</label>
                <input
                  type="number"
                  min={2024}
                  max={2099}
                  value={newYear}
                  onChange={(e) => setNewYear(e.target.value)}
                  style={{
                    padding: "9px 12px",
                    border: "1.5px solid var(--silver)",
                    borderRadius: "var(--radius-sm)",
                    fontFamily: "var(--font)",
                    fontSize: 14,
                    width: "100%",
                  }}
                />
              </div>
              <button
                type="button"
                className="btn btn-success"
                onClick={handleOpen}
                disabled={!status.can_open_new}
              >
                <IconLockOpen size={14} />
                فتح السنة الجديدة
              </button>
            </div>
          </div>

          <div className="card" style={{ marginTop: 16, border: "none", boxShadow: "none" }}>
            <div className="card-header">
              <div className="card-title">
                <IconHistory size={18} stroke={1.8} />
                سجل السنوات المالية
              </div>
            </div>
            {status.closed_years.length === 0 ? (
              <div className="tbl-empty">
                <IconHistory size={36} stroke={1.2} style={{ opacity: 0.4 }} />
                لا توجد سنوات مالية مقفلة
              </div>
            ) : (
              <div className="tbl-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>السنة</th>
                      <th>تاريخ الإقفال</th>
                      <th>عدد القيود</th>
                      <th>إجمالي الإيرادات</th>
                      <th>إجمالي المصروفات</th>
                      <th>الحالة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {status.closed_years.map((year) => (
                      <tr key={year.id}>
                        <td style={{ fontWeight: 700 }}>{year.fiscal_year}م</td>
                        <td>{fmtDate(year.closed_date)}</td>
                        <td>{year.journal_count}</td>
                        <td style={{ color: "var(--emerald)", fontWeight: 700, direction: "ltr" }}>
                          {fmtAmt(year.total_income)}
                        </td>
                        <td style={{ color: "var(--ruby)", fontWeight: 700, direction: "ltr" }}>
                          {fmtAmt(year.total_expenses)}
                        </td>
                        <td>
                          <span className="badge badge-slate">مقفلة</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
      </div>
    </AppPage>
  );
}
