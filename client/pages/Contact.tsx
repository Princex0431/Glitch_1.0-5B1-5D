import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

export default function Contact() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return toast({ title: "Please add a message" });
    setSending(true);
    try {
      // For now persist to localStorage and show toast. In production, send to a backend or email service.
      const existing = JSON.parse(localStorage.getItem("contact_messages" ) || "[]");
      existing.unshift({ name, email, message, at: new Date().toISOString() });
      localStorage.setItem("contact_messages", JSON.stringify(existing.slice(0, 50)));
      toast({ title: "Message saved", description: "Thanks — we will get back to you." });
      setName(""); setEmail(""); setMessage("");
    } catch (err) {
      toast({ title: "Failed to save message" });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-extrabold">Contact us</h1>
        <p className="text-muted-foreground">Have feedback or a question? Send us a message and we'll respond.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Send a message</CardTitle>
          <CardDescription>We read all messages and appreciate your input.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
              <Input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <Textarea placeholder="Your message" value={message} onChange={(e) => setMessage(e.target.value)} className="min-h-[160px]" />
            <div className="flex justify-end">
              <Button type="submit" disabled={sending}>{sending ? 'Sending...' : 'Send message'}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
