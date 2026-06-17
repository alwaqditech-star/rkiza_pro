"use client";

import { useState } from "react";
import { IconInbox, IconRefresh, IconScale } from "@tabler/icons-react";
import { trialBalanceFilename } from "@/lib/export-filenames";
import { fmtAmt } from "@/lib/format";
import { useApiQuery } from "@/lib/use-api-query";
import { ReportExportButtons } from "./ReportExportButtons";
import { AppPage, PageHero } from "@/components/ui/PageHero";
import { DateInput } from "@/components/ui/DateInputs";

interface TrialRow {
  account_code: string;
  account_name: string;
  debit_balance: number;
  credit_balance: number;
}

export function TrialBalanceClient() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [appliedFrom, setAppliedFrom] = useState("");
  const [appliedTo, setAppliedTo] = useState("");

  const { data: rowsData, loading, refresh } = useApiQuery<TrialRow[]>("/api/client/trial", {
    params: { from: appliedFrom || undefined, to: appliedTo || undefined },
    ttl: "report",
  });
  const rows = rowsData ?? [];

  function applyFilters() {
    setAppliedFrom(from);
    setAppliedTo(to);
  }

  function clearFilters() {
    setFrom("");
    setTo("");
    setAppliedFrom("");
    setAppliedTo("");
  }

  const totalDebit = rows.reduce((sum, row) => sum + row.debit_balance, 0);
  const totalCredit = rows.reduce((sum, row) => sum + row.credit_balance, 0);
  const balanced = Math.abs(totalDebit - totalCredit) < 0.01;

  return (
    <AppPage>
      <PageHero
        kicker="التقارير المالية"
        title="ميزان المراجعة"
        description="عرض أرصدة الحسابات المدينة والدائنة لفترة محددة"
        stat={{ value: rows.length, label: "حساب" }}
        actions={
          <>
            <ReportExportButtons
              disabled={loading || rows.length === 0}
              buildExportUrl={(format) => {
                const params = new URLSearchParams();
                if (appliedFrom) params.set("from", appliedFrom);
                if (appliedTo) params.set("to", appliedTo);
                const query = params.toString();
                return `/api/client/trial/export-${format}${query ? `?${query}` : ""}`;
              }}
              buildFilename={(extension) =>
                trialBalanceFilename(appliedFrom || undefined, appliedTo || undefined, extension)
              }
            />
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => void refresh()}>
              <IconRefresh size={16} stroke={1.8} />
              تحديث
            </button>
          </>
        }
      />

      <div className="card">
        <div className="filter-bar">
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--slate)", whiteSpace: "nowrap" }}>
              الفترة من:
            </span>
            <DateInput
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              style={{
                padding: "7px 10px",
                border: "1.5px solid var(--silver)",
                borderRadius: "var(--radius-sm)",
                fontFamily: "var(--font)",
                fontSize: 13,
              }}
            />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--slate)", whiteSpace: "nowrap" }}>
              إلى:
            </span>
            <DateInput
              value={to}
              onChange={(e) => setTo(e.target.value)}
              style={{
                padding: "7px 10px",
                border: "1.5px solid var(--silver)",
                borderRadius: "var(--radius-sm)",
                fontFamily: "var(--font)",
                fontSize: 13,
              }}
            />
          </div>
          <button type="button" className="btn btn-primary btn-sm" onClick={applyFilters}>
            تطبيق
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={clearFilters}>
            مسح الفترة
          </button>
        </div>

        {loading ? (
          <div className="tbl-empty">جاري التحميل...</div>
        ) : rows.length === 0 ? (
          <div className="tbl-empty">
            <IconInbox size={36} stroke={1.2} style={{ opacity: 0.4 }} />
            لا توجد أرصدة في هذه الفترة
          </div>
        ) : (
          <>
            <div className="tbl-wrap" style={{ marginTop: 16 }}>
              <table className="tb-table">
                <thead>
                  <tr>
                    <th>رمز الحساب</th>
                    <th>اسم الحساب</th>
                    <th>مدين (ر.س)</th>
                    <th>دائن (ر.س)</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.account_code}>
                      <td style={{ fontFamily: "monospace", fontSize: 12, color: "var(--mist)" }}>
                        {row.account_code}
                      </td>
                      <td style={{ fontWeight: 600 }}>{row.account_name}</td>
                      <td className="dr-val">
                        {row.debit_balance > 0 ? fmtAmt(row.debit_balance) : "—"}
                      </td>
                      <td className="cr-val">
                        {row.credit_balance > 0 ? fmtAmt(row.credit_balance) : "—"}
                      </td>
                    </tr>
                  ))}
                  <tr className="total-main">
                    <td colSpan={2} style={{ textAlign: "center" }}>
                      الإجمالي
                    </td>
                    <td className="dr-val">{fmtAmt(totalDebit)}</td>
                    <td className="cr-val">{fmtAmt(totalCredit)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className={`balance-check ${balanced ? "ok" : "err"}`}>
              {balanced
                ? "✓ ميزان المراجعة متوازن"
                : `⚠ فرق الميزان: ${fmtAmt(Math.abs(totalDebit - totalCredit))} ر.س`}
            </div>
          </>
        )}
      </div>
    </AppPage>
  );
}
