"use client";

import type { ReactElement } from "react";
import { createRoot } from "react-dom/client";

const REPORT_WIDTH_PX = 1200;

function waitForRender(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });
}

export async function generateReportPdf(
  element: ReactElement,
  filename: string,
  orientation: "portrait" | "landscape" = "landscape",
): Promise<void> {
  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.cssText = `position:fixed;left:-10000px;top:0;width:${REPORT_WIDTH_PX}px;height:2000px;border:none;visibility:hidden;`;

  document.body.appendChild(iframe);

  const doc = iframe.contentDocument;
  if (!doc) {
    document.body.removeChild(iframe);
    throw new Error("Could not create print frame.");
  }

  doc.open();
  doc.write(
    `<!DOCTYPE html><html><head><meta charset="utf-8"><style>html,body{margin:0;padding:0;background:#fff;}</style></head><body></body></html>`,
  );
  doc.close();

  const mount = doc.createElement("div");
  doc.body.appendChild(mount);

  const root = createRoot(mount);
  root.render(element);

  try {
    await waitForRender();

    const node = mount.firstElementChild as HTMLElement | null;
    if (!node) return;

    const html2canvas = (await import("html2canvas")).default;
    const { jsPDF } = await import("jspdf");

    const canvas = await html2canvas(node, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
      width: REPORT_WIDTH_PX,
      height: node.offsetHeight,
      windowWidth: REPORT_WIDTH_PX,
      windowHeight: node.offsetHeight,
      scrollX: 0,
      scrollY: 0,
    });

    const imgData = canvas.toDataURL("image/jpeg", 0.92);
    const pdf = new jsPDF({
      orientation,
      unit: "mm",
      format: "a4",
    });

    const margin = 6;
    const pageWidth =
      (orientation === "landscape" ? 297 : 210) - margin * 2;
    const pageHeight =
      (orientation === "landscape" ? 210 : 297) - margin * 2;
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

    pdf.save(filename);
  } finally {
    root.unmount();
    document.body.removeChild(iframe);
  }
}
