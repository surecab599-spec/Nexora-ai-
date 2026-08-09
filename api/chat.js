module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "GEMINI_API_KEY Vercel Environment Variable me nahi mila."
      });
    }

    const body = req.body || {};
    const messages = Array.isArray(body.messages) ? body.messages : [];

    const contents = messages
      .filter(m =>
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string"
      )
      .slice(-30)
      .map(m => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }]
      }));

    if (!contents.length) {
      return res.status(400).json({
        error: "Message empty hai."
      });
    }

    const systemInstruction = {
      parts: [{
        text:
          "You are Nexora AI, a helpful general-purpose AI assistant. " +
          "If the user speaks Hindi or Hinglish, reply in Hindi or Hinglish. " +
          "Answer naturally, accurately and clearly. " +
          "Help with questions, coding, study, ideas, explanations and general tasks."
      }]
    };

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" +
      encodeURIComponent(apiKey),
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          systemInstruction,
          contents,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048
          }
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error:
          data?.error?.message ||
          "Gemini API error"
      });
    }

    const reply =
      data?.candidates?.[0]?.content?.parts
        ?.map(part => part.text || "")
        .join("")
        .trim();

    if (!reply) {
      return res.status(500).json({
        error: "Gemini ne response nahi diya."
      });
    }

    return res.status(200).json({
      reply
    });

  } catch (error) {
    return res.status(500).json({
      error: error.message || "Server error"
    });
  }
};
