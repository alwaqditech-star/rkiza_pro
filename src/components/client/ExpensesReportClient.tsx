"use client";
import { apiFetch, apiUrl } from "@/lib/api-client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  IconChartBar,
  IconChartPie,
  IconCurrencyDollar,
  IconFileDollar,
  IconFilter,
  IconInbox,
  IconList,
  IconReportMoney,
  IconScale,
  IconX,
} from "@tabler/icons-react";
import { fmtAmt, fmtDate } from "@/lib/format";
import { AppPage, PageHero } from "@/components/ui/PageHero";

interface VoucherRow {
  voucher_number: string;
  voucher_date: string;
  beneficiary_name: string | null;
  total_amount: number;
  account_name?: string;
  meta: {
    method: string;
  };
}

function reportDateLabel() {
  return new Date().toLocaleDateString("ar-SA");
}

function PeriodFilter({
  prefix,
  from,
  to,
  onFromChange,
  onToChange,
  onApply,
  onClear,
}: {
  prefix: string;
  from: string;
  to: string;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
  onApply: () => void;
  onClear: () => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 10,
        alignItems: "center",
        marginBottom: 16,
        padding: "12px 16px",
        background: "#fff",
        border: "1px solid var(--silver)",
        borderRadius: "var(--radius-md)",
      }}
    >
      <span style={{ fontSize: 12, fontWeight: 700, color: "var(--mist)" }}>فترة التقرير</span>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ fontSize: 12, color: "var(--mist)" }}>من</span>
        <input
          id={`${prefix}-from`}
          type="date"
          value={from}
          onChange={(e) => onFromChange(e.target.value)}
          style={{
            padding: "7px 10px",
            border: "1.5px solid var(--silver)",
            borderRadius: "var(--radius-sm)",
            fontFamily: "var(--font)",
            fontSize: 13,
            background: "#fff",
          }}
        />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ fontSize: 12, color: "var(--mist)" }}>إلى</span>
        <input
          id={`${prefix}-to`}
          type="date"
          value={to}
          onChange={(e) => onToChange(e.target.value)}
          style={{
            padding: "7px 10px",
            border: "1.5px solid var(--silver)",
            borderRadius: "var(--radius-sm)",
            fontFamily: "var(--font)",
            fontSize: 13,
            background: "#fff",
          }}
        />
      </div>
      <button type="button" className="btn btn-primary btn-sm" onClick={onApply}>
        <IconFilter size={14} />
        تطبيق
      </button>
      <button type="button" className="btn btn-ghost btn-sm" onClick={onClear}>
        <IconX size={14} />
        مسح
      </button>
    </div>
  );
}

