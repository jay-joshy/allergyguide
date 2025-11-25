const { verifyToken } = require('./auth');

/**
 * A helper to create a standardized JSON response for Netlify functions.
 * @param {number} statusCode - The HTTP status code.
 * @param {object} body - The JSON body of the response.
 * @returns {object} A Netlify function response object.
 */
const jsonResponse = (statusCode, body) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

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
      // 1. Parse and check environment variables
      const { GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO } = process.env;
      if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO) {
        console.error('Missing required environment variables');
        return jsonResponse(500, { error: 'Server configuration error' });
      }

      // 2. Extract and validate path parameter
      const { path } = event.queryStringParameters || {};
      if (!path) {
        return jsonResponse(400, { error: 'Missing path parameter' });
      }

      // 3. Use the specific path validator
      const pathError = validatePath(path);
      if (pathError) {
        return jsonResponse(400, { error: pathError });
      }

      // 4. Handle authentication
      const authResult = verifyToken(event);
      if (authResult.error) {
        return authResult.error; // Already a valid response object
      }

      // 5. Delegate to the specific request processor
      const githubConfig = { token: GITHUB_TOKEN, owner: GITHUB_OWNER, repo: GITHUB_REPO };
      return await processRequest(path, githubConfig);

    } catch (error) {
      console.error('Unexpected error in handler wrapper:', error);
      return jsonResponse(500, { error: 'Internal server error' });
    }
  };
};

/**
 * A common error handler for GitHub fetch responses.
 * @param {Response} response - The fetch response object.
 * @param {string} errorType - The type of content being fetched (e.g., 'content', 'image').
 * @returns {object} A Netlify function response object.
 */
exports.handleGithubError = (response, errorType = 'resource') => {
    if (response.status === 404) {
      return jsonResponse(404, { error: `The requested ${errorType} was not found.` });
    }
    if (response.status === 403) {
        console.error('GitHub API rate limit or permission error');
        return jsonResponse(500, { error: `Access to the ${errorType} was denied due to permissions or rate limits.` });
    }
    console.error(`GitHub API error: ${response.status}`);
    return jsonResponse(response.status, { error: `Failed to fetch ${errorType} from the source.` });
};

// Export for use in other handlers
exports.jsonResponse = jsonResponse;
