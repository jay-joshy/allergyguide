/**
 * @module
 *
 * Handle Export buttons (PDF, ASCII) and call actual export module from exports
 */
import { protocolState } from "../state/instances";
import { isClickwrapAccepted, showClickwrapModal } from "./modals";
import { exportASCII, generatePdf } from "../export/exports"

/**
 * init export button listeners
 */
export function initExportEvents(): void {
  document.addEventListener('click', async (e) => {
    const target = e.target as HTMLElement;
    if (target.id === 'export-ascii') {
      exportASCII(protocolState.getProtocol(), protocolState.getCustomNote());
    } else if (target.id === 'export-pdf') {
      if (isClickwrapAccepted()) {
        await triggerPdfGeneration();
      } else {
        showClickwrapModal();
      }
    }
  });
}

export async function triggerPdfGeneration(): Promise<void> {
  const pdfBtn = document.getElementById("export-pdf");
  const modalPdfBtn = document.getElementById("clickwrap-generate-btn");

  if (pdfBtn) {
    pdfBtn.textContent = "Generating...";
    pdfBtn.setAttribute("disabled", "true");
  }
  if (modalPdfBtn) {
    modalPdfBtn.textContent = "Generating...";
    modalPdfBtn.setAttribute("disabled", "true");
  }

  try {
    // dynamic load of libs regardless if its modal or pdfbtn licked
    const { jsPDF } = await import('jspdf');
    const { PDFDocument } = await import('pdf-lib');
    const { applyPlugin } = await import('jspdf-autotable');
    applyPlugin(jsPDF);

    const current = protocolState.getProtocol();
    const customNote = protocolState.getCustomNote();
    await generatePdf(current, customNote, jsPDF, PDFDocument);
  } catch (error) {
    console.error("Failed to load PDF libraries or generate PDF: ", error);
    alert("Error generating PDF. Please check the console for details.");
  } finally {
    if (pdfBtn) {
      pdfBtn.textContent = "Export PDF";
      pdfBtn.removeAttribute("disabled");
    }
    if (modalPdfBtn) {
      modalPdfBtn.textContent = "Generate PDF";
    }
  }
}


