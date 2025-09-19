const COMMON_WORDS = new Set([
  "the",
  "be",
  "to",
  "of",
  "and",
  "a",
  "in",
  "that",
  "have",
  "i",
  "it",
  "for",
  "not",
  "on",
  "with",
  "he",
  "as",
  "you",
  "do",
  "at",
  "this",
  "but",
  "his",
  "by",
  "from",
  "they",
  "we",
  "say",
  "her",
  "she",
  "or",
  "an",
  "will",
  "my",
  "one",
  "all",
  "would",
  "there",
  "their",
  "what",
  "so",
  "up",
  "out",
  "if",
  "about",
  "who",
  "get",
  "which",
  "go",
  "me",
  "when",
  "make",
  "can",
  "like",
  "time",
  "no",
  "just",
  "him",
  "know",
  "take",
  "people",
  "into",
  "year",
  "your",
  "good",
  "some",
  "could",
  "them",
  "see",
  "other",
  "than",
  "then",
  "now",
  "look",
  "only",
  "come",
  "its",
  "over",
  "think",
  "also",
  "back",
  "after",
  "use",
  "two",
  "how",
  "our",
  "work",
  "first",
  "well",
  "way",
  "even",
  "new",
  "want",
  "because",
  "any",
  "these",
  "give",
  "day",
  "most",
  "us",
]);

export function findComplexWords(text: string) {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s\-']/g, " ")
    .split(/\s+/)
    .filter(Boolean);

  const freq = new Map<string, number>();
  for (const w of words) freq.set(w, (freq.get(w) || 0) + 1);

  const complex = new Set<string>();
  for (const [w] of freq) {
    const isCommon = COMMON_WORDS.has(w);
    const isNumeric = /^\d+$/.test(w);
    const long = w.length >= 9;
    const hasHyphen = w.includes("-");
    if (!isCommon && !isNumeric && (long || hasHyphen)) complex.add(w);
  }
  return complex;
}

export function highlightComplexWords(text: string, complex: Set<string>) {
  if (complex.size === 0) return text;
  const tokenRe = /([A-Za-z0-9\-']+|[^A-Za-z0-9\-']+)/g;
  return text.replace(tokenRe, (token) => {
    const pure = token.replace(/[^A-Za-z0-9\-']/g, "");
    if (pure && complex.has(pure.toLowerCase())) {
      return `<mark class="bg-amber-200/70 dark:bg-amber-400/30 text-amber-900 dark:text-amber-100 rounded px-1">${token}</mark>`;
    }
    return token;
  });
}

export function basicSimplify(text: string) {
  // Heuristic simplification: short sentences, simpler synonyms when obvious
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const simplified = sentences
    .map((s) =>
      s
        .replace(/utili[sz]e/gi, "use")
        .replace(/approximately/gi, "about")
        .replace(/component/gi, "part")
        .replace(/methodology/gi, "method")
        .replace(/commence/gi, "start")
        .replace(/terminate/gi, "end")
        .replace(/facilitate/gi, "help")
        .replace(/numerous/gi, "many")
        .replace(/subsequently/gi, "then")
        .replace(/therefore/gi, "so"),
    )
    .map((s) => (s.length > 160 ? s.slice(0, 157) + "..." : s))
    .join(" ");
  return simplified || text;
}
