import { useEffect, useState } from "react";

/**
 * AnimatedLogo — 3 anneaux SVG qui se forment progressivement au chargement
 * autour du logo CryptoIA, puis pulsent légèrement en boucle.
 *
 * - Au premier render: stroke-dashoffset → 0 (forme l'anneau)
 * - Une fois formés: rotation lente continue + halo glow
 * - Le logo image fade-in au centre
 */
type Props = {
  src?: string;
  size?: number;
  alt?: string;
  className?: string;
  /** Si true, ne joue l'animation qu'une fois par session */
  oncePerSession?: boolean;
};

export default function AnimatedLogo({
  src = "https://mgx-backend-cdn.metadl.com/generate/images/966405/2026-02-19/4ee17351-fcfd-422c-8a4f-5e9829ba23a7.png",
  size = 36,
  alt = "CryptoIA",
  className = "",
  oncePerSession = false,
}: Props) {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (oncePerSession && sessionStorage.getItem("cryptoia-logo-anim") === "1") {
      setAnimate(false);
      return;
    }
    // tick to next frame so CSS transitions actually animate
    const t = requestAnimationFrame(() => setAnimate(true));
    if (oncePerSession) sessionStorage.setItem("cryptoia-logo-anim", "1");
    return () => cancelAnimationFrame(t);
  }, [oncePerSession]);

  const half = size / 2;
  // 3 rings with different radii, dasharray ≈ circumference
  const rings = [
    { r: half - 2, color: "#06B6D4", delay: 0, duration: 1100, opacity: 0.9 },
    { r: half - 6, color: "#8B5CF6", delay: 180, duration: 1100, opacity: 0.85 },
    { r: half - 10, color: "#22D3EE", delay: 360, duration: 1100, opacity: 0.8 },
  ];

  return (
    <div
      className={`relative inline-flex items-center justify-center flex-shrink-0 ${className}`}
      style={{ width: size, height: size }}
      data-testid="animated-logo"
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="absolute inset-0 pointer-events-none"
        style={{ overflow: "visible" }}
      >
        <defs>
          <filter id="logo-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1.2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {rings.map((ring, idx) => {
          const circumference = 2 * Math.PI * ring.r;
          return (
            <circle
              key={idx}
              cx={half}
              cy={half}
              r={ring.r}
              fill="none"
              stroke={ring.color}
              strokeWidth={1.4}
              strokeLinecap="round"
              filter="url(#logo-glow)"
              style={{
                opacity: animate ? ring.opacity : 0,
                strokeDasharray: circumference,
                strokeDashoffset: animate ? 0 : circumference,
                transition: `stroke-dashoffset ${ring.duration}ms cubic-bezier(.22,.61,.36,1) ${ring.delay}ms, opacity 600ms ease ${ring.delay}ms`,
                transformOrigin: `${half}px ${half}px`,
                animation: animate
                  ? `cryptoia-ring-rotate ${8 + idx * 3}s linear ${ring.delay + ring.duration}ms infinite`
                  : "none",
              }}
            />
          );
        })}
      </svg>

      <img
        src={src}
        alt={alt}
        width={size - 8}
        height={size - 8}
        className="rounded-xl object-contain relative"
        style={{
          opacity: animate ? 1 : 0,
          transform: animate ? "scale(1)" : "scale(0.6)",
          transition: "opacity 600ms ease 700ms, transform 700ms cubic-bezier(.34,1.56,.64,1) 700ms",
        }}
      />

      <style>{`
        @keyframes cryptoia-ring-rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
