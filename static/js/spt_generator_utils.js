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
      results.push(...item.filter(i => i !== ""));
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


