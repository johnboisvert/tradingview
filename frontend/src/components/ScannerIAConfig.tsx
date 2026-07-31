// Panneau admin (invisible pour les autres) : configuration du webhook Scanner IA (agent Claude)
import { useEffect, useState } from "react";
import { KeyRound, Copy, Check } from "lucide-react";

const WEBHOOK_URL = "https://www.cryptoia.ca/api/v1/external-signals";

const claudeInstructions = (key: string) => `Quand tu détectes un setup de trading crypto de qualité, envoie-le automatiquement à mon site CryptoIA :

POST ${WEBHOOK_URL}
Headers:
  Content-Type: application/json
  x-signal-key: ${key}

Body JSON (exemple) :
{"symbol":"ETHUSDT","side":"LONG","entry":1925.5,"sl":1880,"tp1":1975,"tp2":2020,"tp3":2080,"confidence":85,"note":"Cassure résistance + volume"}

Équivalent curl :
curl -X POST ${WEBHOOK_URL} -H "Content-Type: application/json" -H "x-signal-key: ${key}" -d '{"symbol":"ETHUSDT","side":"LONG","entry":1925.5,"sl":1880,"tp1":1975,"tp2":2020,"tp3":2080,"confidence":85,"note":"Cassure résistance + volume"}'

Règles obligatoires :
- symbol : paire crypto (ex: BTCUSDT) — suffixe USDT ajouté automatiquement si absent
- side : "LONG" ou "SHORT" | LONG : sl < entry < tp1 | SHORT : tp1 < entry < sl
- entry, sl, tp1 : obligatoires (nombres) | tp2, tp3, confidence (50-99), note : optionnels
- Un seul signal par symbole/side par 4h (sinon rejet 409 duplicate)
- N'envoie un signal QUE si toutes tes conditions d'analyse sont réunies

Le signal apparaît ensuite sur cryptoia.ca/performance (badge Scanner IA), il est suivi automatiquement toutes les 5 minutes : TP1 atteint → stop au breakeven, sorties partielles 40% TP1 / 30% TP2 / 30% runner.`;

export const ScannerIAConfig = () => {
  const [webhookKey, setWebhookKey] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    // Uniquement si une session admin est active sur cet appareil
    const hasAdminSession = !!localStorage.getItem("cryptoia_admin_token") || sessionStorage.getItem("cryptoia_admin_auth") === "true";
    if (!hasAdminSession) return;
    fetch("/api/v1/external-signals/key", {
      headers: { "x-admin-auth": localStorage.getItem("admin_api_key") || "admin123" },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d?.key && setWebhookKey(d.key))
      .catch(() => {});
  }, []);

  if (!webhookKey) return null;

  const copy = (id: string, text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  const row = (id: string, label: string, value: string, color: string) => (
    <div>
      <div className="text-[11px] font-mono uppercase tracking-[0.15em] text-white/40 mb-1">{label}</div>
      <div className="flex items-center gap-2">
        <code data-testid={`scanner-config-${id}`} className={`flex-1 rounded-lg bg-black/40 border border-white/10 px-3 py-2 font-mono text-xs ${color} overflow-x-auto whitespace-nowrap`}>{value}</code>
        <button data-testid={`copy-${id}`} onClick={() => copy(id, value)} className="shrink-0 rounded-lg border border-white/10 bg-white/5 p-2 hover:bg-white/10 transition-colors">
          {copied === id ? <Check className="h-4 w-4 text-emerald-300" /> : <Copy className="h-4 w-4 text-white/60" />}
        </button>
      </div>
    </div>
  );

  return (
    <div data-testid="scanner-admin-config" className="mt-8 rounded-2xl border border-amber-400/20 bg-amber-500/[0.04] p-5">
      <div className="flex items-center gap-2">
        <KeyRound className="h-4 w-4 text-amber-300" />
        <h2 className="font-mono text-[11px] uppercase tracking-[0.25em] text-amber-300/80">Webhook Scanner IA — visible par vous seul (admin)</h2>
      </div>
      <div className="mt-4 space-y-3 text-sm">
        {row("webhook-url", "URL du webhook (POST)", WEBHOOK_URL, "text-cyan-300")}
        {row("webhook-key", "Clé secrète (header x-signal-key)", webhookKey, "text-amber-300")}
        <div>
          <div className="flex items-center justify-between mb-1">
            <div className="text-[11px] font-mono uppercase tracking-[0.15em] text-white/40">Instructions à copier dans Claude</div>
            <button data-testid="copy-claude-instructions" onClick={() => copy("claude", claudeInstructions(webhookKey))} className="inline-flex items-center gap-1.5 rounded-lg border border-violet-400/30 bg-violet-500/10 px-3 py-1.5 text-xs font-bold text-violet-300 hover:bg-violet-500/20 transition-colors">
              {copied === "claude" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied === "claude" ? "Copié !" : "Copier les instructions"}
            </button>
          </div>
          <pre className="rounded-lg bg-black/40 border border-white/10 px-3 py-2 font-mono text-[11px] text-white/60 overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-56 overflow-y-auto">{claudeInstructions(webhookKey)}</pre>
        </div>
      </div>
    </div>
  );
};

export default ScannerIAConfig;
