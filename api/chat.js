export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { messages } = req.body || {};

    if (!Array.isArray(messages)) {
      return res.status(400).json({
        error: "Messages missing"
      });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        error: "OPENAI_API_KEY is missing in Vercel"
      });
    }

    const input = messages.map((m) => ({
      role: m.role === "ai" ? "assistant" : m.role,
      content: String(m.content || "")
    }));

    const response = await fetch(
      "https://api.openai.com/v1/responses",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-5",
          instructions:
            "You are Nexora AI, a helpful and intelligent AI assistant. Answer clearly and naturally. If the user speaks Hinglish, reply in Hinglish.",
          input: input
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data?.error?.message || "OpenAI API error"
      });
    }

    return res.status(200).json({
      reply: data.output_text || "Sorry, I couldn't generate a reply."
    });

  } catch (error) {
    return res.status(500).json({
      error: error.message || "Server error"
    });
  }
}
