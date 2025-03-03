import { ALLERGENS } from "./spt_generator_constants.js";

const canonicalAllergensMap = buildCanonicalMap(ALLERGENS);

/**
 * Copy text content to clipboard with visual feedback
 * @param {HTMLButtonElement} button - Copy button element
 * @returns {void} Modifies button text temporarily during copy operation
 */
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


/**
 * Recursively flatten hierarchical allergen structure into single array
 * @param {Object} obj - Nested allergen structure
 * @returns {string[]} Flattened array of all allergen strings
 */
export function flattenAllergens(obj) {
  let results = [];
  for (const key in obj) {
    const item = obj[key];
    if (Array.isArray(item)) {
      item.forEach(el => {
        if (typeof el === 'object' && el.name) {
          // Add the canonical name for display/search
          results.push({ display: el.name, search: el.name });
          // Add each synonym as a searchable term, but keep the canonical display name.
          if (Array.isArray(el.synonyms)) {
            el.synonyms.forEach(syn => {
              results.push({ display: el.name, search: syn });
            });
          }
        } else if (typeof el === 'string') {
          results.push({ display: el, search: el });
        }
      });
    } else if (typeof item === "object") {
      results.push(...flattenAllergens(item));
    }
  }
  return results;
}


/**
 * Escape HTML special characters to prevent XSS
 * @param {string} unsafe - Unsafe input string
 * @returns {string} Sanitized HTML-safe string
 */
export function escapeHtml(unsafe) {
  return unsafe.replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Wrap text to specified maximum width
 * @param {string} text - Text to wrap
 * @param {number} maxWidth - Maximum characters per line
 * @returns {string[]} Array of wrapped lines
 */
export function wrapText(text, maxWidth) {
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
 * Create hierarchical index map for sorting allergens
 * @param {Object} allergens - ALLERGENS structure
 * @returns {Map<string, number[]>} Map of allergens to their category indices
 */
export function buildAllergenOrderMap(allergens) {
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
            // Use the canonical name if allergen is an object
            const key = typeof allergen === 'object' ? allergen.display || allergen.name : allergen;
            orderMap.set(key, [mainIndex, subIndex, allergenIndex]);
          });
        }
      }
    } else if (Array.isArray(mainValue)) {
      mainValue.forEach((allergen, allergenIndex) => {
        const key = typeof allergen === 'object' ? allergen.display || allergen.name : allergen;
        orderMap.set(key, [mainIndex, allergenIndex]);
      });
    }
  }
  return orderMap;
}


/**
 * Builds a lookup map of canonical allergen names keyed by lowercase.
 * @param {Object} allergens - The ALLERGENS object.
 * @returns {Map<string, string>} Map where keys are lowercase allergen names and values are canonical names.
 */
function buildCanonicalMap(allergens) {
  const canonicalMap = new Map();

  const processGroup = (group) => {
    if (Array.isArray(group)) {
      group.forEach(item => {
        const name = typeof item === 'object' ? (item.display || item.name) : item;
        canonicalMap.set(name.toLowerCase(), name);
      });
    } else if (typeof group === 'object') {
      Object.values(group).forEach(subGroup => processGroup(subGroup));
    }
  };

  processGroup(allergens);
  return canonicalMap;
}

/**
 * Normalize the allergen name.
 * If the input matches a canonical allergen (case-insensitively), return the canonical name.
 * Otherwise, return the input as is.
 * @param {string} input - The user entered allergen.
 * @returns {string} The normalized allergen name.
 */
export function normalizeAllergenName(input) {
  return canonicalAllergensMap.get(input.toLowerCase()) || input;
}

