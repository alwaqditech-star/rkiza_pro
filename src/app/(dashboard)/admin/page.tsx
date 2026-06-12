"use client";
import { apiFetch, apiUrl } from "@/lib/api-client";

import { useCallback, useEffect, useState } from "react";
import {
  IconAlertTriangle,
  IconBuildingCommunity,
  IconCircleCheck,
  IconUsers,
} from "@tabler/icons-react";

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
  return new Date(value).toLocaleDateString("ar-SA");
}

export default function AdminDashboardPage() {
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
    loadData();
  }, [loadData]);

  const total = associations.length;
  const active = associations.filter((a) => a.status === "active").length;
  const expiringSoon = associations.filter((a) => a.subscription_alert).length;

  return (
    <>
      <div className="stats-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
        <div className="stat-card teal">
          <div className="stat-icon">
            <IconUsers size={20} stroke={1.8} />
          </div>
          <div className="stat-val">{total}</div>
          <div className="stat-lbl">إجمالي الجمعيات</div>
        </div>
        <div className="stat-card emerald">
          <div className="stat-icon">
            <IconCircleCheck size={20} stroke={1.8} />
          </div>
          <div className="stat-val">{active}</div>
          <div className="stat-lbl">اشتراكات نشطة</div>
        </div>
        <div className="stat-card ruby">
          <div className="stat-icon">
            <IconAlertTriangle size={20} stroke={1.8} />
          </div>
          <div className="stat-val">{expiringSoon}</div>
          <div className="stat-lbl">تنتهي خلال 60 يوماً</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <IconBuildingCommunity size={18} stroke={1.8} />
            الجمعيات المشتركة
          </div>
        </div>

        {error && (
          <div
            style={{
              background: "var(--ruby-pale)",
              color: "var(--ruby)",
              padding: "10px 14px",
              borderRadius: "var(--radius-sm)",
              marginBottom: 12,
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            {error}
          </div>
        )}

        <div className="tbl-wrap">
          <table>
            <thead>
              <tr>
                <th>الجمعية</th>
                <th>اسم المستخدم</th>
                <th>بداية الاشتراك</th>
                <th>نهاية الاشتراك</th>
                <th>الأيام المتبقية</th>
                <th>الحالة</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="tbl-empty">
                    جاري التحميل...
                  </td>
                </tr>
              ) : associations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="tbl-empty">
                    <IconBuildingCommunity size={36} stroke={1.2} />
                    لا توجد جمعيات مسجلة
                  </td>
                </tr>
              ) : (
                associations.map((assoc) => (
                  <tr
                    key={assoc.id}
                    className={assoc.subscription_alert ? "row-alert" : ""}
                  >
                    <td style={{ fontWeight: 600 }}>{assoc.association_name}</td>
                    <td style={{ direction: "ltr", textAlign: "right" }}>
                      {assoc.username}
                    </td>
                    <td>{formatDate(assoc.subscription_start)}</td>
                    <td>{formatDate(assoc.subscription_end)}</td>
                    <td>
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
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          assoc.status === "active"
                            ? "badge-emerald"
                            : "badge-ruby"
                        }`}
                      >
                        {assoc.status === "active" ? "نشط" : "منتهي"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
