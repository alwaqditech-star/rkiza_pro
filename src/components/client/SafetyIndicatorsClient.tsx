"use client";
import { apiFetch, apiUrl } from "@/lib/api-client";

import { Fragment, useCallback, useEffect, useState } from "react";
import {
  IconCalculator,
  IconChartBar,
  IconCheck,
  IconChevronLeft,
  IconMinus,
  IconShieldCheck,
  IconWand,
  IconX,
} from "@tabler/icons-react";
import {
  calcSafetyFromInput,
  type SafetyCalculationResult,
} from "@/lib/safety-indicators";
import type { SafetyFinancialInput } from "@/lib/types";
import { useClientPermissions } from "./ClientPermissionsContext";
import { AppPage, PageHero } from "@/components/ui/PageHero";

const emptyInput = (year: number): SafetyFinancialInput => ({
  association_id: 0,
  fiscal_year: year,
  total_expenses: 0,
  admin_expenses: 0,
  program_expenses: 0,
  activity_admin_expenses: 0,
  total_activity_expenses: 0,
  sustainability_returns: 0,
  sustainability_expenses: 0,
  sustainability_assets: 0,
  total_donations: 0,
  fundraising_expenses: 0,
  cash_equivalents: 0,
  net_restricted_assets: 0,
  net_endowment_cash: 0,
  current_liabilities: 0,
  net_current_cash_investments: 0,
  estimated_annual_admin_expenses: 0,
});

