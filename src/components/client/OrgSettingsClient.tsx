"use client";
import { apiFetch } from "@/lib/api-client";
import { resolveMediaUrl } from "@/lib/media-url";

import { useCallback, useEffect, useState } from "react";
import {
  IconBuildingCommunity,
  IconCertificate,
  IconCheck,
  IconIdBadge,
  IconPhoto,
  IconSettings,
} from "@tabler/icons-react";
import type { AssociationSettings } from "@/lib/types";
import { isFutureDate } from "@/lib/format";
import { notifyApiResult } from "@/lib/notify";
import { useToast } from "@/components/ui/ToastProvider";
import { AppPage, PageHero } from "@/components/ui/PageHero";
import { DateInput } from "@/components/ui/DateInputs";

const emptySettings = (): AssociationSettings => ({
  association_id: 0,
  association_name: "",
  name_en: null,
  cr_number: null,
  license_number: null,
  founded_date: null,
  city: null,
  address: null,
  phone: null,
  email: null,
  website: null,
  description: null,
  fiscal_year_start: 1,
  current_fiscal_year: new Date().getFullYear(),
  currency: "SAR",
  journal_seq_start: 1,
  stamp_url: null,
  logo_url: null,
});

export function OrgSettingsClient() {
  const toast = useToast();
  const [form, setForm] = useState<AssociationSettings>(emptySettings());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [stampFile, setStampFile] = useState<File | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/api/client/org-settings");
      const json = await res.json();
      if (json.success) setForm({ ...emptySettings(), ...json.data });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  function updateField<K extends keyof AssociationSettings>(key: K, value: AssociationSettings[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    if (form.founded_date && isFutureDate(form.founded_date)) {
      toast.warning("لا يمكن اختيار تاريخ تأسيس مستقبلي");
      return;
    }
    setSaving(true);
    try {
      const payload = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (value !== null && value !== undefined) payload.append(key, String(value));
      });
      if (stampFile) payload.append("stamp", stampFile);
      if (logoFile) payload.append("logo", logoFile);

      const res = await apiFetch("/api/client/org-settings", { method: "PUT", body: payload });
      const json = await res.json();
      if (notifyApiResult(toast, json, { success: "تم حفظ بيانات الجمعية بنجاح", error: "فشل الحفظ" })) {
        if (json.data) {
          setForm({ ...emptySettings(), ...json.data });
          setStampFile(null);
          setLogoFile(null);
        }
      }
    } catch {
      toast.error("خطأ في الاتصال بالخادم");
    } finally {
      setSaving(false);
    }
  }

  const stampPreview = stampFile ? URL.createObjectURL(stampFile) : resolveMediaUrl(form.stamp_url);
  const logoPreview = logoFile ? URL.createObjectURL(logoFile) : resolveMediaUrl(form.logo_url);

  return (
    <AppPage>
      <PageHero
        kicker="إعدادات الجمعية"
        title="بيانات الجمعية"
        description="تحديث الهوية المؤسسية وبيانات التواصل والإعدادات العامة"
        actions={
          <button type="button" className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
            <IconCheck size={14} />
            {saving ? "جاري الحفظ..." : "حفظ البيانات"}
          </button>
        }
      />

      <div className="card">
      {loading ? (
        <div className="tbl-empty">جاري التحميل...</div>
      ) : (
        <>
          <div className="settings-section">
            <div className="settings-section-title">
              <IconIdBadge size={14} />
              المعلومات الأساسية
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label>اسم الجمعية (عربي)</label>
                <input
                  value={form.association_name}
                  onChange={(e) => updateField("association_name", e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>اسم الجمعية (إنجليزي)</label>
                <input
                  value={form.name_en ?? ""}
                  onChange={(e) => updateField("name_en", e.target.value || null)}
                />
              </div>
              <div className="form-group">
                <label>رقم السجل التجاري</label>
                <input
                  value={form.cr_number ?? ""}
                  onChange={(e) => updateField("cr_number", e.target.value || null)}
                />
              </div>
              <div className="form-group">
                <label>رقم الترخيص</label>
                <input
                  value={form.license_number ?? ""}
                  onChange={(e) => updateField("license_number", e.target.value || null)}
                />
              </div>
              <div className="form-group">
                <label>تاريخ التأسيس</label>
                <DateInput
                  value={form.founded_date ?? ""}
                  onChange={(e) => updateField("founded_date", e.target.value || null)}
                />
              </div>
              <div className="form-group">
                <label>المدينة</label>
                <input value={form.city ?? ""} onChange={(e) => updateField("city", e.target.value || null)} />
              </div>
              <div className="form-group form-full">
                <label>العنوان التفصيلي</label>
                <input
                  value={form.address ?? ""}
                  onChange={(e) => updateField("address", e.target.value || null)}
                />
              </div>
              <div className="form-group">
                <label>الهاتف</label>
                <input value={form.phone ?? ""} onChange={(e) => updateField("phone", e.target.value || null)} />
              </div>
              <div className="form-group">
                <label>البريد الإلكتروني</label>
                <input
                  type="email"
                  value={form.email ?? ""}
                  onChange={(e) => updateField("email", e.target.value || null)}
                />
              </div>
              <div className="form-group">
                <label>الموقع الإلكتروني</label>
                <input
                  value={form.website ?? ""}
                  onChange={(e) => updateField("website", e.target.value || null)}
                />
              </div>
              <div className="form-group form-full">
                <label>وصف الجمعية</label>
                <textarea
                  value={form.description ?? ""}
                  onChange={(e) => updateField("description", e.target.value || null)}
                />
              </div>
            </div>
          </div>

          <div className="settings-section">
            <div className="settings-section-title">
              <IconSettings size={14} />
              إعدادات النظام المحاسبي
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label>شهر بداية السنة المالية</label>
                <select
                  value={String(form.fiscal_year_start)}
                  onChange={(e) => updateField("fiscal_year_start", Number(e.target.value))}
                >
                  <option value="1">يناير</option>
                  <option value="4">أبريل</option>
                  <option value="7">يوليو</option>
                  <option value="10">أكتوبر</option>
                </select>
              </div>
              <div className="form-group">
                <label>السنة المالية الحالية</label>
                <input
                  type="number"
                  min={2020}
                  max={2099}
                  value={form.current_fiscal_year}
                  onChange={(e) => updateField("current_fiscal_year", Number(e.target.value))}
                />
              </div>
              <div className="form-group">
                <label>العملة</label>
                <select
                  value={form.currency}
                  onChange={(e) => updateField("currency", e.target.value)}
                >
                  <option value="SAR">ريال سعودي (SAR)</option>
                  <option value="USD">دولار أمريكي (USD)</option>
                  <option value="AED">درهم إماراتي (AED)</option>
                </select>
              </div>
              <div className="form-group">
                <label>تسلسل ترقيم القيود</label>
                <input
                  type="number"
                  min={1}
                  value={form.journal_seq_start}
                  onChange={(e) => updateField("journal_seq_start", Number(e.target.value))}
                />
              </div>
            </div>
          </div>

          <div className="settings-section">
            <div className="settings-section-title">
              <IconCertificate size={14} />
              الختم والشعار
            </div>
            <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--slate)", marginBottom: 6 }}>
                  ختم الجمعية
                </div>
                <label className="stamp-preview" style={{ cursor: "pointer" }}>
                  {stampPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={stampPreview} alt="ختم الجمعية" style={{ maxWidth: "100%", maxHeight: 120 }} />
                  ) : (
                    <div style={{ textAlign: "center" }}>
                      <IconCertificate size={24} style={{ display: "block", margin: "0 auto 4px" }} />
                      انقر لرفع الختم
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={(e) => setStampFile(e.target.files?.[0] ?? null)}
                  />
                </label>
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--slate)", marginBottom: 6 }}>
                  شعار الجمعية
                </div>
                <label className="stamp-preview" style={{ cursor: "pointer", borderRadius: 10 }}>
                  {logoPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={logoPreview} alt="شعار الجمعية" style={{ maxWidth: "100%", maxHeight: 120 }} />
                  ) : (
                    <div style={{ textAlign: "center" }}>
                      <IconPhoto size={24} style={{ display: "block", margin: "0 auto 4px" }} />
                      انقر لرفع الشعار
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)}
                  />
                </label>
              </div>
            </div>
          </div>
        </>
      )}
      </div>
    </AppPage>
  );
}
