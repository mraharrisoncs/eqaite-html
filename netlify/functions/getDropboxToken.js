exports.handler = async function (event, context) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers };
  }

  const token = process.env.DROPBOX_TOKEN || "";

  if (!token) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "DROPBOX_TOKEN not configured on server" })
    };
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ token })
  };
};