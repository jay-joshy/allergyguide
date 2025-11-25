const {
  createProtectedHandler,
  handleGithubError,
  jsonResponse,
} = require("./util/handler-helper");
const { validateContentPath } = require("./util/path-validator");

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
  validatePath: validateContentPath,
  processRequest: processContentRequest,
});
