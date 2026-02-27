exports.handler = async () => {
  const res = await fetch("https://api.daily.co/v1/rooms", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.DAILY_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      properties: {
        enable_chat: true
      }
    })
  });

  const data = await res.json();

  return {
    statusCode: 200,
    body: JSON.stringify({ url: data.url })
  };
};
