import { RequestHandler } from "express";
import axios from "axios";

export const handleDefine: RequestHandler = async (req, res) => {
  const words: string[] = (() => {
    const b = req.body;
    if (!b) return [];
    if (typeof b.word === "string") return [b.word];
    if (Array.isArray(b.words)) return b.words.filter(Boolean).map(String);
    return [];
  })();

  if (words.length === 0) return res.status(400).json({ error: "No word(s) provided" });

  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "Server not configured with Google Gemini API key" });

  try {
    // Build a concise prompt that asks definitions for each word
    const promptText = `Provide concise, one-sentence plain-language definitions for the following words. Return JSON object mapping each word to its definition. Words: ${words.join(", ")}`;

    const url = `https://generativelanguage.googleapis.com/v1beta2/models/text-bison-001:generateText?key=${apiKey}`;
    const payload = {
      prompt: { text: promptText },
      temperature: 0.0,
      maxOutputTokens: 256,
    };

    const response = await axios.post(url, payload, { timeout: 20000 });
    const data = response.data ?? {};

    // Try to extract text
    let text = "";
    if (Array.isArray(data.candidates) && data.candidates.length > 0) {
      text = data.candidates[0].content || data.candidates[0].output || "";
    } else if (typeof data.result === "string") {
      text = data.result;
    } else if (typeof data.text === "string") {
      text = data.text;
    }

    // Attempt to parse JSON from the model output
    let parsed: Record<string, string> = {};
    try {
      // Some models may include backticks or code fences
      const maybeJson = text.trim().replace(/^```json\s*/i, "").replace(/```$/, "").trim();
      parsed = JSON.parse(maybeJson);
    } catch {
      // Fallback: attempt to extract lines like "word: definition"
      const lines = text.split(/\n+/).map((l: string) => l.trim()).filter(Boolean);
      for (const line of lines) {
        const m = line.match(/^"?([^":]+)"?\s*[:\-]\s*(.+)$/);
        if (m) {
          parsed[m[1].trim()] = m[2].trim();
        }
      }
    }

    // Ensure each requested word has a definition; if missing, set empty string
    const result: Record<string, string> = {};
    for (const w of words) {
      result[w] = parsed[w] ?? parsed[w.toLowerCase()] ?? parsed[w.toUpperCase()] ?? "";
    }

    res.json({ definitions: result, raw: text });
  } catch (err: any) {
    console.error("Define API error:", err?.response?.data ?? err.message ?? err);
    res.status(500).json({ error: "Failed to fetch definitions" });
  }
};
