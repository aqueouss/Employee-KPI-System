"use client";

import { useState } from "react";
import { Download, FileSpreadsheet } from "lucide-react";

import { MonthlyAttendanceReportDocument } from "@/components/reports/monthly-attendance-report-document";
import { MonthlyPayrollReportDocument } from "@/components/reports/monthly-payroll-report-document";
import { Button } from "@/components/ui/button";
import { generateReportPdf } from "@/lib/reports/generate-report-pdf";
import type { MonthlyAttendanceExport } from "@/lib/reports/load-monthly-attendance-export";
import type { MonthlyPayrollExport } from "@/lib/reports/load-monthly-payroll-export";

export function MonthlyAttendanceExportButtons({
  monthStart,
}: {
  monthStart: string;
}) {
  const [isGenerating, setIsGenerating] = useState(false);
  const monthKey = monthStart.slice(0, 7);

  async function handlePdfDownload() {
    if (isGenerating) return;
    setIsGenerating(true);

    try {
      const response = await fetch(
        `/api/admin/export/attendance?month=${monthStart}&format=json`,
      );
      if (!response.ok) throw new Error("Failed to load attendance report.");

      const report = (await response.json()) as MonthlyAttendanceExport;
      await generateReportPdf(
        <MonthlyAttendanceReportDocument report={report} />,
        `aqueouss-attendance-${monthKey}.pdf`,
        "landscape",
      );
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button asChild variant="outline" size="sm">
        <a href={`/api/admin/export/attendance?month=${monthStart}&format=csv`}>
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Excel
        </a>
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={isGenerating}
        onClick={handlePdfDownload}
      >
        <Download className="mr-2 h-4 w-4" />
        {isGenerating ? "Generating…" : "PDF"}
      </Button>
    </div>
  );
}

export function MonthlyPayrollExportButtons({
  monthStart,
}: {
  monthStart: string;
}) {
  const [isGenerating, setIsGenerating] = useState(false);
  const monthKey = monthStart.slice(0, 7);

  async function handlePdfDownload() {
    if (isGenerating) return;
    setIsGenerating(true);

    try {
      const response = await fetch(
        `/api/admin/export/payroll?month=${monthStart}&format=json`,
      );
      if (!response.ok) throw new Error("Failed to load payroll report.");

      const report = (await response.json()) as MonthlyPayrollExport;
      await generateReportPdf(
        <MonthlyPayrollReportDocument report={report} />,
        `aqueouss-payroll-${monthKey}.pdf`,
        "landscape",
      );
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button asChild variant="outline" size="sm">
        <a href={`/api/admin/export/payroll?month=${monthStart}&format=csv`}>
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Excel
        </a>
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={isGenerating}
        onClick={handlePdfDownload}
      >
        <Download className="mr-2 h-4 w-4" />
        {isGenerating ? "Generating…" : "PDF"}
      </Button>
    </div>
  );
}
