// netlify/functions/util/auth.js
const jwt = require("jsonwebtoken");

/**
 * User-facing error messages for authentication errors.
 */
const AUTH_ERROR_MESSAGES = {
  NO_TOKEN: "Authentication required. Please log in.",
  INVALID_TOKEN: "Your session is invalid. Please log in again.",
  EXPIRED_TOKEN: "Your session has expired. Please log in again.",
  CONFIG_ERROR: "Unable to process your request. Please try again later.",
};

/**
 * Verifies a JWT from the Authorization header.
 * @param {object} event - The Netlify function event object.
 * @returns {{user: {username: string}|null, error: object|null}} - An object containing the decoded user payload or an error.
 */
function verifyToken(event) {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    console.error("JWT_SECRET environment variable not set");
    return {
      user: null,
      error: {
        statusCode: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({ error: AUTH_ERROR_MESSAGES.CONFIG_ERROR }),
      },
    };
  }

  const authHeader = event.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return {
      user: null,
      error: {
        statusCode: 401,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "WWW-Authenticate": 'Bearer realm="Protected Content"',
        },
        body: JSON.stringify({ error: AUTH_ERROR_MESSAGES.NO_TOKEN }),
      },
    };
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, jwtSecret, { algorithms: ['HS256'] });
    // Success!
    return { user: { username: decoded.username }, error: null };
  } catch (err) {
    let errorMessage = AUTH_ERROR_MESSAGES.INVALID_TOKEN;

    // Log detailed error server-side
    console.warn("Token verification failed:", {
      errorType: err.name,
      message: err.message,
    });

    if (err.name === "TokenExpiredError") {
      errorMessage = AUTH_ERROR_MESSAGES.EXPIRED_TOKEN;
    }

    return {
      user: null,
      error: {
        statusCode: 401,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "WWW-Authenticate": 'Bearer realm="Protected Content"',
        },
        body: JSON.stringify({ error: errorMessage }),
      },
    };
  }
}

module.exports = { verifyToken };
