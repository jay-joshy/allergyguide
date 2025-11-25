// netlify/functions/login.js
const jwt = require('jsonwebtoken');

// --- Rate Limiting (in-memory) ---
const MAX_ATTEMPTS = 5; // Max failed attempts before blocking
const BLOCK_DURATION_MIN = 5; // Block duration in minutes

// Store for failed attempts: { ip: { count: number, expires: timestamp } }
const failedAttempts = {};

/**
 * Checks if an IP is currently rate-limited.
 * @param {string} ip - The client's IP address.
 * @returns {{limited: boolean, message?: string}}
 */
function checkRateLimit(ip) {
  const record = failedAttempts[ip];
  if (record) {
    // If the block has expired, clear the record for this IP.
    if (Date.now() > record.expires) {
      delete failedAttempts[ip];
      return { limited: false };
    }
    // If the block is active and the attempt count is over the limit.
    if (record.count >= MAX_ATTEMPTS) {
      const remaining = Math.ceil((record.expires - Date.now()) / 60000);
      return {
        limited: true,
        message: `Too many failed attempts. Please try again in ${remaining} minute(s).`
      };
    }
  }
  return { limited: false };
}

/**
 * Records a failed login attempt for a given IP.
 * @param {string} ip - The client's IP address.
 */
function recordFailedAttempt(ip) {
  let record = failedAttempts[ip];
  if (!record) {
    record = { count: 0, expires: 0 };
    failedAttempts[ip] = record;
  }
  record.count++;
  // If the count reaches the max, set the expiration time for the block.
  if (record.count >= MAX_ATTEMPTS) {
    record.expires = Date.now() + BLOCK_DURATION_MIN * 60 * 1000;
  }
}

/**
 * Clears any tracked failed attempts for an IP upon a successful login.
 * @param {string} ip - The client's IP address.
 */
function clearFailedAttempts(ip) {
  if (failedAttempts[ip]) {
    delete failedAttempts[ip];
  }
}
// --- End Rate Limiting ---


exports.handler = async (event) => {
  // Ensure this is a POST request
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  const clientIp = event.headers['x-nf-client-connection-ip'];

  // --- Rate Limiting Check ---
  const limit = checkRateLimit(clientIp);
  if (limit.limited) {
    return {
      statusCode: 429, // Too Many Requests
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: limit.message })
    };
  }
  // --- End Rate Limiting Check ---

  try {
    // Parse environment variables
    const jwtSecret = process.env.JWT_SECRET;
    const users = JSON.parse(process.env.AUTH_USERS || '{}');
    const tokenExpiryHours = parseInt(process.env.TOKEN_EXPIRY_HOURS || "24");

    if (!jwtSecret) {
      console.error('JWT_SECRET environment variable not set');
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Server configuration error' })
      };
    }

    // Parse incoming credentials
    const { username, password } = JSON.parse(event.body);
    if (!username || !password) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Username and password are required' })
      };
    }

    // Validate credentials
    if (!users[username] || users[username] !== password) {
      recordFailedAttempt(clientIp); // Record the failure
      return {
        statusCode: 401,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Invalid credentials' })
      };
    }

    // --- Success ---
    clearFailedAttempts(clientIp); // Clear any prior failures on success

    // Credentials are valid, generate a JWT
    const token = jwt.sign(
      { username }, // Payload
      jwtSecret,   // Secret key
      { expiresIn: `${tokenExpiryHours}h` } // Expiration
    );

    // Return the token
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    };

  } catch (error) {
    console.error('Error during login:', error);
    if (error instanceof SyntaxError) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Invalid JSON format in request body' })
      };
    }
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
