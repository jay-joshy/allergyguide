// netlify/functions/shuffle.js

exports.handler = async (event, context) => {
  const allowedOrigin = "https://yourdomain.com"; // change to your real domain

  // Only allow from your domain
  if (event.headers.origin !== allowedOrigin) {
    return {
      statusCode: 403,
      body: JSON.stringify({ message: "Forbidden" }),
      headers: {
        'Access-Control-Allow-Origin': allowedOrigin,
      },
    };
  }

  // Allow preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': allowedOrigin,
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    };
  }

  try {
    const params = JSON.parse(event.body);

    const { seed, start, end } = params;

    if (typeof seed !== 'number' || typeof start !== 'number' || typeof end !== 'number') {
      return { statusCode: 400, body: "Invalid parameters" };
    }

    // Create the array
    let arr = [];
    for (let i = start; i <= end; i++) {
      arr.push(i);
    }

    // Seeded shuffle using a simple LCG (Linear Congruential Generator)
    let rng = mulberry32(seed);
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': allowedOrigin,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(arr),
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ message: err.message }) };
  }
};

// Seeded RNG function (good enough for shuffling)
function mulberry32(a) {
  return function() {
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
}
