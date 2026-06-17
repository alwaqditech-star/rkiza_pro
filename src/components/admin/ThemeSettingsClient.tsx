"use client";

import { useCallback, useEffect, useState } from "react";
import { IconCheck, IconPalette, IconRefresh } from "@tabler/icons-react";
import { apiFetch } from "@/lib/api-client";
import {
  DEFAULT_THEME_ID,
  THEME_PRESETS,
  type ThemeId,
} from "@/lib/theme-presets";
import { applyThemeById } from "@/lib/theme";
import { notifyApiResult } from "@/lib/notify";
import { useToast } from "@/components/ui/ToastProvider";
import { AppPage, PageHero } from "@/components/ui/PageHero";

export function ThemeSettingsClient() {
  const toast = useToast();
  const [selectedId, setSelectedId] = useState<ThemeId>(DEFAULT_THEME_ID);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadTheme = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiFetch("/api/admin/theme");
      const json = await res.json();
      if (json.success && json.data?.themeId) {
        setSelectedId(json.data.themeId);
        applyThemeById(json.data.themeId);
      }
    } catch {
      setError("تعذر تحميل إعدادات المظهر");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTheme();
  }, [loadTheme]);

  async function handleSelect(themeId: ThemeId) {
    setSelectedId(themeId);
    applyThemeById(themeId);
    setSaving(true);
    setError("");

    try {
      const res = await apiFetch("/api/admin/theme", {
        method: "PUT",
        body: JSON.stringify({ themeId }),
      });
      const json = await res.json();
      if (!notifyApiResult(toast, json, { success: "تم تطبيق المظهر بنجاح", error: "فشل حفظ المظهر" })) {
        return;
      }
    } catch {
      toast.error("خطأ في الاتصال بالخادم");
      setError("خطأ في الاتصال بالخادم");
    } finally {
      setSaving(false);
    }
  }

  async function handleReset() {
    await handleSelect(DEFAULT_THEME_ID);
  }

  return (
    <AppPage>
      <PageHero
        kicker="إعدادات النظام"
        title="إعدادات ألوان النظام"
        description="اختر نموذج الألوان المطبق على لوحة المدير ولوحة الجمعيات"
        actions={
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => void handleReset()}
            disabled={saving || loading}
          >
            <IconRefresh size={14} />
            استعادة الافتراضي
          </button>
        }
      />

      <div className="card">
      {error ? <div className="page-alert error">{error}</div> : null}

      <div className="settings-section">
        <div className="settings-section-title">اختر نموذج الألوان</div>
        <p style={{ fontSize: 13, color: "var(--mist)", marginBottom: 16, lineHeight: 1.7 }}>
          يُطبَّق المظهر المختار على لوحة المدير، لوحة الجمعيات، وشاشة الدخول لجميع
          المستخدمين.
        </p>

        {loading ? (
          <div className="tbl-empty">جاري التحميل...</div>
        ) : (
          <div className="theme-grid">
            {THEME_PRESETS.map((preset) => {
              const active = preset.id === selectedId;
              return (
                <button
                  key={preset.id}
                  type="button"
                  className={`theme-card${active ? " active" : ""}`}
                  onClick={() => void handleSelect(preset.id)}
                  disabled={saving}
                >
                  <div className="theme-card-swatches">
                    {preset.swatches.map((color) => (
                      <span
                        key={color}
                        className="theme-swatch"
                        style={{ background: color }}
                      />
                    ))}
                  </div>
                  <div className="theme-card-body">
                    <div className="theme-card-title">{preset.name}</div>
                    <div className="theme-card-desc">{preset.description}</div>
                  </div>
                  {active ? (
                    <span className="theme-card-check">
                      <IconCheck size={16} stroke={2.2} />
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        )}
      </div>
      </div>
    </AppPage>
  );
}
