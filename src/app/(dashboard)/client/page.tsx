"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  IconArrowDownCircle,
  IconArrowUpCircle,
  IconChartBar,
  IconFileDollar,
  IconFileInvoice,
  IconInbox,
} from "@tabler/icons-react";
import { apiFetch } from "@/lib/api-client";
import { fmtAmt } from "@/lib/format";
import { permissionDeniedMessage, type ClientAccessLevel } from "@/lib/client-permissions";

interface VoucherSummary {
  voucher_number: string;
  beneficiary_name: string | null;
  total_amount: number;
}

interface DashboardData {
  total_donations: number;
  total_expenses: number;
  receipt_count: number;
  payment_count: number;
  net: number;
  recent_receipts: VoucherSummary[];
  recent_payments: VoucherSummary[];
}

export default function ClientDashboardPage() {
  return (
    <Suspense fallback={<div className="tbl-empty">جاري تحميل لوحة التحكم...</div>}>
      <ClientDashboardContent />
    </Suspense>
  );
}

function ClientDashboardContent() {
  const searchParams = useSearchParams();
  const accessDenied = searchParams.get("access") === "denied";
  const deniedLevel = (searchParams.get("level") as ClientAccessLevel | null) ?? "read";
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiFetch("/api/client/dashboard");
      const json = await res.json();
      if (json.success) {
        setData(json.data);
        return;
      }
      setData(null);
      setError(json.message || "فشل تحميل البيانات");
    } catch {
      setData(null);
      setError("لا يمكن الاتصال بخادم API — تأكد من تشغيل api_project");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return <div className="tbl-empty">جاري تحميل لوحة التحكم...</div>;
  }

  if (error || !data) {
    return (
      <div
        className="card"
        style={{
          borderColor: "var(--ruby)",
          background: "var(--ruby-pale)",
          padding: 16,
          fontWeight: 600,
          color: "var(--ruby)",
        }}
      >
        {error || "فشل تحميل البيانات"}
      </div>
    );
  }

  const netPositive = data.net >= 0;

  return (
    <>
      {accessDenied ? (
        <div
          className="card"
          style={{
            marginBottom: 16,
            borderColor: "var(--ruby)",
            background: "var(--ruby-pale)",
          }}
        >
          <div style={{ fontWeight: 700, color: "var(--ruby)", marginBottom: 4 }}>
            الوصول مرفوض
          </div>
          <div style={{ fontSize: 13, color: "var(--slate)" }}>
            {permissionDeniedMessage(deniedLevel)}
          </div>
        </div>
      ) : null}
      <div className="stats-grid">
        <div className="stat-card emerald">
          <div className="stat-icon">
            <IconArrowDownCircle size={18} stroke={1.8} />
          </div>
          <div className="stat-val">{fmtAmt(data.total_donations)}</div>
          <div className="stat-lbl">إجمالي التبرعات والإيرادات (ر.س)</div>
        </div>
        <div className="stat-card ruby">
          <div className="stat-icon">
            <IconArrowUpCircle size={18} stroke={1.8} />
          </div>
          <div className="stat-val">{fmtAmt(data.total_expenses)}</div>
          <div className="stat-lbl">إجمالي المصروفات (ر.س)</div>
        </div>
        <div className="stat-card teal">
          <div className="stat-icon">
            <IconFileInvoice size={18} stroke={1.8} />
          </div>
          <div className="stat-val">{data.receipt_count}</div>
          <div className="stat-lbl">عدد سندات القبض</div>
        </div>
        <div className="stat-card gold">
          <div className="stat-icon">
            <IconFileDollar size={18} stroke={1.8} />
          </div>
          <div className="stat-val">{data.payment_count}</div>
          <div className="stat-lbl">عدد سندات الصرف</div>
        </div>
      </div>

      <div className="dash-two-col">
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <IconArrowDownCircle size={18} stroke={1.8} />
              آخر سندات القبض
            </div>
            <Link href="/client/vouchers/receipts" className="btn btn-ghost btn-sm">
              عرض الكل
            </Link>
          </div>
          {!data.recent_receipts.length ? (
            <div className="tbl-empty">
              <IconInbox size={36} stroke={1.2} style={{ opacity: 0.4 }} />
              لا توجد سندات
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>رقم</th>
                  <th>من</th>
                  <th>المبلغ</th>
                </tr>
              </thead>
              <tbody>
                {data.recent_receipts.map((item) => (
                  <tr key={item.voucher_number}>
                    <td>
                      <span className="badge badge-emerald">{item.voucher_number}</span>
                    </td>
                    <td>{item.beneficiary_name}</td>
                    <td
                      style={{
                        fontWeight: 700,
                        color: "var(--emerald)",
                        direction: "ltr",
                      }}
                    >
                      {fmtAmt(item.total_amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <IconArrowUpCircle size={18} stroke={1.8} />
              آخر سندات الصرف
            </div>
            <Link href="/client/vouchers/payments" className="btn btn-ghost btn-sm">
              عرض الكل
            </Link>
          </div>
          {!data.recent_payments.length ? (
            <div className="tbl-empty">
              <IconInbox size={36} stroke={1.2} style={{ opacity: 0.4 }} />
              لا توجد سندات
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>رقم</th>
                  <th>إلى</th>
                  <th>المبلغ</th>
                </tr>
              </thead>
              <tbody>
                {data.recent_payments.map((item) => (
                  <tr key={item.voucher_number}>
                    <td>
                      <span className="badge badge-ruby">{item.voucher_number}</span>
                    </td>
                    <td>{item.beneficiary_name}</td>
                    <td
                      style={{
                        fontWeight: 700,
                        color: "var(--ruby)",
                        direction: "ltr",
                      }}
                    >
                      {fmtAmt(item.total_amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="card" style={{ marginTop: 0 }}>
        <div className="card-header">
          <div className="card-title">
            <IconChartBar size={18} stroke={1.8} />
            ملخص الحركة المالية
          </div>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 14,
          }}
        >
          <div
            style={{
              textAlign: "center",
              padding: 16,
              background: "var(--emerald-pale)",
              borderRadius: "var(--radius-md)",
            }}
          >
            <div style={{ fontSize: 11, color: "var(--mist)", fontWeight: 700, marginBottom: 6 }}>
              إجمالي الإيرادات
            </div>
            <div
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: "var(--emerald)",
                direction: "ltr",
              }}
            >
              {fmtAmt(data.total_donations)}
            </div>
            <div style={{ fontSize: 11, color: "var(--mist)", marginTop: 2 }}>ريال سعودي</div>
          </div>
          <div
            style={{
              textAlign: "center",
              padding: 16,
              background: "var(--ruby-pale)",
              borderRadius: "var(--radius-md)",
            }}
          >
            <div style={{ fontSize: 11, color: "var(--mist)", fontWeight: 700, marginBottom: 6 }}>
              إجمالي المصروفات
            </div>
            <div
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: "var(--ruby)",
                direction: "ltr",
              }}
            >
              {fmtAmt(data.total_expenses)}
            </div>
            <div style={{ fontSize: 11, color: "var(--mist)", marginTop: 2 }}>ريال سعودي</div>
          </div>
          <div
            style={{
              textAlign: "center",
              padding: 16,
              background: netPositive ? "var(--teal-pale)" : "var(--ruby-pale)",
              borderRadius: "var(--radius-md)",
            }}
          >
            <div style={{ fontSize: 11, color: "var(--mist)", fontWeight: 700, marginBottom: 6 }}>
              صافي الفائض / العجز
            </div>
            <div
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: netPositive ? "var(--teal-dark)" : "var(--ruby)",
                direction: "ltr",
              }}
            >
              {netPositive ? "+" : ""}
              {fmtAmt(data.net)}
            </div>
            <div style={{ fontSize: 11, color: "var(--mist)", marginTop: 2 }}>
              {netPositive ? "فائض" : "عجز"}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
