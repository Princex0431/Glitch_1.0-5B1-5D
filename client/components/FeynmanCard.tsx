import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export interface FeynmanItem {
  id: string;
  concept: string;
  explanation: string;
  highlightedHtml: string;
  createdAt: string;
}

export function FeynmanCard({ item }: { item: FeynmanItem }) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-2">
          <span className="truncate" title={item.concept}>{item.concept}</span>
          <Badge variant="secondary">{new Date(item.createdAt).toLocaleString()}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="prose prose-sm dark:prose-invert max-w-none">
        <div dangerouslySetInnerHTML={{ __html: item.highlightedHtml }} />
      </CardContent>
    </Card>
  );
}
