export default async (req, context) => {
  const requestKey = req.headers.get("X-API-Key");
  const apiKey = process.env.SHUFFLE_KEY;

  const headers = {
    "Access-Control-Allow-Origin": "*", // or a specific domain if you prefer
    "Access-Control-Allow-Headers": "X-API-Key"
  };

  if (requestKey === apiKey) {
    return new Response("Welcome!", { status: 200, headers });
  }

  return new Response("Sorry, no access for you.", { status: 401, headers });
};

