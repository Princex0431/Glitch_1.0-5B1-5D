import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { fetchDefinitions } from "@/lib/dictionary";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";

export interface FeynmanItem {
  id: string;
  concept: string;
  explanation: string;
  highlightedHtml: string;
  createdAt: string;
}

export function FeynmanCard({ item }: { item: FeynmanItem }) {
  const [definitions, setDefinitions] = useState<Record<string, string>>({});
  const [openInline, setOpenInline] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);

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

  // Lazy-load definitions only when requested (reduce background network calls)
  const loadDefinitions = async (keys: string[]) => {
    if (!keys || keys.length === 0) return;
    try {
      const defs = await fetchDefinitions(keys);
      setDefinitions((prev) => ({ ...prev, ...defs }));
    } catch (e) {
      // ignore
    }
  };

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
        "px-1 rounded bg-amber-200/80 dark:bg-amber-400/30 text-amber-900 dark:text-amber-100 hover:underline focus:outline-none focus:ring-2 focus:ring-amber-300 inline-block";
      a.setAttribute("data-word", key);
      const wikiText = String(text).trim();
      const wikiSlug = wikiText.replace(/\s+/g, "_");
      a.href = `https://en.wikipedia.org/wiki/${encodeURIComponent(wikiSlug)}`;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.title = `Open ${wikiText} on Wikipedia`;
      a.innerHTML = text;
      // prevent outer click handlers from firing when clicking the link
      a.onclick = (e: MouseEvent) => {
        e.stopPropagation();
      };

      // wrapper span to include an inline 'def' button
      const wrapper = document.createElement("span");
      wrapper.className = "inline-flex items-center gap-2";
      wrapper.appendChild(a);

      const info = document.createElement("button");
      info.className = "ml-1 text-xs text-primary underline";
      info.innerText = "def";
      info.onclick = (e: MouseEvent) => {
        e.stopPropagation();
        // call React state via global shim
        (window as any).__FEYNMAN_OPEN_DEF?.(key);
      };
      wrapper.appendChild(info);

      m.parentNode?.replaceChild(wrapper, m);
    }
    return div.innerHTML;
  }, [item.highlightedHtml]);

  // Expose a bridge for the dynamically created info buttons to toggle inline definition
  useEffect(() => {
    (window as any).__FEYNMAN_OPEN_DEF = (k: string) =>
      setOpenInline((s) => (s === k ? null : k));
    return () => {
      (window as any).__FEYNMAN_OPEN_DEF = undefined;
    };
  }, []);

  return (
    <>
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogTrigger asChild>
          <div
            onClick={() => setOpenDialog(true)}
            className="hover:shadow-xl transition-shadow transform hover:-translate-y-1 hover:scale-[1.01] duration-300 cursor-pointer"
          >
            <Card>
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
                {openInline && (
                  <div className="absolute right-4 top-4 w-64 bg-card/90 border border-border p-3 rounded shadow-lg">
                    <h4 className="font-semibold text-sm mb-1">{openInline}</h4>
                    <p className="text-sm text-muted-foreground">
                      {definitions[openInline] || "Loading definition..."}
                    </p>
                    <div className="mt-2 flex justify-end">
                      <button
                        className="text-xs text-primary underline"
                        onClick={() => setOpenInline(null)}
                      >
                        Close
                      </button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </DialogTrigger>

        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{item.concept}</DialogTitle>
            <DialogDescription>
              Full preview & explanation. Click outside or press Esc to close.
            </DialogDescription>
          </DialogHeader>

          <div className="prose max-w-none mt-4">
            <div dangerouslySetInnerHTML={{ __html: item.highlightedHtml }} />
            <hr className="my-4" />
            <div>
              <h3 className="text-sm font-semibold mb-2">
                Simplified explanation
              </h3>
              <p>{item.explanation}</p>
            </div>
            <div className="mt-4">
              <h4 className="text-sm font-semibold mb-2">Definitions</h4>
              <ul className="list-disc pl-5 text-sm text-muted-foreground">
                {Object.keys(definitions).length === 0 && (
                  <li>Loading definitions...</li>
                )}
                {Object.entries(definitions).map(([k, v]) => (
                  <li key={k}>
                    <strong>{k}</strong>: {v}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
