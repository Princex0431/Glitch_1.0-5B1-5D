import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/services/axios";
import {
  basicSimplify,
  findComplexWords,
  highlightComplexWords,
} from "@/lib/highlightWords";
import { FeynmanCard, FeynmanItem } from "@/components/FeynmanCard";
import Quiz from "@/components/Quiz";
import { isSupabaseEnabled, supabase } from "@/services/supabase";
import { Loader2, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

function saveLocal(item: FeynmanItem) {
  const list = loadLocal();
  list.unshift(item);
  localStorage.setItem("feynman_history", JSON.stringify(list.slice(0, 100)));
}
function loadLocal(): FeynmanItem[] {
  try {
    const raw = localStorage.getItem("feynman_history");
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export default function Index() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FeynmanItem | null>(null);
  const [recent, setRecent] = useState<FeynmanItem[]>(loadLocal());

  useEffect(() => {
    // Prefetch recent history from Supabase if available
    const fetchRemote = async () => {
      if (!isSupabaseEnabled || !supabase) return;
      const { data, error } = await supabase
        .from("concepts")
        .select("id, concept, explanation, highlightedHtml, createdAt")
        .order("createdAt", { ascending: false })
        .limit(6);
      if (!error && data) {
        setRecent(
          data.map((d: any) => ({
            id: d.id,
            concept: d.concept,
            explanation: d.explanation,
            highlightedHtml: d.highlightedHtml,
            createdAt: d.createdAt,
          })),
        );
      }
    };
    fetchRemote();
  }, []);

  const disabled = text.trim().length < 8 || loading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (disabled) return;
    setLoading(true);
    try {
      const concept = text.trim();
      let explanation = "";
      try {
        const { data } = await api.post("/simplify", { text: concept });
        // prefer explicit explanation, fall back to modelText if present
        explanation = String(data?.explanation ?? data?.modelText ?? "");
        // if server returned quiz, capture it
        var quizFromServer: any[] | undefined = Array.isArray(data?.quiz)
          ? data.quiz
          : undefined;
        if (data?.ai_error) {
          const { toast } = await import("@/hooks/use-toast");
          toast({ title: "AI service warning", description: String(data.ai_error) });
        } else if (!String(data?.explanation) && String(data?.modelText)) {
          // inform the user we're showing the raw model output
          const { toast } = await import("@/hooks/use-toast");
          toast({ title: "Using model output", description: "Showing model-provided simplification text." });
        }
      } catch (err) {
        explanation = basicSimplify(concept);
        const { toast } = await import("@/hooks/use-toast");
        toast({ title: "Offline fallback", description: "Could not reach AI service, using local simplifier." });
      }
      const complex = findComplexWords(explanation || concept);
      const highlightedHtml = highlightComplexWords(
        explanation || concept,
        complex,
      );
      const item: FeynmanItem = {
        id: crypto.randomUUID(),
        concept,
        explanation: explanation || concept,
        highlightedHtml,
        createdAt: new Date().toISOString(),
        quiz: quizFromServer,
      };
      setResult(item);
      setRecent((prev) => [item, ...prev].slice(0, 6));
      if (isSupabaseEnabled && supabase) {
        const { error } = await supabase.from("concepts").insert({
          id: item.id,
          concept: item.concept,
          explanation: item.explanation,
          highlightedHtml: item.highlightedHtml,
          quiz: item.quiz ?? null,
          createdAt: item.createdAt,
        });
        if (error) saveLocal(item);
      } else {
        saveLocal(item);
      }
      setText("");
    } finally {
      setLoading(false);
    }
  };

  const hero = useMemo(
    () => (
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center space-y-4">
        <motion.div initial={{ scale: 0.98 }} animate={{ scale: 1 }} transition={{ duration: 0.6 }} className="inline-flex items-center gap-2 rounded-full border border-border bg-background/60 px-3 py-1 text-xs text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          Learn faster with the Feynman Technique
        </motion.div>
        <motion.h1 initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12, duration: 0.6 }} className="text-4xl sm:text-5xl font-extrabold tracking-tight">
          Explain anything in simple words
        </motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="text-muted-foreground max-w-2xl mx-auto">
          Paste a concept. We rewrite it in plain language and highlight tricky words. Save and revisit your learning history anywhere.
        </motion.p>
      </motion.div>
    ),
    [],
  );


  return (
    <div className="space-y-10">
      {hero}
      <Card>
        <CardHeader>
          <CardTitle>Break it down</CardTitle>
          <CardDescription>
            Paste a concept and get a simpler explanation with highlighted
            complex words.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Textarea
              placeholder="Paste complex text or describe a concept..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="min-h-[140px] text-base"
            />
            <div className="flex items-center justify-between gap-3">
              <div className="text-xs text-muted-foreground">
                Tip: Try pasting a dense paragraph from a paper. We'll simplify
                it.
              </div>
              <motion.div whileTap={{ scale: 0.98 }}>
                <Button type="submit" disabled={disabled}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <motion.span whileHover={{ scale: 1.03 }} transition={{ type: 'spring', stiffness: 300 }}>
                    Simplify
                  </motion.span>
                </Button>
              </motion.div>
            </div>
          </form>
        </CardContent>
      </Card>

      {result && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Latest explanation</h2>
          <FeynmanCard item={result} />
          {result.quiz && result.quiz.length > 0 && (
            <div className="mt-4">
              <Quiz quiz={result.quiz} conceptId={result.id} />
            </div>
          )}
        </div>
      )}

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Recent</h2>
          <Badge variant="secondary">{recent.length}</Badge>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recent.map((r) => (
            <FeynmanCard key={r.id} item={r} />
          ))}
          {recent.length === 0 && (
            <p className="text-muted-foreground">
              No history yet. Start by simplifying your first concept.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
