// netlify/functions/util/auth.js

/**
 * Authenticates a user based on the Authorization header in a Netlify function event.
 * @param {object} event - The Netlify function event object.
 * @returns {{user: {username: string}|null, error: object|null}} - An object containing the user if authentication is successful, or an error object if it fails.
 */
function authenticate(event) {
  // Parse environment variables for users
  const users = JSON.parse(process.env.AUTH_USERS || "{}");

  // Handle authentication header
  const authHeader = event.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Basic ")) {
    return {
      user: null,
      error: {
        statusCode: 401,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Authentication required' })
      }
    };
  }

  // Decode and validate credentials
  let username, password;
  try {
    const base64Credentials = authHeader.split(" ")[1];
    [username, password] = Buffer.from(base64Credentials, 'base64').toString().split(":");
  } catch (e) {
    return {
      user: null,
      error: {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Invalid authentication format' })
      }
    };
  }

  if (!users[username] || users[username] !== password) {
    return {
      user: null,
      error: {
        statusCode: 401,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Invalid credentials' })
      }
    };
  }

  // Success
  return { user: { username }, error: null };
}

module.exports = { authenticate };