export function ExpensesReportClient() {
  const [payments, setPayments] = useState<VoucherRow[]>([]);
  const [receipts, setReceipts] = useState<VoucherRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [appliedFrom, setAppliedFrom] = useState("");
  const [appliedTo, setAppliedTo] = useState("");

  const loadRows = useCallback(async () => {
    setLoading(true);
    try {
      const [payRes, recRes] = await Promise.all([
        apiFetch("/api/client/vouchers?type=disbursement"),
        apiFetch("/api/client/vouchers?type=receipt"),
      ]);
      const payJson = await payRes.json();
      const recJson = await recRes.json();
      if (payJson.success) setPayments(payJson.data);
      if (recJson.success) setReceipts(recJson.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRows();
  }, [loadRows]);

  const inPeriod = useCallback(
    (date: string) =>
      (!appliedFrom || date >= appliedFrom) && (!appliedTo || date <= appliedTo),
    [appliedFrom, appliedTo],
  );

  const filtered = useMemo(
    () => payments.filter((row) => inPeriod(row.voucher_date)),
    [payments, inPeriod],
  );
  const filteredReceipts = useMemo(
    () => receipts.filter((row) => inPeriod(row.voucher_date)),
    [receipts, inPeriod],
  );

  const totalExp = filtered.reduce((sum, row) => sum + row.total_amount, 0);
  const totalDon = filteredReceipts.reduce((sum, row) => sum + row.total_amount, 0);
  const byAccount = useMemo(() => {
    const map = new Map<string, number>();
    filtered.forEach((row) => {
      const name = row.account_name ?? "غير محدد";
      map.set(name, (map.get(name) ?? 0) + row.total_amount);
    });
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [filtered]);
  const maxAmount = byAccount[0]?.[1] ?? 1;

  const periodLabel =
    appliedFrom || appliedTo
      ? ` (${appliedFrom ? fmtDate(appliedFrom) : "البداية"} — ${appliedTo ? fmtDate(appliedTo) : "النهاية"})`
      : "";

  return (
    <AppPage>
      <PageHero
        kicker="التقارير المالية"
        title="تقرير المصروفات"
        description={`ملخص شامل لجميع المصروفات المسجلة${periodLabel} · تاريخ التقرير: ${reportDateLabel()}`}
        variant="ruby"
        stats={[
          { value: fmtAmt(totalExp), label: "إجمالي المصروفات (ر.س)" },
          { value: filtered.length, label: "عدد السندات" },
        ]}
      />

      <PeriodFilter
        prefix="exp-rep"
        from={from}
        to={to}
        onFromChange={setFrom}
        onToChange={setTo}
        onApply={() => {
          setAppliedFrom(from);
          setAppliedTo(to);
        }}
        onClear={() => {
          setFrom("");
          setTo("");
          setAppliedFrom("");
          setAppliedTo("");
        }}
      />

      {loading ? (
        <div className="tbl-empty">جاري التحميل...</div>
      ) : (
        <>
          <div className="stats-grid">
            <div className="stat-card ruby">
              <div className="stat-icon">
                <IconCurrencyDollar size={20} />
              </div>
              <div className="stat-val">{fmtAmt(totalExp)}</div>
              <div className="stat-lbl">إجمالي المصروفات (ر.س)</div>
            </div>
            <div className="stat-card teal">
              <div className="stat-icon">
                <IconFileDollar size={20} />
              </div>
              <div className="stat-val">{filtered.length}</div>
              <div className="stat-lbl">عدد سندات الصرف</div>
            </div>
            <div className="stat-card gold">
              <div className="stat-icon">
                <IconChartPie size={20} />
              </div>
              <div className="stat-val">{byAccount.length}</div>
              <div className="stat-lbl">فئات المصروفات</div>
            </div>
            <div className="stat-card emerald">
              <div className="stat-icon">
                <IconScale size={20} />
              </div>
              <div className="stat-val">{fmtAmt(totalDon - totalExp)}</div>
              <div className="stat-lbl">صافي الفائض / العجز (ر.س)</div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <IconChartBar size={18} stroke={1.8} />
                المصروفات حسب البند
              </div>
            </div>
            {byAccount.length ? (
              byAccount.map(([name, amount]) => (
                <div className="donation-bar" key={name}>
                  <div className="db-name">{name}</div>
                  <div className="db-bar">
                    <div
                      className="db-fill"
                      style={{
                        width: `${((amount / maxAmount) * 100).toFixed(1)}%`,
                        background: "linear-gradient(90deg,var(--ruby),#e05575)",
                      }}
                    />
                  </div>
                  <div className="db-amount" style={{ color: "var(--ruby)" }}>
                    {fmtAmt(amount)}
                  </div>
                </div>
              ))
            ) : (
              <div className="tbl-empty">
                <IconInbox size={36} stroke={1.2} style={{ opacity: 0.4 }} />
                لا توجد مصروفات في هذه الفترة
              </div>
            )}
          </div>

          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <IconList size={18} stroke={1.8} />
                تفاصيل سندات الصرف
              </div>
            </div>
            <div className="tbl-wrap">
              <table>
                <thead>
                  <tr>
                    <th>رقم السند</th>
                    <th>التاريخ</th>
                    <th>المستفيد</th>
                    <th>المبلغ (ر.س)</th>
                    <th>البند</th>
                    <th>طريقة الدفع</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length ? (
                    filtered.map((row) => (
                      <tr key={`${row.voucher_number}-${row.voucher_date}`}>
                        <td>
                          <span className="badge badge-ruby">{row.voucher_number}</span>
                        </td>
                        <td>{fmtDate(row.voucher_date)}</td>
                        <td>{row.beneficiary_name ?? "—"}</td>
                        <td
                          style={{
                            direction: "ltr",
                            textAlign: "right",
                            fontWeight: 700,
                            color: "var(--ruby)",
                          }}
                        >
                          {fmtAmt(row.total_amount)}
                        </td>
                        <td>{row.account_name ?? "—"}</td>
                        <td>{row.meta?.method ?? "نقداً"}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6}>
                        <div className="tbl-empty">
                          <IconInbox size={32} stroke={1.2} style={{ opacity: 0.4 }} />
                          لا توجد سجلات في هذه الفترة
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </AppPage>
  );
}
