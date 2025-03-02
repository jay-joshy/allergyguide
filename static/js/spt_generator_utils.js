// Helper: Wrap text without breaking words.
function wrapText(text, maxWidth) {
  const words = text.split(" ");
  let lines = [];
  let currentLine = "";
  for (const word of words) {
    if ((currentLine + word).length > maxWidth) {
      lines.push(currentLine.trim());
      currentLine = word + " ";
    } else {
      currentLine += word + " ";
    }
  }
  if (currentLine.trim().length > 0) {
    lines.push(currentLine.trim());
  }
  return lines;
}

export function getTable(entryList, useCol) {
  if (entryList.length === 0) return "";

  const fixedWidth = 40;
  const separator = "||   ";
  const noteWrapWidth = fixedWidth - 4;

  function formatCell(ent) {
    if (!ent) return { line1: "", noteLines: [] };
    let line1 = `${ent.allergen} -- ${ent.diameter}mm`;
    let noteLines = [];
    if (ent.note) {
      const wrapped = wrapText(ent.note, noteWrapWidth);
      if (wrapped.length === 1) {
        noteLines.push("  [" + wrapped[0] + "]");
      } else {
        noteLines.push("  [" + wrapped[0]);
        for (let i = 1; i < wrapped.length - 1; i++) {
          noteLines.push("    " + wrapped[i]);
        }
        noteLines.push("    " + wrapped[wrapped.length - 1] + "]");
      }
    }
    return { line1, noteLines };
  }

  if (!useCol || entryList.length < 4) {
    let lines = [];
    for (const ent of entryList) {
      let cell = formatCell(ent);
      let entryLine = cell.line1;
      if (ent.note) {
        entryLine += ` [${ent.note}]`;
      }
      lines.push(entryLine.padEnd(fixedWidth));
    }
    return lines.join("\n");
  }

  const rows = Math.ceil(entryList.length / 2);
  const leftEntries = entryList.slice(0, rows);
  const rightEntries = entryList.slice(rows);
  while (rightEntries.length < rows) {
    rightEntries.push(null);
  }

  const leftCells = leftEntries.map(formatCell);
  const rightCells = rightEntries.map(formatCell);

  let outputLines = [];
  for (let i = 0; i < rows; i++) {
    const leftCell = leftCells[i];
    const rightCell = rightCells[i];

    let firstLine =
      leftCell.line1.padEnd(fixedWidth) +
      separator +
      rightCell.line1.padEnd(fixedWidth);
    outputLines.push(firstLine);

    const numNoteLines = Math.max(leftCell.noteLines.length, rightCell.noteLines.length);
    for (let j = 0; j < numNoteLines; j++) {
      const leftNote = leftCell.noteLines[j] || "";
      const rightNote = rightCell.noteLines[j] || "";
      let noteLine =
        leftNote.padEnd(fixedWidth) +
        separator +
        rightNote.padEnd(fixedWidth);
      outputLines.push(noteLine);
    }
  }
  let horizontalTableLen = outputLines[0].length;
  let roughTable = outputLines.join("\n");

  return "-".repeat(horizontalTableLen) + "\n" + roughTable + "\n" + "-".repeat(horizontalTableLen);
}

export function copyToClipboard(button) {
  const codeBlock = button.nextElementSibling; // Get the sibling `.txt` div
  const text = codeBlock.textContent || codeBlock.innerText;

  navigator.clipboard.writeText(text).then(() => {
    button.textContent = "Copied!"; // Temporarily change button text
    setTimeout(() => button.textContent = "Copy", 2000); // Revert after 2 seconds
  }).catch(err => {
    console.error("Failed to copy text: ", err);
    button.textContent = "Error";
    setTimeout(() => button.textContent = "Copy", 2000);
  });
}

