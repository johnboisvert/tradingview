// Reusable mini sparkline — zero dependency, SVG natif.
// Usage: <MiniSparkline data={[1,2,3,...]} width={80} height={28} />
// Auto-détecte positif/négatif (premier vs dernier point) si "positive" non fourni.

type Props = {
  data?: number[] | null;
  positive?: boolean;
  width?: number;
  height?: number;
  strokeWidth?: number;
  fill?: boolean; // active dégradé en dessous de la courbe
  className?: string;
};

export default function MiniSparkline({
  data,
  positive,
  width = 80,
  height = 28,
  strokeWidth = 1.5,
  fill = false,
  className = "",
}: Props) {
  if (!data || data.length < 2) {
    return (
      <svg width={width} height={height} className={`flex-shrink-0 ${className}`} aria-hidden>
        <line
          x1={0}
          y1={height / 2}
          x2={width}
          y2={height / 2}
          stroke="#374151"
          strokeWidth={1}
          strokeDasharray="2 3"
        />
      </svg>
    );
  }

  const isPositive =
    typeof positive === "boolean" ? positive : data[data.length - 1] >= data[0];
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((v - min) / range) * height;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");

  const color = isPositive ? "#10B981" : "#EF4444";
  const gradId = `spark-grad-${isPositive ? "p" : "n"}-${Math.round(width)}-${Math.round(height)}`;
  const areaPoints = fill
    ? `0,${height} ${points} ${width},${height}`
    : "";

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={`flex-shrink-0 ${className}`}
      aria-hidden
    >
      {fill && (
        <>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <polygon points={areaPoints} fill={`url(#${gradId})`} />
        </>
      )}
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
