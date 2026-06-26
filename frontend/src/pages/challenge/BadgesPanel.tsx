// Compact 5x2 badges grid + 'voir tous' button. Pure presentation.
import { Award, Lock } from "lucide-react";
import type { Achievement, AchievementMeta } from "./types";

interface Props {
  catalog: AchievementMeta[];
  unlocked: Achievement[];
  onShowAll: () => void;
}

export default function BadgesPanel({ catalog, unlocked, onShowAll }: Props) {
  return (
    <div className="bg-[#0d0e16] border border-white/[0.06] rounded-2xl p-4" data-testid="achievements-summary">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-300 flex items-center gap-2">
          <Award className="w-3.5 h-3.5 text-amber-400" /> Badges
        </h3>
        <span className="text-[10px] text-amber-300 font-mono font-bold">{unlocked.length}/{catalog.length}</span>
      </div>
      {catalog.length === 0 ? (
        <div className="text-xs text-gray-500 text-center py-4">Chargement...</div>
      ) : (
        <>
          <div className="grid grid-cols-5 gap-1.5">
            {catalog.slice(0, 10).map((a) => {
              const isUnlocked = unlocked.find(x => x.key === a.key);
              return (
                <div
                  key={a.key}
                  title={`${a.name} — ${a.desc}`}
                  data-testid={`badge-${a.key}`}
                  className={`aspect-square rounded-lg flex items-center justify-center text-lg transition ${isUnlocked ? "bg-gradient-to-br from-amber-500/30 to-orange-500/30 border border-amber-500/50 shadow-md shadow-amber-500/10" : "bg-white/[0.03] border border-white/[0.04] opacity-30 grayscale"}`}
                >
                  {isUnlocked ? a.emoji : <Lock className="w-3 h-3 text-gray-600" />}
                </div>
              );
            })}
          </div>
          <button
            onClick={onShowAll}
            data-testid="show-all-achievements"
            className="w-full mt-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-300 hover:text-amber-200 transition"
          >
            Voir tous les badges →
          </button>
        </>
      )}
    </div>
  );
}
