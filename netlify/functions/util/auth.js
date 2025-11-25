// netlify/functions/util/auth.js
const jwt = require('jsonwebtoken');

/**
 * Verifies a JWT from the Authorization header.
 * @param {object} event - The Netlify function event object.
 * @returns {{user: {username: string}|null, error: object|null}} - An object containing the decoded user payload or an error.
 */
function verifyToken(event) {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    console.error('JWT_SECRET environment variable not set');
    return {
      user: null,
      error: {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Server configuration error' })
      }
    };
  }

  const authHeader = event.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      user: null,
      error: {
        statusCode: 401,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Authentication required' })
      }
    };
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, jwtSecret);
    return { user: { username: decoded.username }, error: null };
  } catch (err) {
    let errorMessage = 'Invalid token';
    if (err.name === 'TokenExpiredError') {
      errorMessage = 'Token has expired';
    }
    return {
      user: null,
      error: {
        statusCode: 401,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: errorMessage })
      }
    };
  }
}

module.exports = { verifyToken };
