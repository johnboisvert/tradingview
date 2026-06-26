// Equity history sparkline (Recharts). Pure presentation: parent owns the data.
import { LineChart, Line, ResponsiveContainer, YAxis, Tooltip as ReTooltip, XAxis } from "recharts";
import { TrendingUp } from "lucide-react";
import type { EquitySnapshot } from "./types";

interface Props {
  history: EquitySnapshot[];
  roi: number;
}

export default function EquityCurve({ history, roi }: Props) {
  const hasData = history.length >= 2;
  const stroke = roi >= 0 ? "#10b981" : "#ef4444";
  return (
    <div className="bg-[#0d0e16] border border-white/[0.06] rounded-2xl p-4" data-testid="equity-curve">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-300 flex items-center gap-2">
          <TrendingUp className="w-3.5 h-3.5 text-cyan-400" /> Courbe d&apos;équité
        </h3>
        <span className="text-[10px] text-gray-500 font-mono">{history.length} snapshots</span>
      </div>
      {!hasData ? (
        <div className="h-32 flex items-center justify-center text-xs text-gray-500">
          Effectue quelques trades pour voir ta courbe d&apos;équité
        </div>
      ) : (
        <div className="h-32">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={history.map(p => ({ date: p.ts.slice(5, 10), equity: p.equity }))}>
              <XAxis dataKey="date" tick={{ fontSize: 9, fill: "#6b7280" }} stroke="#1f2937" />
              <YAxis domain={["auto", "auto"]} tick={{ fontSize: 9, fill: "#6b7280" }} stroke="#1f2937" width={40} />
              <ReTooltip contentStyle={{ background: "#0a0a14", border: "1px solid #1f2937", borderRadius: "8px", fontSize: "11px" }} labelStyle={{ color: "#9ca3af" }} />
              <Line type="monotone" dataKey="equity" stroke={stroke} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
