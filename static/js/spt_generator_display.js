import { ALLERGENS } from "./spt_generator_constants.js";

/**
 * @private
 * Wrap text to specified maximum width
 * @param {string} text - Text to wrap
 * @param {number} maxWidth - Maximum characters per line
 * @returns {string[]} Array of wrapped lines
 */
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

/**
 * @private
 * Create hierarchical index map for sorting allergens
 * @param {Object} allergens - ALLERGENS structure
 * @returns {Map<string, number[]>} Map of allergens to their category indices
 */
function buildAllergenOrderMap(allergens) {
  const orderMap = new Map();
  const mainCategories = Object.keys(allergens);
  for (let mainIndex = 0; mainIndex < mainCategories.length; mainIndex++) {
    const mainKey = mainCategories[mainIndex];
    const mainValue = allergens[mainKey];
    if (typeof mainValue === 'object' && !Array.isArray(mainValue)) {
      const subGroups = Object.keys(mainValue);
      for (let subIndex = 0; subIndex < subGroups.length; subIndex++) {
        const subKey = subGroups[subIndex];
        const subValue = mainValue[subKey];
        if (Array.isArray(subValue)) {
          subValue.forEach((allergen, allergenIndex) => {
            orderMap.set(allergen, [mainIndex, subIndex, allergenIndex]);
          });
        }
      }
    } else if (Array.isArray(mainValue)) {
      mainValue.forEach((allergen, allergenIndex) => {
        orderMap.set(allergen, [mainIndex, allergenIndex]);
      });
    }
  }
  return orderMap;
}

/**
 * Generate formatted ASCII table from allergen entries
 * @param {Object[]} entryList - Allergen entries ({ allergen, diameter, note })
 * @param {boolean} useCol - Enable two-column format
 * @param {boolean} sort - Sort by ALLERGENS hierarchy first, then alphabetically
 * @returns {string} Formatted table with optional notes wrapping and column layout
 */
export function getTable(entryList, useCol, sort) {
  if (entryList.length === 0) return "";

  // Create a copy to avoid mutating the original array
  let processedEntries = [...entryList];

  if (sort) {
    const orderMap = buildAllergenOrderMap(ALLERGENS);
    const unknownEntries = [];
    const knownEntries = [];
    for (const entry of processedEntries) {
      if (orderMap.has(entry.allergen)) {
        knownEntries.push(entry);
      } else {
        unknownEntries.push(entry);
      }
    }
    unknownEntries.sort((a, b) => a.allergen.localeCompare(b.allergen));
    knownEntries.sort((a, b) => {
      const keyA = orderMap.get(a.allergen);
      const keyB = orderMap.get(b.allergen);
      for (let i = 0; i < Math.min(keyA.length, keyB.length); i++) {
        const diff = keyA[i] - keyB[i];
        if (diff !== 0) return diff;
      }
      return keyA.length - keyB.length;
    });
    processedEntries = [...unknownEntries, ...knownEntries];
  }

  const fixedWidth = 30;
  const separator = "||   ";
  const noteWrapWidth = fixedWidth - 4;

  function formatCell(ent) {
    if (!ent) return { line1: "", noteLines: [] };
    let line1 = `${ent.allergen !== "" ? ent.allergen : "Enter allergen"} -- ${ent.diameter != null && (!isNaN(ent.diameter) || ent.diameter == "") ? ent.diameter + 'mm' : 'Enter #'}`;
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

  if (!useCol || processedEntries.length < 4) {
    let lines = [];
    for (const ent of processedEntries) {
      let cell = formatCell(ent);
      let entryLine = cell.line1;
      if (ent.note) {
        entryLine += ` [${ent.note}]`;
      }
      lines.push(entryLine.padEnd(fixedWidth));
    }
    return lines.join("\n");
  }

  const rows = Math.ceil(processedEntries.length / 2);
  const leftEntries = processedEntries.slice(0, rows);
  const rightEntries = processedEntries.slice(rows);
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

  return "-".repeat(horizontalTableLen - 10) + "\n" + roughTable + "\n" + "-".repeat(horizontalTableLen - 10);
}

/**
 * Generates a summary of allergen test results.
 * 
 * @param {Entry[]} entryList - List of allergen test entries.
 * @returns {string} A formatted summary of positive, negative, and control test results.
 */
/**
 * Generates a summary of allergen test results.
 * 
 * @param {Entry[]} entryList - List of allergen test entries.
 * @returns {string} A formatted summary of positive, negative, and control test results.
 */
export function getSummary(entryList) {
  const positiveAllergens = {}; // Stores allergens with positive reactions (diameter >= 3)
  const negativeAllergens = new Set(); // Stores allergens with negative reactions (diameter < 3)
  const positiveControls = []; // Stores positive control entries
  const negativeControls = []; // Stores negative control entries

  // Iterate through each allergen entry
  for (const entry of entryList) {
    const { allergen, diameter, note } = entry;

    // Handle positive and negative controls separately
    if (allergen === "(+) control") {
      if (!isNaN(diameter) && diameter !== null) {
        positiveControls.push({ diameter, note });
      }
      continue;
    }
    if (allergen === "(-) control") {
      if (!isNaN(diameter) && diameter !== null) {
        negativeControls.push({ diameter, note });
      }
      continue;
    }

    // Categorize allergens based on their diameter measurement
    if (diameter >= 3) {
      if (!positiveAllergens[allergen]) {
        positiveAllergens[allergen] = [];
      }
      positiveAllergens[allergen].push({ diameter, note });
    } else {
      negativeAllergens.add(allergen);
    }
  }

  /**
   * Formats grouped allergen data into a readable string.
   * @param {Object} entries - Grouped allergen entries.
   * @returns {string} Formatted allergen summary.
   */
  const formatEntries = (entries) => {
    return Object.entries(entries).map(([allergen, data]) => {
      const diameters = data.map(d => d.diameter + "mm").join(", ");
      const notes = data.map(d => d.note).filter(Boolean).join("; ");
      return `${allergen} (${diameters}${notes ? " -- " + notes : ""})`;
    }).join(", ");
  };

  let summary = "";

  // Construct the positive results summary
  if (Object.keys(positiveAllergens).length > 0) {
    summary += `Skin testing was positive for ${formatEntries(positiveAllergens)}.`;
  }

  // Construct the negative results summary
  if (negativeAllergens.size > 0) {
    summary += ` Otherwise, ${Array.from(negativeAllergens).join(", ")} were negative.`;
  }

  const controls = [];

  /**
   * Formats control entries into a readable string.
   * @param {string} label - Control type label (Positive/Negative control).
   * @param {Array} controlsArray - Array of control entries.
   * @returns {string} Formatted control summary.
   */
  const formatControls = (label, controlsArray) => {
    if (controlsArray.length === 0) return "";
    const diameters = controlsArray.map(c => `${c.diameter}mm${c.note ? " -- " + c.note : ""}`).join(", ");
    return `${label} (${diameters})`;
  };

  // Append control results to the summary
  if (positiveControls.length > 0) {
    controls.push(formatControls("Positive control", positiveControls));
  }
  if (negativeControls.length > 0) {
    controls.push(formatControls("Negative control", negativeControls));
  }

  if (controls.length > 0) {
    summary += ` ${controls.join(", ")}.`;
  }

  return summary.trim();
}



