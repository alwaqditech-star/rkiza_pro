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
      setError("تعذّر الاتصال بخادم API — تحقق من rkiza-api.vercel.app");
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

      <section className="page-hero">
        <div>
          <span className="page-hero-kicker">لوحة الجمعية</span>
          <h2>نظرة عامة على الأداء المالي</h2>
          <p>متابعة الإيرادات والمصروفات وسندات القبض والصرف</p>
        </div>
        <div className="page-hero-stat">
          <strong>{fmtAmt(data.net)}</strong>
          <span>صافي {netPositive ? "الفائض" : "العجز"} (ر.س)</span>
        </div>
      </section>

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
        <div className="summary-tiles">
          <div className="summary-tile emerald">
            <div className="summary-tile-label">إجمالي الإيرادات</div>
            <div className="summary-tile-value">{fmtAmt(data.total_donations)}</div>
            <div className="summary-tile-note">ريال سعودي</div>
          </div>
          <div className="summary-tile ruby">
            <div className="summary-tile-label">إجمالي المصروفات</div>
            <div className="summary-tile-value">{fmtAmt(data.total_expenses)}</div>
            <div className="summary-tile-note">ريال سعودي</div>
          </div>
          <div className={`summary-tile ${netPositive ? "teal" : "ruby"}`}>
            <div className="summary-tile-label">صافي الفائض / العجز</div>
            <div className="summary-tile-value">
              {netPositive ? "+" : ""}
              {fmtAmt(data.net)}
            </div>
            <div className="summary-tile-note">{netPositive ? "فائض" : "عجز"}</div>
          </div>
        </div>
      </div>
    </>
  );
}
