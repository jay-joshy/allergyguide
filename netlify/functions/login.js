// netlify/functions/login.js
const jwt = require('jsonwebtoken');

exports.handler = async (event) => {
  // Ensure this is a POST request
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

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
      return {
        statusCode: 401,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Invalid credentials' })
      };
    }

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
