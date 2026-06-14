"use client";
import { apiFetch, apiUrl } from "@/lib/api-client";

import { useCallback, useEffect, useState } from "react";
import { IconChevronDown, IconInbox, IconNotebook } from "@tabler/icons-react";
import { journalBookFilename } from "@/lib/export-filenames";
import { currentMonth, fmtAmt, fmtDate } from "@/lib/format";
import { ReportExportButtons } from "./ReportExportButtons";
import { AppPage, PageHero } from "@/components/ui/PageHero";
import { MonthInput } from "@/components/ui/DateInputs";

interface JournalLine {
  account_code: string;
  account_name: string;
  debit_amount: number;
  credit_amount: number;
  line_description: string;
}

interface JournalItem {
  id: string;
  journal_number: string;
  journal_date: string;
  description: string;
  reference: string | null;
  entry_type: string;
  lines: JournalLine[];
}

export function JournalBookClient() {
  const [month, setMonth] = useState(currentMonth());
  const [items, setItems] = useState<JournalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);

  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`/api/client/journals?month=${month}`);
      const json = await res.json();
      if (json.success) setItems(json.data);
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  return (
    <AppPage>
      <PageHero
        kicker="المحاسبة"
        title="دفتر اليومية"
        description="استعراض القيود المحاسبية المسجلة شهرياً"
        stat={{ value: items.length, label: "قيد" }}
        actions={
          <>
            <ReportExportButtons
              disabled={loading || items.length === 0}
              buildExportUrl={(format) =>
                `/api/client/journals/export-${format}?month=${encodeURIComponent(month)}`
              }
              buildFilename={(extension) => journalBookFilename(month, extension)}
            />
            <MonthInput
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="coa-search-input"
              style={{ width: "auto", minWidth: 150 }}
            />
          </>
        }
      />

      <div className="card">

      {loading ? (
        <div className="tbl-empty">جاري التحميل...</div>
      ) : items.length === 0 ? (
        <div className="tbl-empty">
          <IconInbox size={36} stroke={1.2} style={{ opacity: 0.4 }} />
          لا توجد قيود في هذا الشهر
          <div style={{ fontSize: 12, color: "var(--mist)", marginTop: 8 }}>
            تُنشأ القيود تلقائياً من سندات القبض والصرف، أو يمكن إضافتها من قيد اليومية
          </div>
        </div>
      ) : (
        items.map((item) => {
          const totalDr = item.lines.reduce((sum, line) => sum + line.debit_amount, 0);
          const totalCr = item.lines.reduce((sum, line) => sum + line.credit_amount, 0);
          const isOpen = openId === item.id;

          return (
            <div key={item.id} className="jb-entry">
              <div
                className="jb-entry-head"
                onClick={() => setOpenId(isOpen ? null : item.id)}
                onKeyDown={(e) =>
                  e.key === "Enter" && setOpenId(isOpen ? null : item.id)
                }
                role="button"
                tabIndex={0}
              >
                <div className="jb-entry-info">
                  <span className="jb-num">{item.journal_number}</span>
                  <span className="jb-desc">{item.description}</span>
                  {item.reference ? (
                    <span className="badge badge-slate" style={{ fontSize: 10 }}>
                      {item.reference}
                    </span>
                  ) : null}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span className="jb-date">{fmtDate(item.journal_date)}</span>
                  <span className="badge badge-teal" style={{ fontSize: 10 }}>
                    {item.entry_type}
                  </span>
                  <IconChevronDown
                    size={14}
                    style={{
                      color: "var(--mist)",
                      transform: isOpen ? "rotate(180deg)" : undefined,
                      transition: "transform .2s",
                    }}
                  />
                </div>
              </div>
              {isOpen ? (
                <div>
                  <table className="jb-lines-table">
                    <thead>
                      <tr>
                        <th>رقم الحساب</th>
                        <th>اسم الحساب</th>
                        <th>البيان</th>
                        <th>مدين (ر.س)</th>
                        <th>دائن (ر.س)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {item.lines.map((line, lineIndex) => (
                        <tr key={`${item.id}-${lineIndex}-${line.account_code}-${line.debit_amount}-${line.credit_amount}`}>
                          <td style={{ fontFamily: "monospace", fontSize: 11, color: "var(--mist)" }}>
                            {line.account_code}
                          </td>
                          <td
                            className={line.credit_amount > 0 ? "acc-indent" : undefined}
                            style={{ fontWeight: 600 }}
                          >
                            {line.account_name}
                          </td>
                          <td style={{ color: "var(--mist)", fontSize: 12 }}>
                            {line.line_description}
                          </td>
                          <td className="dr-val">
                            {line.debit_amount > 0 ? fmtAmt(line.debit_amount) : "—"}
                          </td>
                          <td className="cr-val">
                            {line.credit_amount > 0 ? fmtAmt(line.credit_amount) : "—"}
                          </td>
                        </tr>
                      ))}
                      <tr style={{ background: "var(--fog)", fontWeight: 700 }}>
                        <td colSpan={3} style={{ textAlign: "left", padding: "8px 14px", fontSize: 12, color: "var(--mist)" }}>
                          الإجمالي
                        </td>
                        <td className="dr-val">{fmtAmt(totalDr)}</td>
                        <td className="cr-val">{fmtAmt(totalCr)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              ) : null}
            </div>
          );
        })
      )}
      </div>
    </AppPage>
  );
}
