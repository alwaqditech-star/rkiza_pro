"use client";

import { useState } from "react";
import { IconDownload, IconFileTypePdf } from "@tabler/icons-react";
import { downloadExportFile } from "@/lib/client-download";
import { useToast } from "@/components/ui/ToastProvider";

interface ReportExportButtonsProps {
  buildExportUrl: (format: "excel" | "pdf") => string;
  buildFilename: (extension: "xlsx" | "pdf") => string;
  disabled?: boolean;
}

export function ReportExportButtons({
  buildExportUrl,
  buildFilename,
  disabled = false,
}: ReportExportButtonsProps) {
  const toast = useToast();
  const [exportingExcel, setExportingExcel] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);

  async function handleExport(format: "excel" | "pdf") {
    const setLoading = format === "excel" ? setExportingExcel : setExportingPdf;
    setLoading(true);
    try {
      const extension = format === "excel" ? "xlsx" : "pdf";
      await downloadExportFile(buildExportUrl(format), buildFilename(extension));
      toast.success(format === "excel" ? "تم تصدير Excel بنجاح" : "تم تصدير PDF بنجاح");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطأ في التصدير");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      <button
        type="button"
        className="btn btn-sm btn-ghost"
        disabled={disabled || exportingExcel || exportingPdf}
        onClick={() => handleExport("excel")}
      >
        <IconDownload size={16} stroke={1.8} />
        {exportingExcel ? "جاري التصدير..." : "تصدير Excel"}
      </button>
      <button
        type="button"
        className="btn btn-primary btn-sm"
        disabled={disabled || exportingExcel || exportingPdf}
        onClick={() => handleExport("pdf")}
      >
        <IconFileTypePdf size={16} stroke={1.8} />
        {exportingPdf ? "جاري التصدير..." : "تصدير PDF"}
      </button>
    </div>
  );
}
