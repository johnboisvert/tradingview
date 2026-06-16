import { useEffect } from "react";

/**
 * Confetti — CSS-only celebration burst.
 * Usage: mount this component briefly when celebrating (e.g. after a code copy,
 * a code promo applied, an affiliate link generated, a payment success).
 *
 * <Confetti active={someBoolean} />  → unmounts after 2.5s automatically
 */
export default function Confetti({ active = false, count = 60 }: { active?: boolean; count?: number }) {
  useEffect(() => {
    if (!active) return;
    // No-op effect — this component lives only briefly via parent state
  }, [active]);

  if (!active) return null;

  // Generate randomized particles inline (no extra lib)
  const particles = Array.from({ length: count }).map((_, i) => {
    const colors = ["#fde047", "#f0abfc", "#67e8f9", "#6ee7b7", "#fca5a5", "#a5b4fc"];
    const color = colors[i % colors.length];
    const left = Math.random() * 100;
    const delay = Math.random() * 0.3;
    const duration = 1.6 + Math.random() * 1.2;
    const size = 6 + Math.random() * 8;
    const rotation = Math.random() * 360;
    const xDrift = (Math.random() - 0.5) * 200;
    return (
      <span
        key={i}
        className="cf-piece"
        style={{
          position: "absolute",
          top: "-10px",
          left: `${left}%`,
          width: `${size}px`,
          height: `${size * 0.4}px`,
          backgroundColor: color,
          transform: `rotate(${rotation}deg)`,
          animation: `cf-fall ${duration}s ${delay}s cubic-bezier(.55,.05,.45,.95) forwards`,
          opacity: 0.95,
          borderRadius: "1px",
          ["--xDrift" as string]: `${xDrift}px`,
        } as React.CSSProperties}
      />
    );
  });

  return (
    <div
      aria-hidden="true"
      data-testid="confetti-burst"
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 99999,
        overflow: "hidden",
      }}
    >
      {particles}
      <style>{`
        @keyframes cf-fall {
          0% { transform: translate(0, 0) rotate(0deg); opacity: 1; }
          100% { transform: translate(var(--xDrift, 0), 110vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
