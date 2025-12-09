/**
 * @module
 *
 * Void functions that trigger: 1) PDF document to download in new tab 2) copy ASCII protocol to clipboard
 */

import { FoodType, Method } from "../types";
import type { Protocol, Unit, Step } from "../types";
import { formatNumber, formatAmount } from "../utils";
import { getFoodAStepCount } from "../core/protocol";
import type { jsPDF } from 'jspdf';
import type { PDFDocument } from 'pdf-lib';
import { AsciiTable3 } from "ascii-table3";
import { protocolState } from "../state/instances";
import { generateUserHistoryPayload } from "../core/minify";

// Need global commit hash 
// And current tool version
declare const __COMMIT_HASH__: string;
declare const __VERSION_OIT_CALCULATOR__: string;

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Prepares table rows for a subset of steps (Food A or Food B).
 * Shared logic for formatting amounts and mix instructions.
 */
function buildStepRows(steps: Step[], foodType: FoodType, isLastPhase: boolean): any[] {
  return steps.map((step, index) => {
    let dailyAmountStr = `${formatAmount(step.dailyAmount, step.dailyAmountUnit)} ${step.dailyAmountUnit}`;
    let mixDetails = "N/A";

    if (step.method === Method.DILUTE) {
      const mixUnit: Unit = foodType === FoodType.SOLID ? "g" : "ml";
      mixDetails = `${formatAmount(step.mixFoodAmount!, mixUnit)} ${mixUnit} food + ${formatAmount(step.mixWaterAmount!, "ml")} ml water`;
    }

    const isLastStep = index === steps.length - 1;
    const interval = (isLastStep && isLastPhase) ? "Continue long term" : "2-4 weeks";

    return [
      step.stepIndex,
      `${formatNumber(step.targetMg, 1)} mg`,
      step.method,
      mixDetails,
      dailyAmountStr,
      interval,
    ];
  });
}

async function generateCompressedQrCode(): Promise<string | null> {
  try {
    const history = protocolState.getHistory();
    const payload = generateUserHistoryPayload(history);
    if (!payload) return null;

    const [{ default: QRCode }, { deflate }] = await Promise.all([
      import('qrcode'),
      import('pako')
    ]);

    const jsonStr = JSON.stringify(payload);
    const compressed = deflate(jsonStr);

    // Convert Uint8Array to binary string for btoa
    // Using reduce for large arrays can stack overflow, simple loop is safer here
    let binary = '';
    const len = compressed.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(compressed[i]);
    }
    const b64 = btoa(binary);

    return await QRCode.toDataURL(b64, {
      errorCorrectionLevel: 'M',
      width: 800,
      margin: 1
    });
  } catch (e) {
    console.warn("Could not generate QR code", e);
    return null;
  }
}

async function fetchReviewSheet(): Promise<ArrayBuffer> {
  const res = await fetch('/tool_assets/oit_patient_resource_terms.pdf');
  if (!res.ok) throw new Error("Failed to load review sheet PDF");
  return res.arrayBuffer();
}

// async function fetchHandout(): Promise<ArrayBuffer> {
//   const res = await fetch('/tool_assets/oit_patient_resource.pdf'); // TODO
//   if (!res.ok) throw new Error("Failed to load handout PDF");
//   return res.arrayBuffer();
// }

// ============================================
// PDF SECTION RENDERERS
// ============================================
// All renderers receive the doc and current Y, and return the new Y

function renderHeader(doc: jsPDF, y: number): number {
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Oral Immunotherapy Protocol", 40, y);
  return y + 30;
}

