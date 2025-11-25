// netlify/functions/util/auth.js

/**
 * Authenticates a user based on the Authorization header.
 * @param {object} event - The Netlify function event object.
 * @returns {string} The validated username.
 * @throws {Error} Throws an error with a message and statusCode if authentication fails.
 */
function authenticate(event) {
  const users = JSON.parse(process.env.AUTH_USERS || "{}");

  const authHeader = event.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Basic ")) {
    const err = new Error('Authentication required');
    err.statusCode = 401;
    throw err;
  }

  let username, password;
  try {
    const base64Credentials = authHeader.split(" ")[1];
    [username, password] = Buffer.from(base64Credentials, 'base64').toString().split(":");
  } catch (e) {
    const err = new Error('Invalid authentication format');
    err.statusCode = 400;
    throw err;
  }

  if (!users[username] || users[username] !== password) {
    const err = new Error('Invalid credentials');
    err.statusCode = 401;
    throw err;
  }

  return username;
}

module.exports = { authenticate };
