"use client";
import { apiFetch, apiUrl } from "@/lib/api-client";

import { useEffect, useState } from "react";
import {
  IconBooks,
  IconCalendarMonth,
  IconFileText,
  IconInbox,
  IconSearch,
  IconX,
} from "@tabler/icons-react";
import { fmtAmt, fmtDate } from "@/lib/format";
import {
  ledgerFilename,
  statementFilename,
} from "@/lib/export-filenames";
import { ReportExportButtons } from "./ReportExportButtons";
import { AppPage, PageHero } from "@/components/ui/PageHero";

interface AccountOption {
  account_code: string;
  account_name: string;
}

interface LedgerMovement {
  journal_date: string;
  journal_number: string;
  description: string;
  debit_amount: number;
  credit_amount: number;
  running_balance: number;
}

interface LedgerData {
  account_code: string;
  account_name: string;
  opening_balance: number;
  movements: LedgerMovement[];
  closing_balance: number;
  period_debit: number;
  period_credit: number;
}

type ReportVariant = "ledger" | "statement" | "monthly";

interface AccountReportClientProps {
  variant: ReportVariant;
}

function monthRange(month: string) {
  const from = `${month}-01`;
  const date = new Date(`${month}-01`);
  date.setMonth(date.getMonth() + 1);
  date.setDate(date.getDate() - 1);
  const to = date.toISOString().slice(0, 10);
  return { from, to };
}

function currentMonthValue() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function balanceLabel(value: number) {
  return `${fmtAmt(Math.abs(value))} ${value >= 0 ? "مدين" : "دائن"}`;
}