function renderFoodSection(doc: jsPDF, y: number, name: string, food: any, rows: any[], titleMaxWidth?: number): number {
  // Check page break before starting section
  if (y > 650) {
    doc.addPage();
    y = 40;
  }

  // Title
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");

  const splitTitle = doc.splitTextToSize(name, titleMaxWidth || 520);
  // 440 for first food A
  doc.text(splitTitle, 40, y);
  y += (20 * splitTitle.length);

  // Subtitle
  const unit = food.type === FoodType.SOLID ? "g" : "ml";
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Protein: ${formatNumber(food.gramsInServing, 2)} g per ${food.servingSize} ${unit} serving.`,
    40,
    y
  );
  y += 15;

  // Table
  (doc as any).autoTable({
    startY: y,
    head: [["Step", "Protein", "Method", "How to make mix", "Daily Amount", "Interval"]],
    body: rows,
    theme: "striped",
    headStyles: { fillColor: [220, 220, 220], textColor: [0, 0, 0], fontStyle: 'bold' },
    styles: { fontSize: 9, cellPadding: 6, overflow: 'linebreak', valign: 'middle', halign: 'left' },
    columnStyles: {
      0: { halign: 'center' },
      1: { halign: 'center' },
      2: { halign: 'center' },
    },
    margin: { left: 40, right: 40 },
  });

  return (doc as any).lastAutoTable.finalY + 20;
}

function renderNotes(doc: jsPDF, y: number, note: string): number {
  if (!note || !note.trim()) return y;

  if (y > 650) {
    doc.addPage();
    y = 40;
  }

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Notes", 40, y);
  y += 15;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  const maxWidth = 520;
  const lines = doc.splitTextToSize(note.trim(), maxWidth);

  for (const line of lines) {
    if (y > 730) {
      doc.addPage();
      y = 40;
    }
    doc.text(line, 40, y);
    y += 14;
  }
  return y;
}

function renderFooterAndQR(doc: jsPDF, qrDataUrl: string | null) {
  const pageCount = doc.internal.pages.length;
  for (let i = 1; i < pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(100);
    doc.text(`Always verify calculations before clinical use. Current tool version-hash: v${__VERSION_OIT_CALCULATOR__}-${__COMMIT_HASH__}`, 40, 772);
    doc.setTextColor(0);
  }

  if (qrDataUrl) {
    // Always on Page 1, top right
    doc.setPage(1);
    doc.addImage(qrDataUrl, 'PNG', 493, 10, 80, 80);
  }
}

// --- MAIN EXPORT FUNCTION --



/**
 * Generate a printable PDF of the current protocol using jsPDF + autoTable.
 *
 * Includes:
 * - Food A section (and Food B when present)
 * - step tables with intervals
 * - optional notes section
 * - footer disclaimer
 *
 * Opens in a new tab where possible; falls back to direct download.
 *
 * @param protocol Protocol
 * @param customNote string
 * @param JsPdfClass  - the jsPDF constructor
 * @param PdfDocClass - static class for PDFDocument
 * @returns void
 */
export async function generatePdf(protocol: Protocol | null, customNote: string, JsPdfClass: typeof jsPDF, PdfDocClass: typeof PDFDocument): Promise<void> {
  if (!protocol) return;

  try {
    // fetch
    const [reviewSheetBytes, qrDataUrl] = await Promise.all([
      fetchReviewSheet(),
      generateCompressedQrCode()
    ]);

    // Initialize PDF
    const doc: jsPDF = new JsPdfClass({ unit: "pt", format: "letter" });
    let y = 40;

    // Render Sections Sequentially
    y = renderHeader(doc, y);

    // Food A
    const foodASteps = protocol.steps.slice(0, getFoodAStepCount(protocol));
    if (foodASteps.length > 0) {
      const rows = buildStepRows(foodASteps, protocol.foodA.type, !protocol.foodB);
      y = renderFoodSection(doc, y, protocol.foodA.name, protocol.foodA, rows, 440);
    }

    // Food B
    const foodBStart = getFoodAStepCount(protocol);
    const foodBSteps = protocol.steps.slice(foodBStart);
    if (protocol.foodB && foodBSteps.length > 0) {
      const rows = buildStepRows(foodBSteps, protocol.foodB.type, true);
      y = renderFoodSection(doc, y, protocol.foodB.name, protocol.foodB, rows);
    }

    // Notes
    y = renderNotes(doc, y, customNote);

    // Footer & QR
    renderFooterAndQR(doc, qrDataUrl);

    // Merge & Download
    await handlePdfMergeAndDownload(doc, reviewSheetBytes, PdfDocClass);

  } catch (error) {
    console.error("PDF Generation Failed:", error);
    alert("An error occurred while generating the PDF.");
  }
}

async function handlePdfMergeAndDownload(doc: jsPDF, reviewSheetBytes: ArrayBuffer, PdfDocClass: typeof PDFDocument) {
  const jsPdfBytes = doc.output('arraybuffer');

  const mergedPdf = await PdfDocClass.create();
  const protocolPdf = await PdfDocClass.load(jsPdfBytes);
  const reviewSheetPdf = await PdfDocClass.load(reviewSheetBytes);

  // Copy pages
  const reviewSheetPages = await mergedPdf.copyPages(reviewSheetPdf, reviewSheetPdf.getPageIndices());
  reviewSheetPages.forEach((p) => mergedPdf.addPage(p));

  const protocolPages = await mergedPdf.copyPages(protocolPdf, protocolPdf.getPageIndices());
  protocolPages.forEach((p) => mergedPdf.addPage(p));

  const mergedPdfBytes = await mergedPdf.save();
  const blob = new Blob([mergedPdfBytes as Uint8Array<ArrayBuffer>], { type: "application/pdf" });
  const blobUrl = URL.createObjectURL(blob);

  // Mobile/Desktop handling
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || (navigator.maxTouchPoints > 0 && window.innerWidth <= 1024);

  if (isMobile) {
    // Mobile: Use download link approach for better compatibility
    const downloadLink = document.createElement("a");
    downloadLink.href = blobUrl;
    downloadLink.download = "protocol.pdf";
    downloadLink.style.display = "none";

    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);

    // Clean up the blob URL after a short delay
    setTimeout(() => {
      URL.revokeObjectURL(blobUrl);
    }, 1000);
  } else {
    // Desktop: Open in new tab (original behavior)
    const w = window.open(blobUrl, "_blank");
    if (!w) {
      // Fallback to download if popup blocked
      const downloadLink = document.createElement("a");
      downloadLink.href = blobUrl;
      downloadLink.download = "protocol.pdf";
      downloadLink.style.display = "none";

      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    }

    // Clean up the blob URL after a delay (longer for new tab scenario)
    setTimeout(() => {
      URL.revokeObjectURL(blobUrl);
    }, 1000);
  }

}

/**
 * Generate and copy an ASCII representation of the protocol to clipboard.
 *
 * Creates separate tables for Food A and Food B, includes mix instructions for dilution steps, and appends custom notes when present. Falls back to alerting the text when clipboard copy fails.
 *
 * @param protocol Protocol
 * @param customNote string
 * @returns void
 */
export function exportASCII(protocol: Protocol | null, customNote: string): void {
  if (!protocol) return

  let text = "";
  let foodAInfo = "";
  let foodBInfo = "";

  // get food A and B? info
  const foodAType =
    protocol.foodA.type === FoodType.SOLID ? "Solid" : "Liquid";
  const foodAUnit = protocol.foodA.type === FoodType.SOLID ? "g" : "ml";
  foodAInfo += `${protocol.foodA.name} (${foodAType}). Protein: ${formatNumber(protocol.foodA.getMgPerUnit(), 1)} mg/${foodAUnit}`;

  if (protocol.foodB) {
    const foodBType =
      protocol.foodB.type === FoodType.SOLID ? "Solid" : "Liquid";
    const foodBUnit =
      protocol.foodB.type === FoodType.SOLID ? "g" : "ml";
    foodBInfo += `${protocol.foodB.name} (${foodBType}). Protein: ${formatNumber(protocol.foodB.getMgPerUnit(), 1)} mg/${foodBUnit}`;
  }

  // GENERATE TABLES
  const totalSteps = protocol.steps.length;
  const foodAStepCount = getFoodAStepCount(protocol);

  // Create separate tables for each food
  const foodATable = new AsciiTable3(protocol.foodA.name);
  const foodBTable = new AsciiTable3(protocol.foodB?.name);

  foodATable.setHeading(
    "Step",
    "Protein",
    "Method",
    "Daily Amount",
    "Mix Details",
  );
  foodBTable.setHeading(
    "Step",
    "Protein",
    "Method",
    "Daily Amount",
    "Mix Details",
  );

  // Iterate over steps and build rows for each table
  for (const step of protocol.steps) {
    const isStepFoodB = step.food === "B";
    const food = isStepFoodB ? protocol.foodB! : protocol.foodA;

    // Create table for this step
    let table: AsciiTable3;
    if (!isStepFoodB) {
      table = foodATable;
    } else {
      table = foodBTable;
    }

    let dailyAmountStr = `${formatAmount(step.dailyAmount, step.dailyAmountUnit)} ${step.dailyAmountUnit}`;
    let mixDetails = "N/A"; // default unless dilution

    if (step.method === Method.DILUTE) {
      const mixUnit: Unit = food.type === FoodType.SOLID ? "g" : "ml";
      mixDetails = `${formatAmount(step.mixFoodAmount!, mixUnit)} ${mixUnit} food + ${formatAmount(step.mixWaterAmount!, "ml")} ml water`;
    }

    table.addRow(
      step.stepIndex,
      `${formatNumber(step.targetMg, 1)} mg`,
      step.method,
      dailyAmountStr,
      mixDetails,
    );
  }

  // Baseline data
  if (protocol.foodB) {
    text += foodAInfo + "\n" + foodBInfo + "\n\n";
  } else {
    text += foodAInfo + "\n\n";
  }

  // ADD TABLES
  if (foodAStepCount > 0) {
    text += foodATable.toString();
  }

  if (foodAStepCount < totalSteps) {
    text += `--- TRANSITION TO: ---\n`;
    text += foodBTable.toString();
  }

  // ADD CUSTOM NOTES IF PROVIDED
  if (customNote && customNote.trim()) {
    text += "========================================\n";
    text += "NOTES\n";
    text += "========================================\n";
    text += `${customNote.trim()}`;
  }

  text += `\n---\nTool version-hash: v${__VERSION_OIT_CALCULATOR__}-${__COMMIT_HASH__}\n`

  // Copy to clipboard
  navigator.clipboard.writeText(text).catch(() => {
    alert("Failed to copy to clipboard. Please copy manually:\n\n" + text);
  });
}
