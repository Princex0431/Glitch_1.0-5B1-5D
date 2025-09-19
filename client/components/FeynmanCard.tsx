import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { fetchDefinitions } from "@/lib/dictionary";

export interface FeynmanItem {
  id: string;
  concept: string;
  explanation: string;
  highlightedHtml: string;
  createdAt: string;
}

export function FeynmanCard({ item }: { item: FeynmanItem }) {
  const [definitions, setDefinitions] = useState<Record<string, string>>({});
  const [open, setOpen] = useState<string | null>(null);

  const words = useMemo(() => {
    const div = document.createElement("div");
    div.innerHTML = item.highlightedHtml;
    const marks = Array.from(div.querySelectorAll("mark"));
    const set = new Set<string>();
    for (const m of marks) {
      const text = m.textContent?.trim() || "";
      if (text) set.add(text.replace(/[^A-Za-z0-9\-']/g, "").toLowerCase());
    }
    return Array.from(set).slice(0, 12);
  }, [item.highlightedHtml]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (words.length === 0) return;
      const defs = await fetchDefinitions(words);
      if (!mounted) return;
      setDefinitions(defs);
    })();
    return () => {
      mounted = false;
    };
  }, [words]);

  const html = useMemo(() => {
    const div = document.createElement("div");
    div.innerHTML = item.highlightedHtml;
    const marks = Array.from(div.querySelectorAll("mark"));
    for (const m of marks) {
      const text = m.textContent || "";
      const word = text.replace(/[^A-Za-z0-9\-']/g, "");
      const key = word.toLowerCase();
      const a = document.createElement("a");
      a.className =
        "px-1 rounded bg-amber-200/80 dark:bg-amber-400/30 text-amber-900 dark:text-amber-100 hover:underline focus:outline-none focus:ring-2 focus:ring-amber-300";
      a.setAttribute("data-word", key);
      const wikiText = String(text).trim();
      const wikiSlug = wikiText.replace(/\s+/g, "_");
      a.href = `https://en.wikipedia.org/wiki/${encodeURIComponent(wikiSlug)}`;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.title = `Open ${wikiText} on Wikipedia`;
      a.innerHTML = text;
      // prevent card click handlers from firing when clicking the link
      a.onclick = (e: MouseEvent) => {
        e.stopPropagation();
      };
      m.parentNode?.replaceChild(a, m);
    }
    return div.innerHTML;
  }, [item.highlightedHtml]);

  return (
    <Card className="hover:shadow-xl transition-shadow transform hover:-translate-y-1 hover:scale-[1.01] duration-300">
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-2">
          <span className="truncate" title={item.concept}>
            {item.concept}
          </span>
          <Badge variant="secondary">
            {new Date(item.createdAt).toLocaleString()}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="prose prose-sm dark:prose-invert max-w-none relative">
        <div dangerouslySetInnerHTML={{ __html: html }} />
        {open && (
          <div className="absolute right-4 top-4 w-64 bg-card/90 border border-border p-3 rounded shadow-lg">
            <h4 className="font-semibold text-sm mb-1">{open}</h4>
            <p className="text-sm text-muted-foreground">
              {definitions[open] || "Loading definition..."}
            </p>
            <div className="mt-2 flex justify-end">
              <button
                className="text-xs text-primary underline"
                onClick={() => setOpen(null)}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
