"use client";

import { useState } from "react";
import { createRoot } from "react-dom/client";
import { Download } from "lucide-react";

import { PayslipDocument } from "@/components/payroll/payslip-document";
import { Button } from "@/components/ui/button";
import { PAYSLIP_HEIGHT_PX, PAYSLIP_WIDTH_PX } from "@/lib/payroll/payslip.constants";
import type { PayslipData } from "@/lib/payroll/payslip.types";

function waitForRender(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });
}

function EmployeePayslipModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="payslip-modal-title"
      >
        <div className="text-center text-5xl">🧾✨</div>
        <h2
          id="payslip-modal-title"
          className="mt-3 text-center text-lg font-semibold"
        >
          Plot twist: admins hold the payslips
        </h2>
        <p className="mt-3 text-center text-sm text-muted-foreground leading-relaxed">
          We&apos;d love to hand you a PDF right now, but this button is admin-only.
          Please ask your admin nicely for your payslip — they&apos;re the ones with
          the download wand.
        </p>
        <Button type="button" className="mt-6 w-full" onClick={onClose}>
          Okay, I&apos;ll ping admin
        </Button>
      </div>
    </div>
  );
}

export function DownloadPayslipButton({
  data,
  allowDownload = true,
}: {
  data: PayslipData;
  allowDownload?: boolean;
}) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);

  async function handleDownload() {
    if (!allowDownload) {
      setShowEmployeeModal(true);
      return;
    }

    if (isGenerating) return;

    setIsGenerating(true);
    const iframe = document.createElement("iframe");
    iframe.setAttribute("aria-hidden", "true");
    iframe.style.cssText = `position:fixed;left:-10000px;top:0;width:${PAYSLIP_WIDTH_PX}px;height:${PAYSLIP_HEIGHT_PX}px;border:none;visibility:hidden;`;

    document.body.appendChild(iframe);

    const doc = iframe.contentDocument;
    if (!doc) {
      document.body.removeChild(iframe);
      setIsGenerating(false);
      return;
    }

    doc.open();
    doc.write(
      `<!DOCTYPE html><html><head><meta charset="utf-8"><style>html,body{margin:0;padding:0;background:#fff;}</style></head><body></body></html>`,
    );
    doc.close();

    const mount = doc.createElement("div");
    doc.body.appendChild(mount);

    const root = createRoot(mount);
    root.render(<PayslipDocument data={data} />);

    try {
      await waitForRender();

      const element = mount.firstElementChild as HTMLElement | null;
      if (!element) return;

      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        width: PAYSLIP_WIDTH_PX,
        height: element.offsetHeight,
        windowWidth: PAYSLIP_WIDTH_PX,
        windowHeight: element.offsetHeight,
        scrollX: 0,
        scrollY: 0,
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.92);
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

      const margin = 8;
      const pageWidth = 210 - margin * 2;
      const pageHeight = 297 - margin * 2;
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      if (imgHeight > pageHeight) {
        const scale = pageHeight / imgHeight;
        pdf.addImage(
          imgData,
          "JPEG",
          margin,
          margin,
          imgWidth * scale,
          pageHeight,
        );
      } else {
        pdf.addImage(imgData, "JPEG", margin, margin, imgWidth, imgHeight);
      }

      const slug = data.employeeName
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");
      pdf.save(`aqueouss-payslip-${slug}-${data.monthStart.slice(0, 7)}.pdf`);
    } finally {
      root.unmount();
      document.body.removeChild(iframe);
      setIsGenerating(false);
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={handleDownload}
        disabled={
          allowDownload && (isGenerating || data.payroll.net_salary === null)
        }
      >
        <Download className="mr-2 h-4 w-4" />
        {allowDownload && isGenerating ? "Generating PDF…" : "Download payslip"}
      </Button>
      {showEmployeeModal ? (
        <EmployeePayslipModal onClose={() => setShowEmployeeModal(false)} />
      ) : null}
    </>
  );
}
