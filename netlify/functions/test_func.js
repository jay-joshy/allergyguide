export default async (req, context) => {
  const requestKey = req.headers.get("X-API-Key");
  const apiKey = process.env.SHUFFLE_KEY;

  if (requestKey === apiKey) {
    return new Response("Welcome!");
  }

  return new Response("Sorry, no access for you.", { status: 401 });
};
