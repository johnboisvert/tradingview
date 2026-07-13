// User-facing plan activation page. Enter your email, we check the server
// for an admin-granted plan and activate it locally (localStorage).
import { useState } from "react";
import { Crown, CheckCircle2, XCircle } from "lucide-react";
import { setUserPlan } from "@/lib/subscription";
import { useNavigate } from "react-router-dom";

export default function Redeem() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<null | { ok: boolean; plan?: string; note?: string; msg: string }>(null);
  const navigate = useNavigate();

  const redeem = async () => {
    if (!email.includes("@")) return;
    setBusy(true);
    setResult(null);
    try {
      const r = await fetch(`/api/v1/plans/grants/lookup?email=${encodeURIComponent(email)}`);
      const j = await r.json();
      if (!j.ok) throw new Error(j.error || "Erreur serveur");
      if (!j.plan) {
        setResult({ ok: false, msg: "Aucun accès associé à cet email. Contacte le support si tu penses que c'est une erreur." });
        return;
      }
      // Apply plan locally + remember email (used for Terminal layout cloud sync)
      setUserPlan(j.plan as any);
      localStorage.setItem("cia_user_email", email.trim().toLowerCase());
      setResult({ ok: true, plan: j.plan, note: j.note, msg: `Accès ${j.plan.toUpperCase()} activé sur ce navigateur !` });
    } catch (e: unknown) {
      setResult({ ok: false, msg: `Échec : ${(e as Error).message}` });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0E1A] text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 mb-4">
            <Crown className="w-8 h-8 text-black" />
          </div>
          <h1 className="text-3xl font-extrabold mb-2" data-testid="redeem-title">Activer mon accès</h1>
          <p className="text-sm text-gray-400">Entre l'email associé à ton accès Elite / Pro accordé par l'admin.</p>
        </div>

        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6">
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Email</label>
          <input
            data-testid="redeem-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && redeem()}
            placeholder="tu@email.com"
            className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-amber-500/50 mb-4"
          />
          <button
            data-testid="redeem-submit"
            onClick={redeem}
            disabled={busy || !email}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-black font-black text-sm hover:brightness-110 transition disabled:opacity-40"
          >
            {busy ? "Vérification…" : "Activer mon accès"}
          </button>

          {result && (
            <div data-testid="redeem-result" className={`mt-4 p-3 rounded-lg border flex items-start gap-2 text-sm ${result.ok ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300" : "bg-red-500/10 border-red-500/30 text-red-300"}`}>
              {result.ok ? <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" /> : <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />}
              <div>
                <div className="font-bold">{result.msg}</div>
                {result.note && <div className="text-xs text-white/60 mt-1">Note : {result.note}</div>}
                {result.ok && (
                  <button
                    onClick={() => navigate("/terminal")}
                    className="mt-3 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-black hover:bg-amber-500/30 transition"
                  >
                    Ouvrir le Terminal Pro →
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-gray-500 mt-6">
          Ton accès est stocké localement dans ce navigateur. Pour d'autres appareils, refais cette étape.
        </p>
      </div>
    </div>
  );
}