export function SafetyIndicatorsClient() {
  const { canWrite } = useClientPermissions();
  const fiscalYear = new Date().getFullYear();
  const [input, setInput] = useState<SafetyFinancialInput>(emptyInput(fiscalYear));
  const [results, setResults] = useState<SafetyCalculationResult | null>(null);
  const [loading, setLoading] = useState(true);

  const recalc = useCallback((nextInput: SafetyFinancialInput) => {
    setResults(calcSafetyFromInput(nextInput));
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`/api/client/indicators?fiscal_year=${fiscalYear}`);
      const json = await res.json();
      const nextInput = json.success && json.data.input
        ? { ...emptyInput(fiscalYear), ...json.data.input }
        : emptyInput(fiscalYear);
      setInput(nextInput);
      setResults(json.data?.results ?? calcSafetyFromInput(nextInput));
    } finally {
      setLoading(false);
    }
  }, [fiscalYear]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function updateField(field: keyof SafetyFinancialInput, value: string) {
    const next = { ...input, [field]: Number(value || 0) };
    setInput(next);
    recalc(next);
  }

  async function handleSave() {
    const res = await apiFetch("/api/client/indicators", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const json = await res.json();
    if (json.success) {
      setResults(json.data.results);
    }
  }

  async function autoFill() {
    const dashRes = await apiFetch("/api/client/dashboard");
    const dashJson = await dashRes.json();
    if (!dashJson.success) return;

    const next = {
      ...input,
      total_donations: dashJson.data.total_donations,
      total_expenses: dashJson.data.total_expenses,
      admin_expenses: dashJson.data.total_expenses * 0.15,
      program_expenses: dashJson.data.total_expenses * 0.7,
      estimated_annual_admin_expenses: dashJson.data.total_expenses * 0.15,
    };
    setInput(next);
    recalc(next);
  }

  const colorMap = {
    excellent: "var(--emerald)",
    good: "var(--teal)",
    medium: "var(--gold)",
    poor: "var(--ruby)",
  };

  return (
    <AppPage>
      <PageHero
        kicker="الحوكمة المالية"
        title="مؤشرات السلامة المالية"
        description="نموذج احتساب نسب معيار السلامة المالية للجمعيات — 11 مؤشراً على 5 محاور"
        variant="slate"
        stat={
          results
            ? { value: `${results.pct}%`, label: results.scoreLabel }
            : undefined
        }
      />

      {results ? (
        <div className="safety-score-card">
          <div className={`score-ring ${results.scoreClass}`}>
            <span style={{ lineHeight: 1 }}>{results.pct}%</span>
            <span style={{ fontSize: 11, fontWeight: 700, marginTop: 2 }}>
              {results.scoreLabel}
            </span>
          </div>
          <div className="safety-score-body">
            <div className="safety-score-title">الدرجة الإجمالية للسلامة المالية</div>
            <div className="safety-score-bar">
              <div
                className="safety-score-fill"
                style={{
                  width: `${results.pct}%`,
                  background: colorMap[results.scoreClass],
                }}
              />
            </div>
            <div className="safety-score-meta">
              <span style={{ color: "var(--emerald)" }}>
                <IconCheck size={14} style={{ display: "inline" }} /> {results.passCount} محققة
              </span>
              <span style={{ color: "var(--ruby)" }}>
                <IconX size={14} style={{ display: "inline" }} /> {results.failCount} غير محققة
              </span>
              {results.naCount > 0 ? (
                <span style={{ color: "var(--mist)" }}>
                  <IconMinus size={14} style={{ display: "inline" }} /> {results.naCount} لا تنطبق
                </span>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      <div className="card">
        <div className="card-toolbar">
          <div className="card-section-title">
            <IconCalculator size={18} stroke={1.8} />
            المدخلات المالية
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {canWrite ? (
              <>
                <button type="button" className="btn btn-ghost btn-sm" onClick={autoFill}>
                  <IconWand size={14} />
                  استيراد من البرنامج
                </button>
                <button type="button" className="btn btn-primary btn-sm" onClick={handleSave}>
                  <IconChartBar size={14} />
                  احتساب وحفظ
                </button>
              </>
            ) : null}
          </div>
        </div>

        {loading ? (
          <div className="tbl-empty">جاري التحميل...</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div>
              <div className="settings-section-title">
                <IconCalculator size={14} />
                المصاريف
              </div>
              {[
                ["total_expenses", "إجمالي المصاريف (ر.س)"],
                ["admin_expenses", "المصاريف الإدارية (ر.س)"],
                ["program_expenses", "مصاريف البرامج والأنشطة (ر.س)"],
                ["activity_admin_expenses", "المصاريف الإدارية للنشاط (ر.س)"],
                ["total_activity_expenses", "إجمالي مصاريف النشاط (ر.س)"],
              ].map(([field, label]) => (
                <div className="form-group" style={{ marginBottom: 10 }} key={field}>
                  <label>{label}</label>
                  <input
                    type="number"
                    step="0.01"
                    value={input[field as keyof SafetyFinancialInput] as number}
                    onChange={(e) =>
                      updateField(field as keyof SafetyFinancialInput, e.target.value)
                    }
                  />
                </div>
              ))}
            </div>

            <div>
              <div
                className="settings-section-title"
                style={{ color: "var(--gold)", background: "var(--gold-pale)" }}
              >
                الاستدامة المالية (أوقاف/استثمارات)
              </div>
              {[
                ["sustainability_returns", "عوائد الاستدامة المالية (ر.س)"],
                ["sustainability_expenses", "مصاريف الاستدامة (ر.س)"],
                ["sustainability_assets", "إجمالي أصول الاستدامة (ر.س)"],
              ].map(([field, label]) => (
                <div className="form-group" style={{ marginBottom: 10 }} key={field}>
                  <label>{label}</label>
                  <input
                    type="number"
                    step="0.01"
                    value={input[field as keyof SafetyFinancialInput] as number}
                    onChange={(e) =>
                      updateField(field as keyof SafetyFinancialInput, e.target.value)
                    }
                  />
                </div>
              ))}

              <div
                className="settings-section-title"
                style={{
                  color: "var(--emerald)",
                  background: "var(--emerald-pale)",
                  marginTop: 14,
                }}
              >
                جمع الأموال والتبرعات
              </div>
              {[
                ["total_donations", "إجمالي التبرعات (ر.س)"],
                ["fundraising_expenses", "مصاريف جمع الأموال (ر.س)"],
              ].map(([field, label]) => (
                <div className="form-group" style={{ marginBottom: 10 }} key={field}>
                  <label>{label}</label>
                  <input
                    type="number"
                    step="0.01"
                    value={input[field as keyof SafetyFinancialInput] as number}
                    onChange={(e) =>
                      updateField(field as keyof SafetyFinancialInput, e.target.value)
                    }
                  />
                </div>
              ))}
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <div
                className="settings-section-title"
                style={{ color: "var(--ruby)", background: "var(--ruby-pale)" }}
              >
                السيولة والالتزامات
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                {[
                  ["cash_equivalents", "النقد وما في حكمه (ر.س)"],
                  ["net_restricted_assets", "صافي الأصول المقيدة (ر.س)"],
                  ["net_endowment_cash", "صافي أصول الأوقاف النقدية (ر.س)"],
                  ["current_liabilities", "الالتزامات المتداولة (ر.س)"],
                  ["net_current_cash_investments", "صافي النقد والاستثمارات المتداولة (ر.س)"],
                  ["estimated_annual_admin_expenses", "المصاريف الإدارية التقديرية السنوية (ر.س)"],
                ].map(([field, label]) => (
                  <div className="form-group" key={field}>
                    <label>{label}</label>
                    <input
                      type="number"
                      step="0.01"
                      value={input[field as keyof SafetyFinancialInput] as number}
                      onChange={(e) =>
                        updateField(field as keyof SafetyFinancialInput, e.target.value)
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {results ? (
        <div id="safety-results">
          {results.axes.map((axis) => (
            <div className="sf-axis" key={axis.id}>
              <div
                className="sf-axis-head"
                style={{ background: axis.bg, color: axis.color }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <IconChevronLeft size={14} />
                  {axis.name}
                  <span
                    style={{
                      background: "rgba(255,255,255,.5)",
                      padding: "2px 10px",
                      borderRadius: 12,
                      fontSize: 11,
                    }}
                  >
                    وزن {Math.round(axis.weight * 100)}%
                  </span>
                </div>
                <div style={{ fontSize: 13, fontWeight: 700 }}>
                  {Math.round(axis.axisPct * 100)}%
                </div>
              </div>
              {axis.indicators.map((ind) => (
                <div className="sf-indicator" key={ind.id}>
                  <div
                    className={`sf-check ${ind.pass === true ? "pass" : ind.pass === false ? "fail" : "na"}`}
                  >
                    {ind.pass === true ? "✓" : ind.pass === false ? "✕" : "—"}
                  </div>
                  <div className="sf-name">{ind.name}</div>
                  <div className="sf-val">
                    {ind.val !== null ? `${ind.val.toFixed(2)} ${ind.unit}` : "—"}
                  </div>
                  <div className={`sf-condition ${ind.pass === true ? "pass" : ind.pass === false ? "fail" : ""}`}>
                    {ind.cond} {ind.limit}
                    {ind.unit}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      ) : null}
    </AppPage>
  );
}