export function AccountReportClient({ variant }: AccountReportClientProps) {
  const isLedger = variant === "ledger";
  const isMonthly = variant === "monthly";
  const title = isLedger
    ? "دفتر الأستاذ العام"
    : isMonthly
      ? "دفتر الأستاذ العام الشهري"
      : "كشف حساب";
  const kicker = isLedger || isMonthly ? "التقارير المالية" : "كشف الحساب";
  const description = isLedger
    ? "عرض حركة حساب محدد مع الرصيد الجاري"
    : isMonthly
      ? "ملخص حركة الحساب خلال شهر محدد"
      : "كشف تفصيلي لحركة حساب خلال فترة";
  const Icon = isLedger ? IconBooks : isMonthly ? IconCalendarMonth : IconFileText;

  const [accounts, setAccounts] = useState<AccountOption[]>([]);
  const [account, setAccount] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [month, setMonth] = useState(currentMonthValue());
  const [data, setData] = useState<LedgerData | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch("/api/client/journals/accounts")
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setAccounts(json.data);
      })
      .catch(() => undefined);
  }, []);

  async function runSearch(nextFrom = from, nextTo = to) {
    if (!account) {
      setError("اختر الحساب أولاً");
      return;
    }
    setError("");
    setLoading(true);
    setSearched(true);
    try {
      const params = new URLSearchParams({ account });
      if (nextFrom) params.set("from", nextFrom);
      if (nextTo) params.set("to", nextTo);
      const endpoint = variant === "statement" || variant === "monthly"
        ? "/api/client/statement"
        : "/api/client/ledger";
      const res = await fetch(`${endpoint}?${params.toString()}`);
      const json = await res.json();
      if (!json.success) {
        setError(json.message || "فشل تحميل البيانات");
        setData(null);
        return;
      }
      setData(json.data);
    } catch {
      setError("خطأ في الاتصال بالخادم");
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  function handleMonthlySearch() {
    const range = monthRange(month);
    setFrom(range.from);
    setTo(range.to);
    runSearch(range.from, range.to);
  }

  function clearFilters() {
    setAccount("");
    setFrom("");
    setTo("");
    setMonth(currentMonthValue());
    setData(null);
    setSearched(false);
    setError("");
  }

  function buildExportUrl(format: "excel" | "pdf") {
    const params = new URLSearchParams();
    if (isLedger) {
      params.set("account", account);
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      return `/api/client/ledger/export-${format}?${params.toString()}`;
    }

    params.set("account", account);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (isMonthly) params.set("variant", "monthly");
    return `/api/client/statement/export-${format}?${params.toString()}`;
  }

  function buildExportFilename(extension: "xlsx" | "pdf") {
    if (isLedger) {
      return ledgerFilename(account, from || undefined, to || undefined, extension);
    }
    return statementFilename(
      account,
      from || undefined,
      to || undefined,
      extension,
      isMonthly,
    );
  }

  const canExport = Boolean(account && data && (data.movements.length > 0 || data.opening_balance !== 0));

  return (
    <AppPage>
      <PageHero
        kicker={kicker}
        title={title}
        description={description}
        actions={
          <ReportExportButtons
            disabled={!canExport || loading}
            buildExportUrl={buildExportUrl}
            buildFilename={buildExportFilename}
          />
        }
      />

      <div className="card">

      <div
        style={{
          display: "flex",
          gap: 10,
          alignItems: "flex-end",
          flexWrap: "wrap",
          padding: "14px 0",
          borderBottom: "1px solid var(--fog)",
          marginBottom: 16,
        }}
      >
        <div className="form-group" style={{ minWidth: 260 }}>
          <label>الحساب</label>
          <select
            value={account}
            onChange={(e) => setAccount(e.target.value)}
            style={{
              padding: "8px 12px",
              border: "1.5px solid var(--silver)",
              borderRadius: "var(--radius-sm)",
              fontFamily: "var(--font)",
              fontSize: 13,
              width: "100%",
            }}
          >
            <option value="">— اختر الحساب —</option>
            {accounts.map((acc) => (
              <option key={acc.account_code} value={acc.account_code}>
                {acc.account_code} - {acc.account_name}
              </option>
            ))}
          </select>
        </div>

        {isMonthly ? (
          <div className="form-group">
            <label>الشهر</label>
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              style={{
                padding: "8px 12px",
                border: "1.5px solid var(--silver)",
                borderRadius: "var(--radius-sm)",
                fontFamily: "var(--font)",
                fontSize: 13,
              }}
            />
          </div>
        ) : (
          <>
            <div className="form-group">
              <label>{isLedger ? "الفترة من" : "من تاريخ"}</label>
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                style={{
                  padding: "8px 12px",
                  border: "1.5px solid var(--silver)",
                  borderRadius: "var(--radius-sm)",
                  fontFamily: "var(--font)",
                  fontSize: 13,
                }}
              />
            </div>
            <div className="form-group">
              <label>{isLedger ? "إلى" : "إلى تاريخ"}</label>
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                style={{
                  padding: "8px 12px",
                  border: "1.5px solid var(--silver)",
                  borderRadius: "var(--radius-sm)",
                  fontFamily: "var(--font)",
                  fontSize: 13,
                }}
              />
            </div>
          </>
        )}

        <button
          type="button"
          className="btn btn-primary"
          onClick={() => (isMonthly ? handleMonthlySearch() : runSearch())}
        >
          <IconSearch size={16} stroke={1.8} />
          {isMonthly ? "عرض" : isLedger ? "عرض الحركة" : "عرض الكشف"}
        </button>
        <button type="button" className="btn btn-ghost" onClick={clearFilters}>
          <IconX size={16} stroke={1.8} />
          مسح
        </button>
      </div>

      {error ? (
        <div className="login-error" style={{ display: "block", marginBottom: 12 }}>
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="tbl-empty">جاري التحميل...</div>
      ) : !searched || !data ? (
        <div className="tbl-empty">
          <Icon size={36} stroke={1.2} style={{ opacity: 0.4 }} />
          {isLedger
            ? "اختر حساباً لعرض حركته"
            : isMonthly
              ? "اختر الحساب والشهر ثم اضغط عرض"
              : "اختر الحساب والفترة ثم اضغط عرض الكشف"}
        </div>
      ) : !data.movements.length && !data.opening_balance ? (
        <div className="tbl-empty">
          <IconInbox size={36} stroke={1.2} style={{ opacity: 0.4 }} />
          لا توجد حركات في هذه الفترة
        </div>
      ) : variant === "statement" || variant === "monthly" ? (
        <div style={{ border: "1px solid var(--silver)", borderRadius: "var(--radius-md)", overflow: "hidden" }}>
          <div
            style={{
              background: "linear-gradient(135deg,#1B2A4A,#2C4A7C)",
              color: "#fff",
              padding: "16px 20px",
            }}
          >
            <div style={{ fontSize: 17, fontWeight: 700 }}>
              كشف حساب — {data.account_name}
            </div>
            <div style={{ fontSize: 12, opacity: 0.75, marginTop: 4 }}>
              {from ? `من: ${fmtDate(from)}` : "من البداية"} —{" "}
              {to ? `إلى: ${fmtDate(to)}` : "إلى النهاية"} | رمز الحساب: {data.account_code}
            </div>
          </div>
          {renderMovementsTable(data, true)}
        </div>
      ) : (
        <div className="ledger-card">
          <div className="ledger-head">
            <div>
              <h3>{data.account_name}</h3>
              <p>
                رمز الحساب: {data.account_code}
                {from || to
                  ? ` | الفترة: ${from ? fmtDate(from) : "البداية"} — ${to ? fmtDate(to) : "النهاية"}`
                  : ""}
              </p>
            </div>
            <div className="ledger-balance">الرصيد: {balanceLabel(data.closing_balance)} ر.س</div>
          </div>
          {renderMovementsTable(data, false)}
        </div>
      )}
      </div>
    </AppPage>
  );
}

function renderMovementsTable(data: LedgerData, statementStyle: boolean) {
  return (
    <div className="tbl-wrap">
      <table className={statementStyle ? undefined : "ledger-table"}>
        <thead>
          <tr>
            <th>التاريخ</th>
            <th>رقم القيد</th>
            <th>البيان</th>
            <th>مدين (ر.س)</th>
            <th>دائن (ر.س)</th>
            <th>الرصيد (ر.س)</th>
          </tr>
        </thead>
        <tbody>
          {data.opening_balance !== 0 ? (
            <tr style={{ background: "var(--gold-pale)" }}>
              <td colSpan={3} style={{ fontWeight: 700, color: "var(--gold)" }}>
                رصيد أول المدة
              </td>
              <td className="dr-val">
                {data.opening_balance > 0 ? fmtAmt(data.opening_balance) : "—"}
              </td>
              <td className="cr-val">
                {data.opening_balance < 0 ? fmtAmt(Math.abs(data.opening_balance)) : "—"}
              </td>
              <td style={{ fontWeight: 700, direction: "ltr", textAlign: "right", color: "var(--gold)" }}>
                {balanceLabel(data.opening_balance)}
              </td>
            </tr>
          ) : null}
          {data.movements.map((movement, index) => (
            <tr
              key={`${index}-${movement.journal_number}-${movement.journal_date}-${movement.debit_amount}-${movement.credit_amount}`}
            >
              <td>{fmtDate(movement.journal_date)}</td>
              <td>
                <span className="badge badge-teal" style={{ fontSize: 10 }}>
                  {movement.journal_number}
                </span>
              </td>
              <td>{movement.description}</td>
              <td className="dr-val">
                {movement.debit_amount > 0 ? fmtAmt(movement.debit_amount) : "—"}
              </td>
              <td className="cr-val">
                {movement.credit_amount > 0 ? fmtAmt(movement.credit_amount) : "—"}
              </td>
              <td
                style={{
                  fontWeight: 700,
                  direction: "ltr",
                  textAlign: "right",
                  color: movement.running_balance >= 0 ? "var(--emerald)" : "var(--ruby)",
                }}
              >
                {balanceLabel(movement.running_balance)}
              </td>
            </tr>
          ))}
          <tr className={statementStyle ? undefined : "total-row"} style={statementStyle ? { background: "var(--teal-pale)", fontWeight: 700 } : undefined}>
            <td colSpan={3} style={{ textAlign: "center" }}>
              {statementStyle ? "الإجمالي" : "إجمالي الفترة"}
            </td>
            <td className="dr-val">{fmtAmt(data.period_debit)}</td>
            <td className="cr-val">{fmtAmt(data.period_credit)}</td>
            <td style={{ fontWeight: 700, direction: "ltr", textAlign: "right" }}>
              {balanceLabel(data.closing_balance)}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
