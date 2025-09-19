import { RequestHandler } from "express";
import axios from "axios";

export const handleSimplify: RequestHandler = async (req, res) => {
  const text = String(req.body?.text ?? "").trim();
  if (!text) return res.status(400).json({ error: "Missing text in request body" });

  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "Server not configured with Google Gemini API key" });

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta2/models/text-bison-001:generateText?key=${apiKey}`;
    const payload = {
      prompt: {
        text: `Please simplify the following text for a general audience. Keep the meaning but use short, clear sentences and plain words. Output only the simplified explanation. Text:\n\n"${text}"`,
      },
      temperature: 0.2,
      maxOutputTokens: 512,
    };

    const response = await axios.post(url, payload, { timeout: 20000 });
    const data = response.data ?? {};

    // Parse several possible response shapes from the generative language API
    let explanation = "";
    if (Array.isArray(data.candidates) && data.candidates.length > 0) {
      explanation = data.candidates[0].content || data.candidates[0].output || "";
    } else if (Array.isArray(data.output) && data.output.length > 0) {
      explanation = data.output.map((o: any) => o.content || o.text || "").join("\n");
    } else if (typeof data.result === "string") {
      explanation = data.result;
    } else if (typeof data.text === "string") {
      explanation = data.text;
    }

    explanation = explanation || "";
    res.json({ explanation });
  } catch (err: any) {
    console.error("Gemini API error:", err?.response?.data ?? err.message ?? err);
    res.status(500).json({ error: "Failed to generate simplified text" });
  }
};
