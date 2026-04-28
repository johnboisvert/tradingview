import React, { useMemo } from 'react';

/**
 * WatermarkOverlay
 * ----------------
 * Fixed, non-interactive watermark that repeats the user's email
 * diagonally across the entire viewport. Intended as a *deterrent*
 * against screenshots being reused or published.
 *
 * - pointer-events: none  -> never blocks interaction
 * - aria-hidden            -> invisible to assistive tech
 * - z-index very high      -> rendered above content (but still non-interactive)
 */
interface WatermarkOverlayProps {
  /** Text to repeat. Typically the connected user's email. */
  text: string;
  /** Opacity of each watermark line (default 0.08). */
  opacity?: number;
}

const WatermarkOverlay: React.FC<WatermarkOverlayProps> = ({
  text,
  opacity = 0.09,
}) => {
  // Build a grid of lines; kept in a memo so it is cheap to re-render.
  const lines = useMemo(() => {
    const rows = 14;
    const cols = 6;
    const out: { key: string; top: string; left: string }[] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        out.push({
          key: `wm-${r}-${c}`,
          top: `${(r / rows) * 100}%`,
          left: `${(c / cols) * 100}%`,
        });
      }
    }
    return out;
  }, []);

  if (!text) return null;

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 9999,
        overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      {lines.map((l) => (
        <span
          key={l.key}
          style={{
            position: 'absolute',
            top: l.top,
            left: l.left,
            transform: 'rotate(-30deg) translate(-50%, -50%)',
            transformOrigin: 'left top',
            color: '#ffffff',
            opacity,
            fontSize: '14px',
            fontWeight: 600,
            whiteSpace: 'nowrap',
            letterSpacing: '0.05em',
            textShadow: '0 1px 2px rgba(0,0,0,0.25)',
            fontFamily:
              "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif",
          }}
        >
          {text} • cryptoia.ca • {new Date().toISOString().slice(0, 10)}
        </span>
      ))}
    </div>
  );
};

export default WatermarkOverlay;