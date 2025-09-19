import { useEffect, useRef, useState } from "react";

export default function Flashcard({
  front,
  back,
}: {
  front: React.ReactNode;
  back: React.ReactNode;
}) {
  const [flipped, setFlipped] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const handle = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      el.style.setProperty("--tx", ((x / rect.width) * 20).toFixed(2) + "deg");
      el.style.setProperty(
        "--ty",
        ((y / rect.height) * -10).toFixed(2) + "deg",
      );
      el.style.setProperty("--s", "1.03");
    };
    const leave = () => {
      if (!el) return;
      el.style.setProperty("--tx", "0deg");
      el.style.setProperty("--ty", "0deg");
      el.style.setProperty("--s", "1");
    };
    el.addEventListener("mousemove", handle);
    el.addEventListener("mouseleave", leave);
    return () => {
      el.removeEventListener("mousemove", handle);
      el.removeEventListener("mouseleave", leave);
    };
  }, []);

  return (
    <div
      ref={ref}
      onClick={() => setFlipped((s) => !s)}
      className={`relative w-full h-56 cursor-pointer perspective`}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") setFlipped((s) => !s);
      }}
    >
      <div
        className={`absolute inset-0 transition-transform duration-700 will-change-transform transform-style-preserve-3d ${flipped ? "rotate-y-180" : ""}`}
        style={{
          transform: `rotateY(${flipped ? 180 : 0}deg)`,
        }}
      >
        <div
          className="absolute inset-0 backface-hidden rounded-xl shadow-2xl overflow-hidden bg-gradient-to-br from-primary/60 to-accent/40 p-6 flex flex-col justify-between"
          style={{
            transform:
              "translateZ(30px) scale(var(--s,1)) rotateX(var(--ty,0deg)) rotateY(var(--tx,0deg))",
          }}
        >
          <div className="text-white">{front}</div>
          <div className="text-sm text-white/80">Flip to see explanation</div>
        </div>

        <div
          className="absolute inset-0 backface-hidden rounded-xl shadow-2xl overflow-hidden bg-white p-6 rotate-y-180"
          style={{
            transform:
              "translateZ(30px) scale(var(--s,1)) rotateX(var(--ty,0deg)) rotateY(var(--tx,0deg))",
          }}
        >
          <div className="text-slate-900">{back}</div>
          <div className="text-sm text-slate-500">Click to go back</div>
        </div>
      </div>
      <style>{`
        .perspective { perspective: 1200px; }
        .transform-style-preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { -webkit-backface-visibility: hidden; backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
      `}</style>
    </div>
  );
}
