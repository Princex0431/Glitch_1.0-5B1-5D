import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AppRoutes from "./router";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AppRoutes />
    </TooltipProvider>
  </QueryClientProvider>
);

(function mount() {
  const container = document.getElementById("root");
  if (!container) throw new Error("Root container not found");
  const w = window as any;
  let root = w.__REACT_ROOT;
  if (!root) {
    root = createRoot(container);
    w.__REACT_ROOT = root;
  }
  root.render(<App />);
})();
