const { verifyToken } = require("./auth");

/**
 * Util: create a standardized JSON response for Netlify functions.
 * @param {number} statusCode - The HTTP status code.
 * @param {object} body - The JSON body of the response.
 * @param {object} additionalHeaders - Optional additional headers.
 * @returns {object} A Netlify function response object.
 */
const jsonResponse = (statusCode, body, additionalHeaders = {}) => ({
  statusCode,
  headers: {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    ...additionalHeaders,
  },
  body: JSON.stringify(body),
});

/**
 * User-friendly error messages for content/image requests.
 */
const USER_ERROR_MESSAGES = {
  404: "The requested content was not found.",
  401: "Your session has expired. Please log in again.",
  403: "You do not have permission to access this content.",
  500: "Unable to load content. Please try again later.",
  400: "Invalid request. Please check your input.",
};

/**
 * A wrapper to create a protected Netlify function handler.
 * This handles common logic like checking env vars, validating paths, and authentication.
 * @param {object} options - Configuration for the specific handler.
 * @param {(path: string) => string | null} options.validatePath - A function to validate the path parameter. Returns an error string or null.
 * @param {(path: string, githubConfig: object) => Promise<object>} options.processRequest - The core logic for the handler.
 * @returns {Function} An async Netlify handler function.
 */
exports.createProtectedHandler = ({ validatePath, processRequest }) => {
  return async (event) => {
    try {
      // Handle OPTIONS preflight requests
      if (event.httpMethod === "OPTIONS") {
        return jsonResponse(200, {});
      }

      // 1. Parse and check environment variables
      const { GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO } = process.env;
      if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO) {
        console.error("Missing required environment variables:", {
          hasToken: !!GITHUB_TOKEN,
          hasOwner: !!GITHUB_OWNER,
          hasRepo: !!GITHUB_REPO,
        });
        return jsonResponse(500, {
          error: USER_ERROR_MESSAGES[500],
        });
      }

      // 2. Extract and validate path parameter
      const { path } = event.queryStringParameters || {};
      if (!path) {
        console.warn("Missing path parameter in request");
        return jsonResponse(400, {
          error: USER_ERROR_MESSAGES[400],
        });
      }

      // 3. Use the specific path validator
      const pathError = validatePath(path);
      if (pathError) {
        console.warn("Path validation failed:", { path, reason: pathError });
        return jsonResponse(400, {
          error: USER_ERROR_MESSAGES[400],
        });
      }

      // 4. Handle authentication
      const authResult = verifyToken(event);
      if (authResult.error) {
        // The error response already has proper structure
        return authResult.error;
      }

      // 5. Delegate to the specific request processor
      const githubConfig = {
        token: GITHUB_TOKEN,
        owner: GITHUB_OWNER,
        repo: GITHUB_REPO,
      };
      return await processRequest(path, githubConfig);
    } catch (error) {
      console.error("Unexpected error in handler wrapper:", {
        message: error.message,
        stack: error.stack,
        path: event.queryStringParameters?.path,
      });
      return jsonResponse(500, {
        error: USER_ERROR_MESSAGES[500],
      });
    }
  };
};

/**
 * A common error handler for GitHub fetch responses.
 * @param {Response} response - The fetch response object.
 * @param {string} errorType - The type of content being fetched (e.g., 'content', 'image').
 * @returns {object} A Netlify function response object.
 */
exports.handleGithubError = (response, errorType = "resource") => {
  const status = response.status;

  // Log detailed error server-side
  console.error("GitHub API error:", {
    status,
    statusText: response.statusText,
    errorType,
  });

  // Return user-friendly message
  if (status === 404) {
    return jsonResponse(404, {
      error: USER_ERROR_MESSAGES[404],
    });
  }
  if (status === 403) {
    console.error("GitHub API rate limit or permission error");
    return jsonResponse(403, {
      error: USER_ERROR_MESSAGES[403],
    });
  }

  // Generic error for other status codes
  return jsonResponse(status >= 500 ? 500 : status, {
    error: USER_ERROR_MESSAGES[status] || USER_ERROR_MESSAGES[500],
  });
};

// Export for use in other handlers
exports.jsonResponse = jsonResponse;
