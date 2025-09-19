import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase, isSupabaseEnabled } from "@/services/supabase";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseEnabled) {
      setNotice(
        "Supabase is not configured. You can explore the app in guest mode, or add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable authentication.",
      );
    }
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!supabase) return;
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
      }
    } catch (err: any) {
      setError(err.message || "Authentication failed");
    }
  };

  const signInWithGoogle = async () => {
    if (!supabase) return;
    const { error } = await supabase.auth.signInWithOAuth({ provider: "google" });
    if (error) setError(error.message);
  };

  return (
    <div className="max-w-md mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>{mode === "signin" ? "Sign in" : "Create account"}</CardTitle>
        </CardHeader>
        <CardContent>
          {notice && (
            <Alert className="mb-4">
              <AlertTitle>Guest mode active</AlertTitle>
              <AlertDescription>{notice}</AlertDescription>
            </Alert>
          )}
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full">
              {mode === "signin" ? "Sign in" : "Sign up"}
            </Button>
          </form>
          <div className="my-4 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">or</span>
            <div className="h-px flex-1 bg-border" />
          </div>
          <Button onClick={signInWithGoogle} variant="outline" className="w-full" disabled={!isSupabaseEnabled}>
            <span className="mr-2 inline-flex"><svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303C33.602 32.91 29.197 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.058 0 5.842 1.154 7.961 3.039l5.657-5.657C34.676 6.053 29.614 4 24 4 12.954 4 4 12.954 4 24s8.954 20 20 20 20-8.954 20-20c0-1.341-.138-2.65-.389-3.917z"/><path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 16.108 18.961 13 24 13c3.058 0 5.842 1.154 7.961 3.039l5.657-5.657C34.676 6.053 29.614 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/><path fill="#4CAF50" d="M24 44c5.132 0 9.8-1.966 13.313-5.178l-6.147-5.196C29.197 36 24.792 32.91 24 32.91c-5.186 0-9.582-3.08-11.292-7.41l-6.57 5.061C9.487 39.63 16.198 44 24 44z"/><path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-1.358 4.91-5.763 8-11.303 8-5.186 0-9.582-3.08-11.292-7.41l-6.57 5.061C9.487 39.63 16.198 44 24 44c8.822 0 16.254-5.985 18.611-14.083C43.862 26.65 44 25.341 44 24c0-1.341-.138-2.65-.389-3.917z"/></svg></span>
            Continue with Google
          </Button>
          <p className="text-sm text-muted-foreground mt-4">
            {mode === "signin" ? (
              <>
                Don't have an account?{" "}
                <button className="text-primary underline" onClick={() => setMode("signup")}>Sign up</button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button className="text-primary underline" onClick={() => setMode("signin")}>Sign in</button>
              </>
            )}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
