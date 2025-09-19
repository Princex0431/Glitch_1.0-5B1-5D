import { RequestHandler } from "express";
import axios from "axios";

function parseModelText(data: any) {
  if (!data) return "";
  if (Array.isArray(data.candidates) && data.candidates.length > 0) {
    return data.candidates[0].content || data.candidates[0].output || "";
  }
  if (Array.isArray(data.output) && data.output.length > 0) {
    return data.output.map((o: any) => o.content || o.text || "").join("\n");
  }
  if (typeof data.result === "string") return data.result;
  if (typeof data.text === "string") return data.text;
  return "";
}

function heuristicQuestions(text: string) {
  // Simple fallback: produce 5 short questions from sentences and keywords
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const questions: any[] = [];
  const keywords = Array.from(
    new Set(
      text
        .replace(/[^A-Za-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter((w) => w.length > 5)
        .slice(0, 10),
    ),
  );

  for (let i = 0; i < 5; i++) {
    const qText = sentences[i] ? `In your own words, what does this mean: \"${sentences[i].slice(0, 120)}\"` : `What is the main idea of the text?`;
    const key = keywords[i] || keywords[0] || "concept";
    const options = [key, key + "s", "an idea", "a detail"].slice(0, 4);
    questions.push({ question: qText, options, answerIndex: 0, explanation: "" });
  }
  return questions;
}

export const handleSimplify: RequestHandler = async (req, res) => {
  const text = String(req.body?.text ?? "").trim();
  if (!text) return res.status(400).json({ error: "Missing text in request body" });

  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;

  try {
    let explanation = "";
    const quiz: any[] = [];

    if (apiKey) {
      const url = `https://generativelanguage.googleapis.com/v1beta2/models/text-bison-001:generateText?key=${apiKey}`;

      // 1) Simplify
      const simplePrompt = {
        prompt: {
          text: `Please simplify the following text for a general audience. Keep the meaning but use short, clear sentences and plain words. Output only the simplified explanation. Text:\n\n"${text}"`,
        },
        temperature: 0.2,
        maxOutputTokens: 512,
      };

      const resp1 = await axios.post(url, simplePrompt, { timeout: 20000 });
      explanation = parseModelText(resp1.data) || "";

      // 2) Generate quiz questions (JSON)
      const quizPrompt = {
        prompt: {
          text: `Create 5 short comprehension quiz questions (with 4 options each) based on the following text. Provide the output as a JSON object: { \"quiz\": [ { \"question\": string, \"options\": [string], \"answerIndex\": number, \"explanation\": string } ] }. Be concise. Text:\n\n"${explanation || text}"`,
        },
        temperature: 0.1,
        maxOutputTokens: 512,
      };

      const resp2 = await axios.post(url, quizPrompt, { timeout: 20000 });
      const quizText = parseModelText(resp2.data) || "";

      // Try to parse JSON out of the model response
      try {
        const maybe = quizText.trim().replace(/^```json\s*/i, "").replace(/```$/, "").trim();
        const parsed = JSON.parse(maybe);
        if (Array.isArray(parsed?.quiz)) {
          for (const q of parsed.quiz.slice(0, 10)) {
            if (q && q.question && Array.isArray(q.options)) quiz.push(q);
          }
        }
      } catch (e) {
        // fallback: try to extract simple Q/A lines
        try {
          const lines = quizText.split(/\n+/).map((l: string) => l.trim()).filter(Boolean);
          for (const line of lines) {
            const m = line.match(/^\d+\.\s*(.+)$/);
            if (m && quiz.length < 5) {
              quiz.push({ question: m[1], options: ["True", "False"], answerIndex: 0, explanation: "" });
            }
          }
        } catch {}
      }
    }

    if (!explanation) {
      // fallback to server-side heuristics if Gemini not available or failed
      explanation = text.split(/(?<=[.!?])\s+/).slice(0, 3).join(" ") || text;
    }

    if (quiz.length === 0) {
      // heuristic quiz
      quiz.push(...heuristicQuestions(text));
    }

    // return explanation and quiz
    res.json({ explanation, quiz: quiz.slice(0, 10) });
  } catch (err: any) {
    console.error("Gemini API error:", err?.response?.data ?? err.message ?? err);
    // fallback: return heuristic simplification and questions
    const explanation = text.split(/(?<=[.!?])\s+/).slice(0, 3).join(" ") || text;
    const quiz = heuristicQuestions(text);
    res.json({ explanation, quiz });
  }
};
