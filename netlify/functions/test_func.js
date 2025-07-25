export default async (req, context) => {
  const allowedOrigins = [
    "http://127.0.0.1:1025",      // local dev (Zola)
    "https://allergyguide.ca"     // production
  ];

  const origin = req.headers.get("origin");
  const allowOrigin = allowedOrigins.includes(origin) ? origin : "";

  const corsHeaders = {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Headers": "X-API-Key",
    "Access-Control-Allow-Methods": "GET, OPTIONS"
  };

  // ✅ Preflight handler
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  const requestKey = req.headers.get("X-API-Key");
  const apiKey = process.env.SHUFFLE_KEY;

  if (requestKey === apiKey) {
    return new Response("Welcome!", {
      status: 200,
      headers: corsHeaders
    });
  }

  return new Response("Sorry, no access for you.", {
    status: 401,
    headers: corsHeaders
  });
};
