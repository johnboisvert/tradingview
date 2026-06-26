// Small shared visual primitives used by multiple Challenge subcomponents.
// Row → key/value line inside the order-ticket preview.
// Kpi → big-number stat card row.

export function Row({ k, v, accent }: { k: string; v: string; accent?: "red" | "cyan" }) {
  const color = accent === "red" ? "text-red-400" : accent === "cyan" ? "text-cyan-300" : "text-white";
  return (
    <div className="flex justify-between">
      <span className="text-gray-500 uppercase tracking-wider text-[9px] font-bold">{k}</span>
      <span className={`font-extrabold ${color}`}>{v}</span>
    </div>
  );
}

export function Kpi({
  label,
  value,
  sub,
  subColor,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  subColor?: "emerald" | "red";
  accent?: boolean;
}) {
  return (
    <div className={`bg-[#0d0e16] border rounded-xl p-3 ${accent ? "border-amber-500/30" : "border-white/[0.06]"}`}>
      <div className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-1">{label}</div>
      <div className={`text-xl font-black font-mono ${accent ? "text-amber-300" : "text-white"}`}>{value}</div>
      {sub && (
        <div className={`text-[10px] font-bold mt-0.5 ${subColor === "emerald" ? "text-emerald-400" : subColor === "red" ? "text-red-400" : "text-gray-500"} font-mono`}>{sub}</div>
      )}
    </div>
  );
}
