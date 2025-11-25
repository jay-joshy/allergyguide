const {
  createProtectedHandler,
  handleGithubError,
  jsonResponse,
} = require("./util/handler-helper");

/**
 * Core logic for fetching a content file (HTML or Markdown) from GitHub.
 */
const processContentRequest = async (path, { token, owner, repo }) => {
  const githubUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
  console.log(`Fetching: ${githubUrl}`);

  try {
    const response = await fetch(githubUrl, {
      headers: {
        Authorization: `token ${token}`,
        Accept: "application/vnd.github.v3.raw", // Request raw file content
        "User-Agent": "Netlify-Function",
      },
    });

    if (!response.ok) {
      return handleGithubError(response, "content");
    }

    const content = await response.text();
    const fileType = path.toLowerCase().endsWith(".html") ? "html" : "md";

    return jsonResponse(
      200,
      {
        content,
        fileType,
        path,
      },
      {
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    );
  } catch (fetchError) {
    console.error("GitHub fetch error:", fetchError);
    return jsonResponse(500, { error: "Failed to connect to content source" });
  }
};

/**
 * Creates the Netlify function handler using the shared wrapper.
 * Provides a specific path validator and the core processing logic.
 */
exports.handler = createProtectedHandler({
  validatePath: (path) => {
    // Decode the path to catch encoded traversal attempts
    let decoded;
    try {
      decoded = decodeURIComponent(path);
    } catch (e) {
      return "Invalid path encoding";
    }

    // Comprehensive path security checks
    if (
      // Path traversal attempts
      decoded.includes("..") ||
      decoded.includes("%2e%2e") ||
      decoded.includes("%252e") ||
      // Absolute paths
      decoded.startsWith("/") ||
      decoded.startsWith("\\") ||
      // Null bytes
      decoded.includes("\0") ||
      decoded.includes("%00") ||
      // Windows paths
      decoded.includes("\\") ||
      decoded.match(/^[a-zA-Z]:/) ||
      // Only allow safe characters and forward slashes for paths
      !decoded.match(/^[a-zA-Z0-9/_-]+\.(html|md)$/i)
    ) {
      return "Invalid path format. Use relative paths ending in .html or .md";
    }

    // Additional length check to prevent extremely long paths
    if (decoded.length > 500) {
      return "Path too long";
    }

    return null; // Path is valid
  },
  processRequest: processContentRequest,
});
