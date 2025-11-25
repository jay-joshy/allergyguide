const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

// --- Configuration Constants ---
const MAX_ATTEMPTS = parseInt(process.env.MAX_LOGIN_ATTEMPTS || "5", 10);
const BLOCK_DURATION_MIN = parseInt(
  process.env.LOGIN_BLOCK_DURATION_MIN || "5",
  10,
);
const MINUTES_TO_MS = 60000;
const MAX_USERNAME_LENGTH = 50;
const MAX_PASSWORD_LENGTH = 100;

// --- Input Sanitization ---
/**
 * Sanitizes a string input to prevent injection attacks.
 * @param {string} input - The input string to sanitize.
 * @param {number} maxLength - Maximum allowed length.
 * @returns {string|null} - Sanitized string or null if invalid.
 */
function sanitizeInput(input, maxLength) {
  if (typeof input !== "string") return null;

  // Trim whitespace
  let sanitized = input.trim();

  // Check length
  if (sanitized.length === 0 || sanitized.length > maxLength) return null;

  // Remove null bytes and other control characters
  sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, "");

  return sanitized;
}

// --- Rate Limiting (in-memory) ---
// Note: In-memory storage resets on function cold starts (~15 minutes of inactivity)
// Store for failed attempts: { ip: { count: number, expires: timestamp } }
const failedAttempts = {};

/**
 * Checks if an IP is currently rate-limited.
 * @param {string} ip - The client's IP address.
 * @returns {{limited: boolean, message?: string}}
 */
function checkRateLimit(ip) {
  const record = failedAttempts[ip];
  if (!record) {
    return { limited: false };
  }

  // active block?
  if (record.count >= MAX_ATTEMPTS) {
    // If the block has expired, clear the record for this IP.
    if (Date.now() > record.expires) {
      delete failedAttempts[ip];
      return { limited: false };
    }
    // block is active therefore
    const remaining = Math.ceil((record.expires - Date.now()) / 60000);
    return {
      limited: true,
      message: `Too many failed login attempts. Please try again in ${remaining} minute(s).`,
    };
  }
  return { limited: false };
}

/**
 * Records a failed login attempt for a given IP.
 * Sets a lockout timer when max attempts reached.
 * @param {string} ip - The client's IP address.
 */
function recordFailedAttempt(ip) {
  const record = failedAttempts[ip] || { count: 0, expires: 0 };
  record.count++;

  // Set lockout expiration only when threshold reached
  if (record.count === MAX_ATTEMPTS) {
    record.expires = Date.now() + BLOCK_DURATION_MIN * MINUTES_TO_MS;
    console.log(
      `IP ${ip} locked out for ${BLOCK_DURATION_MIN} minutes after ${MAX_ATTEMPTS} failed attempts`,
    );
  }

  failedAttempts[ip] = record;
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

/**
 * User-friendly error messages that don't leak system information.
 */
const USER_ERRORS = {
  RATE_LIMIT: (minutes) =>
    `Too many failed login attempts. Please try again in ${minutes} minute(s).`,
  INVALID_CREDENTIALS: "Invalid username or password.",
  MISSING_FIELDS: "Username and password are required.",
  INVALID_INPUT: "Invalid username or password format.",
  SERVER_ERROR: "Unable to process your request. Please try again later.",
  METHOD_NOT_ALLOWED: "Invalid request method.",
};

exports.handler = async (event) => {
  // Ensure this is a POST request
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
      body: JSON.stringify({ error: USER_ERRORS.METHOD_NOT_ALLOWED }),
    };
  }

  const clientIp = event.headers["x-nf-client-connection-ip"] || "unknown";

  // --- Rate Limiting Check ---
  const limit = checkRateLimit(clientIp);
  if (limit.limited) {
    console.log(`Rate limit triggered for IP: ${clientIp}`);
    return {
      statusCode: 429, // Too Many Requests
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Retry-After": "300",
      },
      body: JSON.stringify({ error: limit.message }),
    };
  }
  // --- End Rate Limiting Check ---

  try {
    // Parse environment variables
    const jwtSecret = process.env.JWT_SECRET;
    const users = JSON.parse(process.env.AUTH_USERS || "{}");
    const tokenExpiryHours = parseInt(process.env.TOKEN_EXPIRY_HOURS || "24");

    if (!jwtSecret) {
      console.error("JWT_SECRET environment variable not set");
      return {
        statusCode: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({ error: USER_ERRORS.SERVER_ERROR }),
      };
    }

    // Parse incoming credentials
    let requestBody;
    try {
      requestBody = JSON.parse(event.body);
    } catch (parseError) {
      console.error("Invalid JSON in request body:", parseError.message);
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({ error: USER_ERRORS.INVALID_INPUT }),
      };
    }

    const { username, password } = requestBody;

    // Check if fields are provided
    if (!username || !password) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({ error: USER_ERRORS.MISSING_FIELDS }),
      };
    }

    // Sanitize inputs
    const sanitizedUsername = sanitizeInput(username, MAX_USERNAME_LENGTH);
    const sanitizedPassword = sanitizeInput(password, MAX_PASSWORD_LENGTH);

    // No username or password
    if (!sanitizedUsername || !sanitizedPassword) {
      console.log(`No username or no password provided: ${clientIp}`);
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({ error: USER_ERRORS.INVALID_INPUT }),
      };
    }

    // Validate credentials
    // Check if user exists
    if (!users[sanitizedUsername]) {
      recordFailedAttempt(clientIp);
      console.log(
        `Failed login attempt for non-existent user: ${sanitizedUsername} from IP: ${clientIp}`,
      );
      return {
        statusCode: 401,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({ error: USER_ERRORS.INVALID_CREDENTIALS }),
      };
    }

    const storedPasswordHash = users[sanitizedUsername];

    // Check if the stored password is a bcrypt hash or plaintext (for migration)
    let isValid = false;
    if (
      storedPasswordHash.startsWith("$2a$") ||
      storedPasswordHash.startsWith("$2b$")
    ) {
      // It's a bcrypt hash, use bcrypt.compare
      isValid = await bcrypt.compare(sanitizedPassword, storedPasswordHash);
    } else {
      // Legacy plaintext comparison (for migration period)
      // In production, you should remove this and require all passwords to be hashed
      console.warn(
        `WARNING: User ${sanitizedUsername} using plaintext password; consider migrating to bcrypt.`,
      );
      isValid = sanitizedPassword === storedPasswordHash;
    }

    if (!isValid) {
      recordFailedAttempt(clientIp);
      console.log(
        `Failed login attempt for user: ${sanitizedUsername} from IP: ${clientIp}`,
      );
      return {
        statusCode: 401,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({ error: USER_ERRORS.INVALID_CREDENTIALS }),
      };
    }

    // --- Success ---
    clearFailedAttempts(clientIp);
    console.log(
      `Successful login for user: ${sanitizedUsername} from IP: ${clientIp}`,
    );

    // Credentials are valid, generate a JWT
    const token = jwt.sign(
      { username: sanitizedUsername }, // Payload
      jwtSecret, // Secret key
      { expiresIn: `${tokenExpiryHours}h` }, // Expiration
    );

    // Return the token
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-store, no-cache, must-revalidate, private",
      },
      body: JSON.stringify({ token }),
    };
  } catch (error) {
    console.error("Unexpected error during login:", {
      message: error.message,
      stack: error.stack,
      ip: clientIp,
    });
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ error: USER_ERRORS.SERVER_ERROR }),
    };
  }
};
