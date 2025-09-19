import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/services/axios";
import { basicSimplify, findComplexWords, highlightComplexWords } from "@/lib/highlightWords";
import { FeynmanCard, FeynmanItem } from "@/components/FeynmanCard";
import { isSupabaseEnabled, supabase } from "@/services/supabase";
import { Loader2, Sparkles } from "lucide-react";

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
        explanation = String(data?.explanation ?? "");
      } catch {
        explanation = basicSimplify(concept);
      }
      const complex = findComplexWords(explanation || concept);
      const highlightedHtml = highlightComplexWords(explanation || concept, complex);
      const item: FeynmanItem = {
        id: crypto.randomUUID(),
        concept,
        explanation: explanation || concept,
        highlightedHtml,
        createdAt: new Date().toISOString(),
      };
      setResult(item);
      setRecent((prev) => [item, ...prev].slice(0, 6));
      if (isSupabaseEnabled && supabase) {
        const { error } = await supabase.from("concepts").insert({
          id: item.id,
          concept: item.concept,
          explanation: item.explanation,
          highlightedHtml: item.highlightedHtml,
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
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background/60 px-3 py-1 text-xs text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          Learn faster with the Feynman Technique
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
          Explain anything in simple words
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Paste a concept. We rewrite it in plain language and highlight tricky words. Save and revisit your learning history anywhere.
        </p>
      </div>
    ),
    [],
  );

  return (
    <div className="space-y-10">
      {hero}
      <Card>
        <CardHeader>
          <CardTitle>Break it down</CardTitle>
          <CardDescription>Paste a concept and get a simpler explanation with highlighted complex words.</CardDescription>
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
                Tip: Try pasting a dense paragraph from a paper. We'll simplify it.
              </div>
              <Button type="submit" disabled={disabled}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Simplify
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {result && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Latest explanation</h2>
          <FeynmanCard item={result} />
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
            <p className="text-muted-foreground">No history yet. Start by simplifying your first concept.</p>
          )}
        </div>
      </section>
    </div>
  );
}
