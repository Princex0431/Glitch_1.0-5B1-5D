import { useEffect, useState } from "react";
import { FeynmanCard, FeynmanItem } from "@/components/FeynmanCard";
import { supabase, isSupabaseEnabled } from "@/services/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function loadLocal(): FeynmanItem[] {
  try {
    const raw = localStorage.getItem("feynman_history");
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export default function HistoryPage() {
  const [items, setItems] = useState<FeynmanItem[]>([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    const load = async () => {
      if (isSupabaseEnabled && supabase) {
        const { data, error } = await supabase
          .from("concepts")
          .select("id, concept, explanation, highlightedHtml, createdAt")
          .order("createdAt", { ascending: false });
        if (error) {
          setItems(loadLocal());
        } else if (data) {
          setItems(
            data.map((d: any) => ({
              id: d.id,
              concept: d.concept,
              explanation: d.explanation,
              highlightedHtml: d.highlightedHtml,
              createdAt: d.createdAt,
            })),
          );
        }
      } else {
        setItems(loadLocal());
      }
    };
    load();
  }, []);

  const filtered = items.filter((i) =>
    [i.concept, i.explanation].some((t) =>
      t.toLowerCase().includes(q.toLowerCase()),
    ),
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-2xl font-bold tracking-tight">History</h1>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search concepts..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-64"
          />
          <Button variant="outline" onClick={() => setQ("")}>
            Clear
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((item) => (
          <FeynmanCard key={item.id} item={item} />
        ))}
        {filtered.length === 0 && (
          <p className="text-muted-foreground">No results.</p>
        )}
      </div>
    </div>
  );
}
