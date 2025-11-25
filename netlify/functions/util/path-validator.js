/**
 * Validates a path parameter for security and format requirements.
 * @param {string} path - The path to validate.
 * @param {object} options - Validation options.
 * @param {RegExp} options.allowedExtensions - Regex pattern for allowed file extensions.
 * @param {number} options.maxLength - Maximum path length (default: 500).
 * @returns {string|null} - Error message if invalid, null if valid.
 */
function validatePath(path, options = {}) {
  const {
    allowedExtensions = /\.(html|md)$/i,
    maxLength = 500,
  } = options;

  // Decode the path to catch encoded traversal attempts
  let decoded;
  try {
    decoded = decodeURIComponent(path);
  } catch (e) {
    return "Invalid path encoding";
  }

  // Check path length first (early exit)
  if (decoded.length > maxLength) {
    return "Path too long";
  }

  // Path traversal prevention
  const traversalPatterns = [
    { test: (p) => p.includes(".."), desc: "parent directory references" },
    { test: (p) => p.includes("%2e%2e"), desc: "encoded traversal" },
    { test: (p) => p.includes("%252e"), desc: "double-encoded traversal" },
  ];

  for (const pattern of traversalPatterns) {
    if (pattern.test(decoded)) {
      return `Invalid path: contains ${pattern.desc}`;
    }
  }

  // Absolute path prevention
  if (decoded.startsWith("/") || decoded.startsWith("\\")) {
    return "Invalid path: absolute paths not allowed";
  }

  // Null byte injection prevention
  if (decoded.includes("\0") || decoded.includes("%00")) {
    return "Invalid path: null bytes not allowed";
  }

  // Windows path prevention
  if (decoded.includes("\\")) {
    return "Invalid path: backslashes not allowed";
  }

  // Windows drive letters
  if (decoded.match(/^[a-zA-Z]:/)) {
    return "Invalid path: drive letters not allowed";
  }

  // Character whitelist - only alphanumeric, forward slashes, hyphens, underscores, dots
  if (!decoded.match(/^[a-zA-Z0-9/_.-]+$/)) {
    return "Invalid path: contains disallowed characters";
  }

  // Extension validation
  if (!allowedExtensions.test(decoded)) {
    return `Invalid path: file extension not allowed. Must match ${allowedExtensions}`;
  }

  return null; // Path is valid
}

/**
 * Validates a content file path (HTML or Markdown).
 * @param {string} path - The path to validate.
 * @returns {string|null} - Error message if invalid, null if valid.
 */
function validateContentPath(path) {
  return validatePath(path, {
    allowedExtensions: /\.(html|md)$/i,
  });
}

/**
 * Validates an image file path.
 * @param {string} path - The path to validate.
 * @returns {string|null} - Error message if invalid, null if valid.
 */
function validateImagePath(path) {
  return validatePath(path, {
    allowedExtensions: /\.(jpg|jpeg|png|gif|svg|webp|bmp|ico)$/i,
  });
}

module.exports = {
  validatePath,
  validateContentPath,
  validateImagePath,
};
