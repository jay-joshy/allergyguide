/**
 * @module
 *
 * Void functions that trigger: 1) PDF document to download in new tab 2) copy ASCII protocol to clipboard
 */

import { FoodType, Method } from "../types";
import type { Protocol, Unit } from "../types";
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

  // fetch physician review sheet and education handout pdfs
  const reviewSheetPromise = fetch('/tool_assets/oit_patient_resource_terms.pdf')
    .then(res => {
      if (!res.ok) throw new Error("Failed to load review sheet PDF");
      return res.arrayBuffer();
    });

  // generate main protocol doc table
  const doc: jsPDF = new JsPdfClass({
    unit: "pt",
    format: "letter",
  });

  let yPosition = 40;

  // Add title
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Oral Immunotherapy Protocol", 40, yPosition);
  yPosition += 30;

  // Get food information
  const foodAUnit = protocol.foodA.type === FoodType.SOLID ? "g" : "ml";
  const foodAStepCount = getFoodAStepCount(protocol);
  const totalSteps = protocol.steps.length;

  // Build Food A table data if it exists (it always should ... unless the user does Food A -> B and then deletes all the Food A steps for some dumb reason)
  if (foodAStepCount > 0) {
    const foodARows: any[] = [];
    for (let i = 0; i < foodAStepCount; i++) {
      const step = protocol.steps[i];
      const food = protocol.foodA;

      let dailyAmountStr = `${formatAmount(step.dailyAmount, step.dailyAmountUnit)} ${step.dailyAmountUnit}`;
      let mixDetails = "N/A";

      if (step.method === Method.DILUTE) {
        const mixUnit: Unit = food.type === FoodType.SOLID ? "g" : "ml";
        mixDetails = `${formatAmount(step.mixFoodAmount!, mixUnit)} ${mixUnit} food + ${formatAmount(step.mixWaterAmount!, "ml")} ml water`;
      }

      if (i === totalSteps - 1) {
        foodARows.push([
          step.stepIndex,
          `${formatNumber(step.targetMg, 1)} mg`,
          step.method,
          mixDetails,
          dailyAmountStr,
          "Continue long term",
        ]);
      } else {
        foodARows.push([
          step.stepIndex,
          `${formatNumber(step.targetMg, 1)} mg`,
          step.method,
          mixDetails,
          dailyAmountStr,
          "2-4 weeks",
        ]);
      }
    }

    // Build Food A section PDF
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(`${protocol.foodA.name}`, 40, yPosition);
    yPosition += 20;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(
      `Protein: ${formatNumber(protocol.foodA.gramsInServing, 2)} g per ${protocol.foodA.servingSize} ${foodAUnit} serving.`,
      40,
      yPosition,
    );
    yPosition += 15;

    // Food A table
    (doc as any).autoTable({
      startY: yPosition,
      head: [
        [
          "Step",
          "Protein",
          "Method",
          "How to make mix",
          "Daily Amount",
          "Interval",
        ],
      ],
      body: foodARows,
      theme: "striped",
      headStyles: {
        fillColor: [220, 220, 220], // Light gray, B&W friendly
        textColor: [0, 0, 0],
        fontStyle: 'bold',
      },
      styles: {
        fontSize: 9,
        cellPadding: 6,
        overflow: 'linebreak',
        valign: 'middle',
        halign: 'left',
      },
      columnStyles: {
        0: { halign: 'center' }, // Step
        1: { halign: 'center' }, // Protein
        2: { halign: 'center' }, // Method
      },
      margin: { left: 40, right: 40 },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 20;
  }

  // Food B section (if exists)
  if (protocol.foodB && foodAStepCount < totalSteps) {
    const foodBUnit =
      protocol.foodB.type === FoodType.SOLID ? "g" : "ml";

    // Build Food B table data
    const foodBRows: any[] = [];
    for (let i = foodAStepCount; i < totalSteps; i++) {
      const step = protocol.steps[i];

      let dailyAmountStr = `${formatAmount(step.dailyAmount, step.dailyAmountUnit)} ${step.dailyAmountUnit}`;
      let mixDetails = "N/A"; // default for food B since there is no mix

      if (step.method === Method.DILUTE) {
        console.log("A step for food B should never be diluted by design.", step)
      }

      // last step should say continue long term
      if (i === totalSteps - 1) {
        foodBRows.push([
          step.stepIndex,
          `${formatNumber(step.targetMg, 1)} mg`,
          step.method,
          mixDetails,
          dailyAmountStr,
          "Continue long term",
        ]);
      } else {
        foodBRows.push([
          step.stepIndex,
          `${formatNumber(step.targetMg, 1)} mg`,
          step.method,
          mixDetails,
          dailyAmountStr,
          "2-4 weeks",
        ]);
      }
    }

    // Check if we need a new page
    if (yPosition > 650) {
      doc.addPage();
      yPosition = 40;
    }

    yPosition += 10;
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(`${protocol.foodB.name}`, 40, yPosition);
    yPosition += 20;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(
      `Protein: ${formatNumber(protocol.foodB.gramsInServing, 2)} g per ${protocol.foodB.servingSize} ${foodBUnit} serving`,
      40,
      yPosition,
    );
    yPosition += 15;

    // Food B table
    (doc as any).autoTable({
      startY: yPosition,
      head: [
        [
          "Step",
          "Protein",
          "Method",
          "How to make mix",
          "Daily Amount",
          "Interval",
        ],
      ],
      body: foodBRows,
      theme: "striped",
      headStyles: {
        fillColor: [220, 220, 220], // Light gray, B&W friendly
        textColor: [0, 0, 0],
        fontStyle: 'bold',
      },
      styles: {
        fontSize: 9,
        cellPadding: 6,
        overflow: 'linebreak',
        valign: 'middle',
        halign: 'left',
      },
      columnStyles: {
        0: { halign: 'center' }, // Step
        1: { halign: 'center' }, // Protein
        2: { halign: 'center' }, // Method
      },
      margin: { left: 40, right: 40 },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 20;
  }

  // Custom notes section
  if (customNote && customNote.trim()) {
    // Check if we need a new page
    if (yPosition > 650) {
      doc.addPage();
      yPosition = 40;
    }

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Notes", 40, yPosition);
    yPosition += 15;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    // Split notes into lines that fit the page width
    const maxWidth = 520; // page width minus margins
    const lines = doc.splitTextToSize(customNote.trim(), maxWidth);

    for (const line of lines) {
      if (yPosition > 730) {
        doc.addPage();
        yPosition = 40;
      }
      doc.text(line, 40, yPosition);
      yPosition += 14;
    }
  }

  // Add footer with disclaimer
  const pageCount = doc.internal.pages.length;
  for (let i = 1; i < pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(100);
    doc.text("", 40, 760);
    doc.text(`Always verify calculations before clinical use. Current tool version-hash: v${__VERSION_OIT_CALCULATOR__}-${__COMMIT_HASH__}`, 40, 772);
    doc.setTextColor(0);
  }

  // --- QR CODE GENERATION ---
  try {
    // get payload
    const history = protocolState.getHistory();
    const payload = generateUserHistoryPayload(history);

    if (payload) {
      const { default: QRCode } = await import('qrcode');

      const { deflate } = await import('pako');

      const jsonStr = JSON.stringify(payload);
      const compressed = deflate(jsonStr);
      // Convert to Base64 string for QR
      let binary = '';
      const len = compressed.byteLength;
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(compressed[i]);
      }
      const b64 = btoa(binary);

      // Generate Data URL
      const qrDataUrl = await QRCode.toDataURL(b64, {
        errorCorrectionLevel: 'M',
        width: 800,
        margin: 1
      });

      // Embed in Footer first page bottom right
      doc.setPage(1);
      doc.addImage(qrDataUrl, 'PNG', 493, 10, 80, 80);

      doc.setFontSize(6);
    }
  } catch (e) {
    console.warn("Could not generate QR code", e);
  }

  // doc is complete
  // prep for merge: need array buffers for pdf-lib
  const jsPdfBytes = doc.output('arraybuffer');
  const reviewSheetBytes = await reviewSheetPromise;

  // merge
  const mergedPdf = await PdfDocClass.create();
  const protocolPdf = await PdfDocClass.load(jsPdfBytes);
  const reviewSheetPdf = await PdfDocClass.load(reviewSheetBytes);

  // order of pdfs
  const reviewSheetPages = await mergedPdf.copyPages(reviewSheetPdf, reviewSheetPdf.getPageIndices());
  reviewSheetPages.forEach((page) => mergedPdf.addPage(page));
  const protocolPages = await mergedPdf.copyPages(protocolPdf, protocolPdf.getPageIndices());
  protocolPages.forEach((page) => mergedPdf.addPage(page));

  // create blob
  const mergedPdfBytes = await mergedPdf.save();
  const pdfBlob = new Blob(
    [mergedPdfBytes as Uint8Array<ArrayBuffer>],
    { type: "application/pdf" }
  );

  const blobUrl = URL.createObjectURL(pdfBlob);

  // Detect if user is on mobile device
  const isMobile =
    /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ||
    (window.matchMedia && window.matchMedia("(pointer: coarse)").matches) ||
    (("ontouchstart" in window || navigator.maxTouchPoints > 0) &&
      window.innerWidth <= 1024);

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
