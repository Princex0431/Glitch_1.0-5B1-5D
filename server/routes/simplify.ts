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
    const qText = sentences[i]
      ? `In your own words, what does this mean: \"${sentences[i].slice(0, 120)}\"`
      : `What is the main idea of the text?`;
    const key = keywords[i] || keywords[0] || "concept";
    const options = [key, key + "s", "an idea", "a detail"].slice(0, 4);
    questions.push({
      question: qText,
      options,
      answerIndex: 0,
      explanation: "",
    });
  }
  return questions;
}

export const handleSimplify: RequestHandler = async (req, res) => {
  const text = String(req.body?.text ?? "").trim();
  if (!text)
    return res.status(400).json({ error: "Missing text in request body" });

  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;

  try {
    let explanation = "";
    const quiz: any[] = [];

    if (apiKey) {
      const url = `https://generativelanguage.googleapis.com/v1beta2/models/text-bison-001:generateText?key=${apiKey}`;

      // 1) Simplify
      const simplePrompt = {
        prompt: {
          text: `Please simplify the following text for a general audience. Keep the meaning but use short, clear sentences and plain words. Output ONLY the simplified explanation as plain text (no JSON, no extra commentary). Text:\n\n"${text}"`,
        },
        temperature: 0.2,
        maxOutputTokens: 512,
      };

      let ai_error: string | null = null;
      try {
        const resp1 = await axios.post(url, simplePrompt, { timeout: 20000 });
        const modelText = parseModelText(resp1.data) || "";
        explanation = modelText;
      } catch (e: any) {
        ai_error = `AI simplification failed: ${e?.response?.data ?? e.message ?? String(e)}`;
        explanation = "";
      }

      // 2) Generate quiz questions (JSON)
      // Stronger prompt: require JSON only, unique options, plausible distractors
      const quizPrompt = {
        prompt: {
          text: `You will generate a SHORT multiple-choice quiz for a learner based solely on the text provided. Requirements:
1) Output ONLY valid JSON and nothing else.
2) Return an object with a single key "quiz" whose value is an array of exactly 5 items.
3) Each item must have: "question" (string), "options" (array of 4 unique short strings), "answerIndex" (0-3 index of the correct option), and "explanation" (one-sentence explanation of the correct answer).
4) Distractors (incorrect options) must be plausible and related to the question—avoid repeating the same option text for every question.
5) Ensure options are distinct (no duplicates) and appropriate length (short phrases or single-sentence answers).
6) If you cannot produce 5 high-quality questions, produce fewer but make them good.

Provide the quiz for the following text:
"""
${explanation || text}
"""

Remember: JSON only. Example output schema:
{"quiz": [{"question":"...","options":["a","b","c","d"],"answerIndex":0,"explanation":"..."}, ...]}`,
        },
        temperature: 0.1,
        maxOutputTokens: 700,
      };

      // Try multiple attempts to get valid JSON and well-formed options
      let attempts = 0;
      let quizText = "";
      let parsedQuiz: any = null;
      while (attempts < 3) {
        attempts++;
        const resp2 = await axios.post(url, quizPrompt, { timeout: 20000 });
        quizText = parseModelText(resp2.data) || "";

        // clean code fences
        const maybe = quizText
          .trim()
          .replace(/^```json\s*/i, "")
          .replace(/```$/, "")
          .trim();
        try {
          parsedQuiz = JSON.parse(maybe);
        } catch (err) {
          parsedQuiz = null;
        }

        // validate structure: quiz array and each question has 4 unique options
        if (
          parsedQuiz &&
          Array.isArray(parsedQuiz.quiz) &&
          parsedQuiz.quiz.length > 0
        ) {
          let ok = true;
          for (const q of parsedQuiz.quiz) {
            if (!q || typeof q.question !== "string") ok = false;
            if (!Array.isArray(q.options) || q.options.length < 2) ok = false;
            // ensure options are unique
            if (Array.isArray(q.options)) {
              const uniq = new Set(q.options.map((o: any) => String(o).trim()));
              if (uniq.size !== q.options.length) ok = false;
            }
            if (typeof q.answerIndex !== "number") ok = false;
          }
          if (ok) break; // accept parsedQuiz
        }

        // If failed validation, try again with a clarifying prompt that asks for strict JSON only
        if (attempts < 3) {
          quizPrompt.prompt.text = `Previous output could not be parsed as valid JSON meeting the schema. Please OUTPUT STRICT JSON ONLY following this schema and the previous instructions.\n\nOriginal text:\n"""\n${explanation || text}\n"""`;
        }
      }

      if (parsedQuiz && Array.isArray(parsedQuiz.quiz)) {
        for (const q of parsedQuiz.quiz.slice(0, 10)) {
          if (q && q.question && Array.isArray(q.options)) {
            // coerce to expected shape and cap options to 4
            const opts = q.options.slice(0, 4).map((o: any) => String(o));
            quiz.push({
              question: String(q.question),
              options: opts,
              answerIndex: Number(q.answerIndex ?? 0),
              explanation: String(q.explanation ?? ""),
            });
          }
        }
      } else {
        // fallback: heuristic generation if model fails entirely
        try {
          quiz.push(...heuristicQuestions(text));
        } catch {}
      }
    }

    if (!explanation) {
      // fallback to server-side heuristics if Gemini not available or failed
      explanation =
        text
          .split(/(?<=[.!?])\s+/)
          .slice(0, 3)
          .join(" ") || text;
    }

    if (quiz.length === 0) {
      // heuristic quiz
      quiz.push(...heuristicQuestions(text));
    }

    // return explanation and quiz and modelText for debugging/fallback
    res.json({ explanation, modelText: explanation, quiz: quiz.slice(0, 10) });
  } catch (err: any) {
    console.error(
      "Gemini API error:",
      err?.response?.data ?? err.message ?? err,
    );
    // fallback: return heuristic simplification and questions
    const explanation =
      text
        .split(/(?<=[.!?])\s+/)
        .slice(0, 3)
        .join(" ") || text;
    const quiz = heuristicQuestions(text);
    res.json({ explanation, modelText: explanation, quiz });
  }
};
