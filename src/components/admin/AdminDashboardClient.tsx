"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  IconAlertTriangle,
  IconArrowLeft,
  IconBuildingCommunity,
  IconCircleCheck,
  IconLayoutDashboard,
  IconPalette,
  IconRefresh,
  IconSparkles,
  IconUserCircle,
  IconUsers,
} from "@tabler/icons-react";
import { apiFetch } from "@/lib/api-client";

interface Association {
  id: number;
  association_name: string;
  username: string;
  subscription_start: string;
  subscription_end: string;
  status: "active" | "expired";
  days_remaining: number;
  subscription_alert: boolean;
  is_first_login: boolean;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("ar-SA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function subscriptionProgress(assoc: Association) {
  const start = new Date(assoc.subscription_start).getTime();
  const end = new Date(assoc.subscription_end).getTime();
  const total = Math.max(1, Math.round((end - start) / 86400000));
  return Math.min(100, Math.max(0, Math.round((assoc.days_remaining / total) * 100)));
}

function orgInitial(name: string) {
  return (name.trim().charAt(0) || "ج").toUpperCase();
}

export function AdminDashboardClient() {
  const [associations, setAssociations] = useState<Association[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiFetch("/api/admin/associations");
      const json = await res.json();
      if (!json.success) {
        setError(json.message || "فشل تحميل البيانات");
        return;
      }
      setAssociations(json.data);
    } catch {
      setError("خطأ في الاتصال بالخادم");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const stats = useMemo(() => {
    const total = associations.length;
    const active = associations.filter((a) => a.status === "active").length;
    const expiringSoon = associations.filter((a) => a.subscription_alert).length;
    const expired = total - active;
    const healthy = associations.filter(
      (a) => a.status === "active" && !a.subscription_alert,
    ).length;
    const pendingFirstLogin = associations.filter((a) => a.is_first_login).length;
    const activeRate = total ? Math.round((active / total) * 100) : 0;

    return {
      total,
      active,
      expiringSoon,
      expired,
      healthy,
      pendingFirstLogin,
      activeRate,
      healthyPct: total ? Math.round((healthy / total) * 100) : 0,
      expiringPct: total ? Math.round((expiringSoon / total) * 100) : 0,
    };
  }, [associations]);

  const urgentList = useMemo(
    () =>
      [...associations]
        .filter((a) => a.subscription_alert || a.status === "expired")
        .sort((a, b) => a.days_remaining - b.days_remaining)
        .slice(0, 4),
    [associations],
  );

  const todayLabel = new Date().toLocaleDateString("ar-SA", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const quickLinks = [
    {
      href: "/admin/subscribers",
      label: "إدارة المشتركين",
      desc: "إضافة وتجديد الاشتراكات",
      icon: IconUsers,
      tone: "teal",
    },
    {
      href: "/admin/theme",
      label: "ألوان النظام",
      desc: "تخصيص مظهر التطبيق",
      icon: IconPalette,
      tone: "gold",
    },
    {
      href: "/admin/profile",
      label: "الملف الشخصي",
      desc: "بيانات حساب المدير",
      icon: IconUserCircle,
      tone: "emerald",
    },
    {
      href: "/admin/subscribers",
      label: "تقارير المشتركين",
      desc: "تصدير Excel و PDF",
      icon: IconLayoutDashboard,
      tone: "ruby",
    },
  ];

  return (
    <div className="admin-dash">
      <section className="admin-dash-hero">
        <div className="admin-dash-hero-blob admin-dash-hero-blob-a" />
        <div className="admin-dash-hero-blob admin-dash-hero-blob-b" />
        <div className="admin-dash-hero-inner">
          <div className="admin-dash-hero-text">
            <span className="admin-dash-hero-kicker">
              <IconSparkles size={14} stroke={1.8} />
              لوحة مدير النظام
            </span>
            <h2>مرحباً بك في مركز قيادة ركاز</h2>
            <p>{todayLabel}</p>
          </div>
          <div className="admin-dash-hero-actions">
            <button
              type="button"
              className="btn btn-sm admin-dash-refresh"
              onClick={() => void loadData()}
              disabled={loading}
            >
              <IconRefresh size={15} stroke={1.8} className={loading ? "spin" : undefined} />
              تحديث
            </button>
            <Link href="/admin/subscribers" className="btn btn-sm admin-dash-hero-cta">
              <IconUsers size={15} stroke={1.8} />
              إدارة المشتركين
            </Link>
          </div>
        </div>
      </section>

      <div className="admin-dash-stat-grid">
        <article className="admin-dash-stat admin-dash-stat-teal">
          <div className="admin-dash-stat-top">
            <span className="admin-dash-stat-icon">
              <IconBuildingCommunity size={22} stroke={1.6} />
            </span>
            <span className="admin-dash-stat-chip">{stats.activeRate}% نشط</span>
          </div>
          <strong>{stats.total}</strong>
          <span>إجمالي الجمعيات</span>
        </article>

        <article className="admin-dash-stat admin-dash-stat-emerald">
          <div className="admin-dash-stat-top">
            <span className="admin-dash-stat-icon">
              <IconCircleCheck size={22} stroke={1.6} />
            </span>
          </div>
          <strong>{stats.active}</strong>
          <span>اشتراكات نشطة</span>
        </article>

        <article className="admin-dash-stat admin-dash-stat-gold">
          <div className="admin-dash-stat-top">
            <span className="admin-dash-stat-icon">
              <IconAlertTriangle size={22} stroke={1.6} />
            </span>
          </div>
          <strong>{stats.expiringSoon}</strong>
          <span>تنتهي خلال 60 يوماً</span>
        </article>

        <article className="admin-dash-stat admin-dash-stat-ruby">
          <div className="admin-dash-stat-top">
            <span className="admin-dash-stat-icon">
              <IconUsers size={22} stroke={1.6} />
            </span>
          </div>
          <strong>{stats.pendingFirstLogin}</strong>
          <span>بانتظار أول دخول</span>
        </article>
      </div>

      <div className="admin-dash-layout">
        <section className="card admin-dash-panel">
          <div className="card-header">
            <div className="card-title">
              <IconLayoutDashboard size={18} stroke={1.8} />
              اختصارات سريعة
            </div>
          </div>
          <div className="admin-dash-actions">
            {quickLinks.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={`admin-dash-action admin-dash-action-${item.tone}`}
              >
                <span className="admin-dash-action-icon">
                  <item.icon size={20} stroke={1.7} />
                </span>
                <span className="admin-dash-action-text">
                  <strong>{item.label}</strong>
                  <small>{item.desc}</small>
                </span>
                <IconArrowLeft size={16} stroke={1.8} className="admin-dash-action-arrow" />
              </Link>
            ))}
          </div>
        </section>

        <section className="card admin-dash-panel admin-dash-health">
          <div className="card-header">
            <div className="card-title">
              <IconChartHealthIcon />
              صحة الاشتراكات
            </div>
          </div>
          <div className="admin-dash-health-body">
            <div
              className="admin-dash-donut"
              style={{
                background: `conic-gradient(
                  var(--emerald) 0 ${stats.healthyPct}%,
                  var(--gold) ${stats.healthyPct}% ${stats.healthyPct + stats.expiringPct}%,
                  var(--ruby) ${stats.healthyPct + stats.expiringPct}% 100%
                )`,
              }}
            >
              <div className="admin-dash-donut-hole">
                <strong>{stats.total}</strong>
                <span>جمعية</span>
              </div>
            </div>
            <ul className="admin-dash-legend">
              <li><i className="dot emerald" />سليم — {stats.healthy}</li>
              <li><i className="dot gold" />ينتهي قريباً — {stats.expiringSoon}</li>
              <li><i className="dot ruby" />منتهي — {stats.expired}</li>
            </ul>
          </div>
        </section>
      </div>

      {urgentList.length > 0 ? (
        <section className="admin-dash-alerts">
          <div className="admin-dash-alerts-head">
            <IconAlertTriangle size={18} stroke={1.8} />
            <span>تنبيهات تحتاج متابعة</span>
          </div>
          <div className="admin-dash-alerts-grid">
            {urgentList.map((assoc) => (
              <div
                key={assoc.id}
                className={`admin-dash-alert-item${assoc.status === "expired" ? " expired" : ""}`}
              >
                <div className="admin-dash-alert-org">{orgInitial(assoc.association_name)}</div>
                <div>
                  <strong>{assoc.association_name}</strong>
                  <p>
                    {assoc.status === "expired"
                      ? "الاشتراك منتهٍ"
                      : `متبقي ${assoc.days_remaining} يوم`}
                  </p>
                </div>
                <Link href="/admin/subscribers" className="btn btn-ghost btn-sm">
                  متابعة
                </Link>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="card admin-dash-table-card">
        <div className="card-header">
          <div className="card-title">
            <IconBuildingCommunity size={18} stroke={1.8} />
            الجمعيات المشتركة
          </div>
          <Link href="/admin/subscribers" className="btn btn-ghost btn-sm">
            إدارة الكل
            <IconArrowLeft size={14} />
          </Link>
        </div>

        {error ? (
          <div className="admin-dash-error">{error}</div>
        ) : null}

        <div className="tbl-wrap admin-dash-table-wrap">
          <table className="admin-dash-table">
            <thead>
              <tr>
                <th>الجمعية</th>
                <th>اسم المستخدم</th>
                <th>فترة الاشتراك</th>
                <th>المتبقي</th>
                <th>الحالة</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="tbl-empty">
                    جاري التحميل...
                  </td>
                </tr>
              ) : associations.length === 0 ? (
                <tr>
                  <td colSpan={5} className="tbl-empty">
                    <IconBuildingCommunity size={36} stroke={1.2} />
                    لا توجد جمعيات مسجلة
                  </td>
                </tr>
              ) : (
                associations.map((assoc) => {
                  const progress = subscriptionProgress(assoc);
                  return (
                    <tr
                      key={assoc.id}
                      className={assoc.subscription_alert ? "row-alert" : undefined}
                    >
                      <td>
                        <div className="admin-org-cell">
                          <span className="admin-org-avatar">{orgInitial(assoc.association_name)}</span>
                          <span>
                            <strong>{assoc.association_name}</strong>
                            {assoc.is_first_login ? (
                              <small className="admin-org-tag">أول دخول</small>
                            ) : null}
                          </span>
                        </div>
                      </td>
                      <td className="admin-username-cell">{assoc.username}</td>
                      <td>
                        <div className="admin-period">
                          <span>{formatDate(assoc.subscription_start)}</span>
                          <span className="admin-period-sep">←</span>
                          <span>{formatDate(assoc.subscription_end)}</span>
                        </div>
                      </td>
                      <td>
                        <div className="admin-progress-wrap">
                          <div className="admin-progress-bar">
                            <div
                              className={`admin-progress-fill${assoc.subscription_alert ? " warn" : ""}${assoc.status === "expired" ? " danger" : ""}`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <span
                            className={`badge ${
                              assoc.subscription_alert
                                ? "badge-ruby"
                                : assoc.days_remaining <= 90
                                  ? "badge-gold"
                                  : "badge-emerald"
                            }`}
                          >
                            {assoc.days_remaining} يوم
                          </span>
                        </div>
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            assoc.status === "active" ? "badge-emerald" : "badge-ruby"
                          }`}
                        >
                          {assoc.status === "active" ? "نشط" : "منتهي"}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function IconChartHealthIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 19V5M9 19V11M14 19V8M19 19V4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
