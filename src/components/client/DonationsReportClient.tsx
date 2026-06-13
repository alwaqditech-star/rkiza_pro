"use client";
import { apiFetch, apiUrl } from "@/lib/api-client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  IconChartBar,
  IconChartPie,
  IconCurrencyDollar,
  IconFilter,
  IconHeart,
  IconInbox,
  IconList,
  IconTrendingUp,
  IconUsers,
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

export function DonationsReportClient() {
  const [rows, setRows] = useState<VoucherRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [appliedFrom, setAppliedFrom] = useState("");
  const [appliedTo, setAppliedTo] = useState("");

  const loadRows = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/api/client/vouchers?type=receipt");
      const json = await res.json();
      if (json.success) setRows(json.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRows();
  }, [loadRows]);

  const filtered = useMemo(
    () =>
      rows.filter(
        (row) =>
          (!appliedFrom || row.voucher_date >= appliedFrom) &&
          (!appliedTo || row.voucher_date <= appliedTo),
      ),
    [rows, appliedFrom, appliedTo],
  );

  const totalDonations = filtered.reduce((sum, row) => sum + row.total_amount, 0);
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
        title="تقرير التبرعات والإيرادات"
        description={`ملخص شامل لجميع التبرعات والإيرادات المسجلة${periodLabel} · تاريخ التقرير: ${reportDateLabel()}`}
        variant="emerald"
        stats={[
          { value: fmtAmt(totalDonations), label: "إجمالي التبرعات (ر.س)" },
          { value: filtered.length, label: "عدد السندات" },
        ]}
      />

      <PeriodFilter
        prefix="don-rep"
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
            <div className="stat-card emerald">
              <div className="stat-icon">
                <IconCurrencyDollar size={20} />
              </div>
              <div className="stat-val">{fmtAmt(totalDonations)}</div>
              <div className="stat-lbl">إجمالي التبرعات (ر.س)</div>
            </div>
            <div className="stat-card teal">
              <div className="stat-icon">
                <IconUsers size={20} />
              </div>
              <div className="stat-val">{filtered.length}</div>
              <div className="stat-lbl">عدد سندات القبض</div>
            </div>
            <div className="stat-card gold">
              <div className="stat-icon">
                <IconChartPie size={20} />
              </div>
              <div className="stat-val">{byAccount.length}</div>
              <div className="stat-lbl">أنواع التبرعات</div>
            </div>
            <div className="stat-card ruby">
              <div className="stat-icon">
                <IconTrendingUp size={20} />
              </div>
              <div className="stat-val">
                {fmtAmt(totalDonations / Math.max(filtered.length, 1))}
              </div>
              <div className="stat-lbl">متوسط التبرع (ر.س)</div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <IconChartBar size={18} stroke={1.8} />
                التبرعات حسب النوع
              </div>
            </div>
            {byAccount.length ? (
              byAccount.map(([name, amount]) => (
                <div className="donation-bar" key={name}>
                  <div className="db-name">{name}</div>
                  <div className="db-bar">
                    <div
                      className="db-fill"
                      style={{ width: `${((amount / maxAmount) * 100).toFixed(1)}%` }}
                    />
                  </div>
                  <div className="db-amount">{fmtAmt(amount)}</div>
                </div>
              ))
            ) : (
              <div className="tbl-empty">
                <IconHeart size={36} stroke={1.2} style={{ opacity: 0.4 }} />
                لا توجد تبرعات في هذه الفترة
              </div>
            )}
          </div>

          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <IconList size={18} stroke={1.8} />
                تفاصيل سندات القبض
              </div>
            </div>
            <div className="tbl-wrap">
              <table>
                <thead>
                  <tr>
                    <th>رقم السند</th>
                    <th>التاريخ</th>
                    <th>المتبرع</th>
                    <th>المبلغ (ر.س)</th>
                    <th>النوع</th>
                    <th>طريقة الدفع</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length ? (
                    filtered.map((row) => (
                      <tr key={`${row.voucher_number}-${row.voucher_date}`}>
                        <td>
                          <span className="badge badge-emerald">{row.voucher_number}</span>
                        </td>
                        <td>{fmtDate(row.voucher_date)}</td>
                        <td>{row.beneficiary_name ?? "—"}</td>
                        <td
                          style={{
                            direction: "ltr",
                            textAlign: "right",
                            fontWeight: 700,
                            color: "var(--emerald)",
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
