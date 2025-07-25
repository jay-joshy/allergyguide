export default async (req, context) => {
  const headers = {
    "Access-Control-Allow-Origin": "*", // Or your exact frontend origin like "http://127.0.0.1:1025"
    "Access-Control-Allow-Headers": "X-API-Key",
    "Access-Control-Allow-Methods": "GET, OPTIONS"
  };

  // ✅ Handle preflight (OPTIONS)
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers
    });
  }

  const requestKey = req.headers.get("X-API-Key");
  const apiKey = process.env.SHUFFLE_KEY;

  if (requestKey === apiKey) {
    return new Response("Welcome!", {
      status: 200,
      headers
    });
  }

  return new Response("Sorry, no access for you.", {
    status: 401,
    headers
  });
};

