import { Link, NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./ThemeToggle";
import { supabase, isSupabaseEnabled } from "@/services/supabase";
import { useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { motion } from "framer-motion";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    let unsub: (() => void) | undefined;
    const init = async () => {
      if (!supabase) return;
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      const { data: listener } = supabase.auth.onAuthStateChange((_e, s) => {
        setUser(s?.user ?? null);
      });
      unsub = () => listener?.subscription.unsubscribe();
    };
    init();
    return () => {
      unsub?.();
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <header className="sticky top-0 z-40 backdrop-blur supports-[backdrop-filter]:bg-background/70 border-b border-border">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <motion.div
              initial={{ scale: 0.9, rotate: -6 }}
              animate={{ scale: 1, rotate: 0 }}
              whileHover={{ scale: 1.08, rotate: 3 }}
              transition={{ type: "spring", stiffness: 300 }}
              className="h-9 w-9 rounded-lg bg-gradient-to-br from-primary to-fuchsia-500 shadow-md flex items-center justify-center"
            >
              <motion.span
                className="block h-4 w-4 bg-white rounded-sm"
                animate={{ rotate: [0, 45, 0] }}
                transition={{ repeat: Infinity, duration: 6, ease: "linear" }}
              />
            </motion.div>

            <motion.span
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              className="font-extrabold tracking-tight text-lg"
            >
              Feynman Technique Assistant
            </motion.span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <NavItem to="/" label="Home" />
            <NavItem to="/history" label="History" />
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {isSupabaseEnabled ? (
              user ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground hidden sm:inline">
                    {user.email}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => supabase?.auth.signOut()}
                  >
                    Sign out
                  </Button>
                </div>
              ) : (
                <Button asChild size="sm">
                  <Link to="/auth">Sign in</Link>
                </Button>
              )
            ) : (
              <span className="text-xs text-muted-foreground hidden sm:inline">
                Guest mode
              </span>
            )}
          </div>
        </div>
      </header>
      <main className="container py-8">{children}</main>
      <footer className="border-t border-border mt-12">
        <div className="container py-6 text-xs text-muted-foreground flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>
            Built with the Feynman learning principle. Simplify to understand.
          </p>
          <p>
            {isSupabaseEnabled ? "Synced with Supabase" : "Local storage mode"}
          </p>
        </div>
      </footer>
    </div>
  );
}

function NavItem({ to, label }: { to: string; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          "text-sm font-medium transition-colors hover:text-foreground/80",
          isActive ? "text-foreground" : "text-foreground/60",
        )
      }
    >
      {label}
    </NavLink>
  );
}
