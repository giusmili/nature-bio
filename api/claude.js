export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey =
    process.env.CLAUDE_API_KEY ||
    process.env.API_KEY_CLAUDE ||
    process.env.VITE_API_KEY_CLAUDE ||
    process.env.VITE_CLAUDE_API_KEY ||
    process.env.GEMINI_API_KEY ||
    process.env.API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: "Missing Claude API key" });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const { imageBase64, mimeType, langInstruction } = body || {};

    if (!imageBase64 || !mimeType) {
      return res.status(400).json({ error: "imageBase64 and mimeType are required" });
    }

    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-latest",
        max_tokens: 800,
        system:
          "You are an expert botanist and plant pathologist. Analyze images carefully for subtle signs of stress or disease. Respond ONLY with strict JSON.",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: mimeType,
                  data: imageBase64,
                },
              },
              {
                type: "text",
                text: langInstruction,
              },
            ],
          },
        ],
      }),
    });

    const json = await anthropicRes.json();
    if (!anthropicRes.ok) {
      return res.status(anthropicRes.status).json(json);
    }

    return res.status(200).json(json);
  } catch (error) {
    console.error("Claude proxy failed:", error);
    return res.status(500).json({ error: "Claude proxy error", detail: String(error) });
  }
}
