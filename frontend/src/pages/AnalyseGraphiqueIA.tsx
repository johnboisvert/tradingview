import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import Sidebar from "@/components/Sidebar";
import {
  ScanSearch, ImagePlus, RefreshCw, Sparkles, TrendingUp, TrendingDown,
  Minus, AlertTriangle, ShieldAlert, Crosshair, Target, Waves, Layers,
  Gauge, ClipboardCopy, Loader2, Activity, Eye, Zap, History, Trash2,
  CheckCircle2, CircleDashed, ArrowUpRight, ArrowDownRight, Scale,
} from "lucide-react";

// ════════════════════════════════════════════════════════════════════════════
// Analyse de Graphique IA — page PUBLIQUE (comme le Screener Crypto)
// L'utilisateur dépose une capture de graphique (PNG/JPG/WEBP) ; une IA
// multimodale (Gemini vision, clé côté serveur via /api/chart-ai) décrypte
// l'image et propose un plan de trading complet : biais, confiance, entrées,
// stop loss, take profits, risk/reward, scénarios, invalidation, checklist.
// Sortie JSON structurée rendue en cartes/badges, inspirée de smcia.org/app.
// ════════════════════════════════════════════════════════════════════════════

type Bias = "haussier" | "baissier" | "neutre";

interface OrderBlock { type: "demand" | "supply"; zone: string; strength: string; stars: number; note: string }
interface Fvg { type: string; zone: string; status: string; note: string }
interface Breaker { zone: string; note: string }
interface KeyLevel { level: string; role: string; priority: string }
interface Entry { zone: string; rationale: string }
interface TakeProfit { label: string; level: string; rationale: string }
interface Scenario {
  name: string; direction: string; probability: number | null; path: string;
  entry: string; stop_loss: string; take_profits: string[]; conditions: string[]; invalidation: string;
}
interface Checklist {
  timeframe_visible: boolean; price_scale_visible: boolean; candles_enough: boolean;
  indicators_clean: boolean; volumes_visible: boolean;
}
interface Analysis {
  valid: boolean; invalid_reason: string; symbol: string; timeframe: string; exchange: string;
  bias: Bias; confidence: number | null; overview: string;
  structure: { bias: string; phase: string; last_event: string; pattern: string };
  liquidity: { buy_side: string[]; sell_side: string[]; recent_sweep: string; inducement: string };
  points_of_interest: { order_blocks: OrderBlock[]; fvgs: Fvg[]; breakers: Breaker[] };
  indicators_visible: string[];
  key_levels: KeyLevel[];
  trade_plan: {
    direction: "long" | "short" | "aucun"; entries: Entry[]; stop_loss: string; stop_rationale: string;
    take_profits: TakeProfit[]; risk_reward: string; position_note: string;
  };
  scenarios: Scenario[];
  checklist: Checklist;
  conclusion: string;
}

interface HistoryItem {
  id: string;
  date: string;
  symbol: string;
  timeframe: string;
  bias: Bias;
  confidence: number | null;
  thumb: string;
  analysis: Analysis;
}

const HISTORY_KEY = "cryptoia_chart_ai_history";
const HISTORY_MAX = 12;
const MAX_FILE_MB = 12;
const ACCEPTED = ["image/png", "image/jpeg", "image/webp"];

// ─── Compression / redimensionnement côté client (limite la taille envoyée) ───
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { resolve(img); URL.revokeObjectURL(url); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Image illisible")); };
    img.src = url;
  });
}

async function compressImage(file: File, maxDim = 1600, quality = 0.86):
  Promise<{ base64: string; mimeType: string; previewUrl: string; thumbUrl: string }> {
  const img = await loadImage(file);
  const scale = Math.min(1, maxDim / Math.max(img.naturalWidth || 1, img.naturalHeight || 1));
  const w = Math.max(1, Math.round((img.naturalWidth || maxDim) * scale));
  const h = Math.max(1, Math.round((img.naturalHeight || maxDim) * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas indisponible sur ce navigateur");
  ctx.fillStyle = "#0A0E1A";
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0, w, h);
  const dataUrl = canvas.toDataURL("image/jpeg", quality);
  // miniature pour l'historique local
  const tw = 220;
  const th = Math.max(1, Math.round((h / w) * tw));
  const tc = document.createElement("canvas");
  tc.width = tw; tc.height = th;
  const tctx = tc.getContext("2d");
  if (tctx) { tctx.fillStyle = "#0A0E1A"; tctx.fillRect(0, 0, tw, th); tctx.drawImage(canvas, 0, 0, tw, th); }
  return {
    base64: dataUrl.split(",")[1] || "",
    mimeType: "image/jpeg",
    previewUrl: dataUrl,
    thumbUrl: tctx ? tc.toDataURL("image/jpeg", 0.5) : dataUrl,
  };
}

// ─── Petits composants de rendu ───
function SectionCard({ icon, title, children, accent = "indigo" }: {
  icon: ReactNode; title: string; children: ReactNode; accent?: string;
}) {
  const ring: Record<string, string> = {
    indigo: "from-indigo-500/20 to-purple-500/10", cyan: "from-cyan-500/20 to-blue-500/10",
    emerald: "from-emerald-500/20 to-teal-500/10", amber: "from-amber-500/20 to-orange-500/10",
    rose: "from-rose-500/20 to-pink-500/10",
  };
  return (
    <section className="rounded-2xl border border-white/[0.07] bg-[#0D1220]/80 backdrop-blur-sm overflow-hidden">
      <header className={`flex items-center gap-2.5 px-4 md:px-5 py-3 border-b border-white/[0.06] bg-gradient-to-r ${ring[accent] || ring.indigo}`}>
        <span className="text-indigo-300">{icon}</span>
        <h2 className="text-[13px] md:text-sm font-extrabold tracking-wide text-white uppercase">{title}</h2>
      </header>
      <div className="px-4 md:px-5 py-4">{children}</div>
    </section>
  );
}

function BiasBadge({ bias, size = "md" }: { bias: Bias; size?: "sm" | "md" }) {
  const map = {
    haussier: { cls: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30", Icon: TrendingUp, label: "Haussier" },
    baissier: { cls: "bg-rose-500/15 text-rose-300 border-rose-500/30", Icon: TrendingDown, label: "Baissier" },
    neutre: { cls: "bg-amber-500/15 text-amber-300 border-amber-500/30", Icon: Minus, label: "Neutre" },
  }[bias] || { cls: "bg-white/[0.06] text-gray-300 border-white/10", Icon: Minus, label: bias || "—" };
  const { cls, Icon, label } = map as { cls: string; Icon: typeof Minus; label: string };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-bold ${cls}`}>
      <Icon className={size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5"} /> {label}
    </span>
  );
}

function ConfidenceMeter({ value }: { value: number | null }) {
  if (value == null) return null;
  const pct = Math.min(100, Math.max(0, value * 10));
  const color = value >= 7 ? "from-emerald-400 to-teal-400" : value >= 5 ? "from-amber-400 to-orange-400" : "from-rose-400 to-red-500";
  return (
    <div className="flex items-center gap-2.5 min-w-[150px]">
      <Gauge className="w-4 h-4 text-gray-400 flex-shrink-0" />
      <div className="flex-1 h-2 rounded-full bg-white/[0.07] overflow-hidden">
        <div className={`h-full rounded-full bg-gradient-to-r ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[11px] font-bold text-gray-300 tabular-nums">{value.toFixed(1)}/10</span>
    </div>
  );
}

function Stars({ n }: { n: number }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`${n} sur 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={`text-[10px] leading-none ${i <= n ? "text-amber-400" : "text-gray-600"}`}>★</span>
      ))}
    </span>
  );
}

const CHECKLIST_LABELS: { key: keyof Checklist; label: string }[] = [
  { key: "timeframe_visible", label: "Timeframe visible" },
  { key: "price_scale_visible", label: "Échelle de prix lisible" },
  { key: "candles_enough", label: "50–100 bougies minimum" },
  { key: "indicators_clean", label: "Pas d’indicateurs superflus" },
  { key: "volumes_visible", label: "Volumes visibles (si possible)" },
];

function fmtDate(iso: string) {
  try { return new Date(iso).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }); }
  catch { return iso; }
}

// ════════════════════════════════════════════════════════════════════════════
export default function AnalyseGraphiqueIA() {
  const [fileInfo, setFileInfo] = useState<{ name: string; sizeMb: number } | null>(null);
  const [payload, setPayload] = useState<{ base64: string; mimeType: string; previewUrl: string; thumbUrl: string } | null>(null);
  const [notes, setNotes] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ model: string; analysis: Analysis } | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      if (raw) setHistory(JSON.parse(raw).slice(0, HISTORY_MAX));
    } catch { /* stockage indisponible */ }
  }, []);

  const saveHistory = useCallback((items: HistoryItem[]) => {
    setHistory(items);
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, HISTORY_MAX))); } catch { /* quota */ }
  }, []);

  const handleFile = useCallback(async (file: File | undefined | null) => {
    setError("");
    if (!file) return;
    if (!ACCEPTED.includes(file.type)) {
      setError("Format non supporté. Utilise une image PNG, JPG ou WEBP.");
      return;
    }
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      setError(`Fichier trop volumineux (${(file.size / 1024 / 1024).toFixed(1)} Mo). Maximum ${MAX_FILE_MB} Mo.`);
      return;
    }
    setPreparing(true);
    try {
      const c = await compressImage(file);
      if (!c.base64) throw new Error("compression échouée");
      setPayload(c);
      setFileInfo({ name: file.name, sizeMb: file.size / 1024 / 1024 });
    } catch {
      setError("Impossible de lire cette image. Essaie une autre capture.");
    } finally {
      setPreparing(false);
    }
  }, []);

  const analyze = useCallback(async () => {
    if (!payload || loading) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch("/api/chart-ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: payload.base64, mimeType: payload.mimeType, notes: notes.trim() }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        setError(data?.message || `Le service d’analyse est momentanément indisponible (HTTP ${res.status}).`);
        return;
      }
      const a: Analysis = data.analysis;
      if (!a.valid) {
        setError(a.invalid_reason || "Impossible de lire un graphique exploitable sur cette image. Envoie une capture plus nette (prix et timeframe visibles).");
        return;
      }
      setResult({ model: data.model || "IA", analysis: a });
      const item: HistoryItem = {
        id: `${Date.now()}`,
        date: new Date().toISOString(),
        symbol: a.symbol, timeframe: a.timeframe, bias: a.bias, confidence: a.confidence,
        thumb: payload.thumbUrl, analysis: a,
      };
      saveHistory([item, ...history].slice(0, HISTORY_MAX));
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 120);
    } catch {
      setError("Connexion au serveur interrompue. Vérifie ton réseau et réessay.");
    } finally {
      setLoading(false);
    }
  }, [payload, notes, loading, history, saveHistory]);

  const reset = () => { setPayload(null); setFileInfo(null); setResult(null); setError(""); };

  const copyPlan = () => {
    if (!result) return;
    const a = result.analysis;
    const tp = a.trade_plan;
    const lines = [
      `Analyse CryptoIA — ${a.symbol || "Instrument"} ${a.timeframe ? `(${a.timeframe})` : ""}`.trim(),
      `Biais : ${a.bias} • Confiance : ${a.confidence != null ? `${a.confidence}/10` : "n/a"}`,
      "",
      "Vue d’ensemble :", a.overview, "",
      "Plan proposé :",
      `• Entrées : ${tp.entries.map((e) => e.zone).join(" | ") || "—"}`,
      `• Stop loss : ${tp.stop_loss || "—"}`,
      `• Take profits : ${tp.take_profits.map((t) => `${t.label} ${t.level}`).join(" | ") || "—"}`,
      `• Risk/Reward : ${tp.risk_reward || "—"}`, "",
      "Scénarios :",
      ...a.scenarios.map((s) => `• ${s.name}${s.probability != null ? ` (${s.probability} %)` : ""} : ${s.path}`),
      "",
      "⚠️ Ceci n’est pas un conseil financier. Le trading comporte un risque de perte en capital.",
    ];
    navigator.clipboard?.writeText(lines.join("\n")).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }).catch(() => { /* presse-papiers refusé */ });
  };

  const a = result?.analysis;
  const tp = a?.trade_plan;

  return (
    <div className="min-h-screen bg-[#0A0E1A] text-white">
      <Sidebar />
      <main className="md:ml-[260px] pt-14 md:pt-0 bg-[#0A0E1A]" id="analyse-ia-root">
        <div className="px-4 md:px-6 py-5 max-w-[1100px]">

          {/* ── En-tête ── */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <ScanSearch className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg md:text-xl font-extrabold bg-gradient-to-r from-indigo-300 via-purple-300 to-cyan-300 bg-clip-text text-transparent leading-tight">
                  Analyse de Graphique IA
                </h1>
                <p className="text-[11px] text-gray-500">
                  Dépose une capture de graphique — l’IA la décrypte et propose scénarios, entrées et sorties • accès gratuit, sans abonnement
                </p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-purple-400/30 bg-purple-400/10 text-[10px] font-bold text-purple-300">
              <Sparkles className="w-3 h-3" /> IA VISION
            </span>
          </div>

          <div className="grid lg:grid-cols-[minmax(0,420px)_1fr] gap-5 items-start">
            {/* ── Colonne gauche : upload + notes + historique ── */}
            <div className="space-y-4">
              <div className="rounded-2xl border border-white/[0.07] bg-[#0D1220]/80 p-4 md:p-5">
                <h2 className="text-sm font-extrabold mb-3 flex items-center gap-2">
                  <ImagePlus className="w-4 h-4 text-indigo-400" /> Dépose ta capture d’écran
                </h2>

                {!payload ? (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files?.[0]); }}
                    className={`w-full rounded-xl border-2 border-dashed transition-all duration-200 px-4 py-10 flex flex-col items-center gap-3 text-center
                      ${dragOver ? "border-indigo-400 bg-indigo-500/10 scale-[1.01]" : "border-white/[0.12] hover:border-indigo-400/60 hover:bg-white/[0.03]"}`}
                  >
                    {preparing ? (
                      <Loader2 className="w-7 h-7 text-indigo-400 animate-spin" />
                    ) : (
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500/25 to-purple-500/15 flex items-center justify-center">
                        <ImagePlus className="w-6 h-6 text-indigo-300" />
                      </div>
                    )}
                    <div>
                      <p className="text-[13px] font-bold text-gray-200">{preparing ? "Préparation de l’image…" : "Glisse ton image ici, ou clique pour choisir"}</p>
                      <p className="text-[11px] text-gray-500 mt-1">PNG, JPG ou WEBP — {MAX_FILE_MB} Mo max • redimensionnée automatiquement</p>
                    </div>
                  </button>
                ) : (
                  <div className="rounded-xl border border-white/[0.08] overflow-hidden">
                    <img src={payload.previewUrl} alt="Capture du graphique à analyser" className="w-full max-h-[320px] object-contain bg-black/40" />
                    <div className="flex items-center justify-between gap-2 px-3 py-2 bg-white/[0.03] border-t border-white/[0.06]">
                      <span className="text-[10px] text-gray-500 truncate">
                        {fileInfo?.name} {fileInfo ? `• ${fileInfo.sizeMb.toFixed(1)} Mo` : ""}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => fileInputRef.current?.click()} className="px-2 py-1 rounded-md bg-white/[0.06] hover:bg-white/[0.1] text-[10px] font-bold text-gray-300 transition-all">Remplacer</button>
                        <button onClick={reset} className="px-2 py-1 rounded-md bg-rose-500/10 hover:bg-rose-500/20 text-[10px] font-bold text-rose-300 transition-all">Supprimer</button>
                      </div>
                    </div>
                  </div>
                )}
                <input
                  ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden"
                  onChange={(e) => { handleFile(e.target.files?.[0]); e.target.value = ""; }}
                />

                {/* Notes optionnelles */}
                <div className="mt-4">
                  <label htmlFor="chart-ai-notes" className="block text-[11px] font-bold text-gray-400 mb-1.5">Notes (optionnel)</label>
                  <textarea
                    id="chart-ai-notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value.slice(0, 300))}
                    rows={2}
                    placeholder="Ex. : ETH 15 min, je cherche un long sur repli…"
                    className="w-full rounded-xl bg-white/[0.04] border border-white/[0.08] px-3 py-2 text-[12px] text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-indigo-400/60 focus:ring-1 focus:ring-indigo-400/30 resize-none transition-all"
                  />
                  <p className="text-[10px] text-gray-600 mt-1 text-right">{notes.length}/300</p>
                </div>

                {/* Erreur */}
                {error && (
                  <div className="mt-2 flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2.5">
                    <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                    <p className="text-[11px] leading-relaxed text-rose-200">{error}</p>
                  </div>
                )}

                {/* CTA */}
                <button
                  onClick={analyze}
                  disabled={!payload || loading || preparing}
                  className={`mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-extrabold tracking-wide transition-all duration-200
                    ${!payload || preparing
                      ? "bg-white/[0.05] text-gray-600 cursor-not-allowed"
                      : loading
                        ? "bg-indigo-500/40 text-indigo-100 cursor-wait"
                        : "bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 active:scale-[0.99]"}`}
                >
                  {loading ? (<><Loader2 className="w-4 h-4 animate-spin" /> Analyse en cours… 20 à 60 s</>)
                    : (<><ScanSearch className="w-4 h-4" /> Analyser le graphique</>)}
                </button>
              </div>

              {/* Checklist bonne capture */}
              <div className="rounded-2xl border border-white/[0.07] bg-[#0D1220]/80 p-4">
                <h3 className="text-[11px] font-extrabold uppercase tracking-wider text-gray-400 mb-2.5 flex items-center gap-2">
                  <ChecklistIcon /> Checklist — bonne capture
                </h3>
                <ul className="space-y-1.5">
                  {CHECKLIST_LABELS.map(({ key, label }) => {
                    const state = a?.checklist?.[key];
                    return (
                      <li key={key} className="flex items-center gap-2 text-[11px]">
                        {state === true ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                          : state === false ? <CircleDashed className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                            : <span className="w-3.5 h-3.5 rounded-full border border-gray-600 flex-shrink-0" />}
                        <span className={state === false ? "text-amber-200/90" : "text-gray-400"}>{label}</span>
                      </li>
                    );
                  })}
                </ul>
                {a && (
                  <p className="text-[10px] text-gray-600 mt-2.5 pt-2 border-t border-white/[0.05]">
                    Verdict de l’IA sur la qualité de ta capture.
                  </p>
                )}
              </div>

              {/* Historique local */}
              {history.length > 0 && (
                <div className="rounded-2xl border border-white/[0.07] bg-[#0D1220]/80 p-4">
                  <div className="flex items-center justify-between mb-2.5">
                    <h3 className="text-[11px] font-extrabold uppercase tracking-wider text-gray-400 flex items-center gap-2">
                      <History className="w-3.5 h-3.5" /> Historique local
                    </h3>
                    <button
                      onClick={() => saveHistory([])}
                      className="flex items-center gap-1 px-2 py-1 rounded-md bg-white/[0.04] hover:bg-rose-500/15 text-[10px] font-bold text-gray-500 hover:text-rose-300 transition-all"
                    >
                      <Trash2 className="w-3 h-3" /> Vider
                    </button>
                  </div>
                  <p className="text-[10px] text-gray-600 mb-2.5">Stockées uniquement dans ton navigateur (12 dernières).</p>
                  <div className="space-y-1.5">
                    {history.map((h) => (
                      <button
                        key={h.id}
                        onClick={() => { setResult({ model: "historique", analysis: h.analysis }); setError(""); setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 80); }}
                        className="w-full flex items-center gap-2.5 p-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.05] transition-all text-left"
                      >
                        <img src={h.thumb} alt="" className="w-12 h-9 rounded-md object-cover bg-black/40 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-bold text-gray-200 truncate">{h.symbol || "Analyse"} {h.timeframe ? `· ${h.timeframe}` : ""}</p>
                          <p className="text-[10px] text-gray-500">{fmtDate(h.date)}{h.confidence != null ? ` · confiance ${h.confidence}/10` : ""}</p>
                        </div>
                        <BiasBadge bias={h.bias} size="sm" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ── Colonne droite : résultat ── */}
            <div ref={resultRef} className="space-y-4 min-w-0">
              {loading && <AnalysisSkeleton />}

              {!loading && !a && (
                <div className="rounded-2xl border border-dashed border-white/[0.08] bg-[#0D1220]/40 px-6 py-16 text-center">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-indigo-500/15 to-purple-500/10 flex items-center justify-center mb-4">
                    <Waves className="w-7 h-7 text-indigo-400/70" />
                  </div>
                  <p className="text-sm font-bold text-gray-300">Ton analyse s’affichera ici</p>
                  <p className="text-[12px] text-gray-500 mt-1.5 max-w-md mx-auto leading-relaxed">
                    Lecture de la structure de marché, liquidité (BSL/SSL), order blocks & FVG,
                    points d’entrée, stop loss, take profits, risk/reward et scénarios probables —
                    en français, avec les niveaux lisibles sur ton image.
                  </p>
                </div>
              )}

              {!loading && a && (
                <>
                  {/* Bandeau identité + biais + confiance */}
                  <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-br from-indigo-500/[0.12] via-[#0D1220] to-purple-500/[0.08] p-4 md:p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="text-base md:text-lg font-extrabold text-white truncate">
                          Analyse IA — {a.symbol || "Instrument non identifié"}{a.timeframe ? ` · ${a.timeframe}` : ""}{a.exchange ? ` · ${a.exchange}` : ""}
                        </h2>
                        <p className="text-[10px] text-gray-500 mt-0.5">Générée le {fmtDate(new Date().toISOString())} • modèle {result?.model === "historique" ? "mémorisé" : "IA vision"} • lecture indicative</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <BiasBadge bias={a.bias} />
                        <ConfidenceMeter value={a.confidence} />
                      </div>
                    </div>
                    {a.overview && <p className="text-[12px] leading-relaxed text-gray-300 mt-3">{a.overview}</p>}
                    <div className="flex items-center gap-2 mt-3">
                      <button onClick={copyPlan} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-[11px] font-semibold text-gray-300 transition-all">
                        <ClipboardCopy className="w-3.5 h-3.5" /> {copied ? "Copié ✓" : "Copier le plan"}
                      </button>
                    </div>
                  </div>

                  {/* Structure de marché */}
                  {(a.structure.bias || a.structure.phase || a.structure.last_event || a.structure.pattern) && (
                    <SectionCard icon={<Layers className="w-4 h-4" />} title="Structure de marché" accent="cyan">
                      <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2.5">
                        <StructRow label="Biais directionnel" value={a.structure.bias} />
                        <StructRow label="Phase" value={a.structure.phase} />
                        <StructRow label="Dernier événement" value={a.structure.last_event} />
                        <StructRow label="Pattern" value={a.structure.pattern} />
                      </div>
                    </SectionCard>
                  )}

                  {/* Plan de trade : entrées / SL / TP / R:R */}
                  {tp && (tp.entries.length > 0 || tp.stop_loss || tp.take_profits.length > 0) && (
                    <SectionCard icon={<Crosshair className="w-4 h-4" />} title="Plan de trade proposé" accent="emerald">
                      <div className="flex items-center gap-2 mb-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black tracking-wide ${tp.direction === "long" ? "bg-emerald-500/15 text-emerald-300" : tp.direction === "short" ? "bg-rose-500/15 text-rose-300" : "bg-gray-500/15 text-gray-300"}`}>
                          {tp.direction === "long" ? <ArrowUpRight className="w-3 h-3" /> : tp.direction === "short" ? <ArrowDownRight className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                          {tp.direction === "long" ? "POSITION LONG" : tp.direction === "short" ? "POSITION SHORT" : "PAS DE TRADE"}
                        </span>
                        {tp.risk_reward && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-cyan-500/10 border border-cyan-500/25 text-[10px] font-black text-cyan-300">
                            <Scale className="w-3 h-3" /> R/R {tp.risk_reward}
                          </span>
                        )}
                      </div>
                      <div className="grid md:grid-cols-[1fr_1fr_auto] gap-3">
                        {/* Entrées */}
                        <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/[0.07] p-3">
                          <p className="text-[10px] font-black uppercase tracking-wider text-emerald-300 mb-2 flex items-center gap-1.5"><Target className="w-3.5 h-3.5" /> Entrée{tp.entries.length > 1 ? "s" : ""}</p>
                          {tp.entries.length > 0 ? tp.entries.map((e, i) => (
                            <div key={i} className={`${i > 0 ? "mt-2 pt-2 border-t border-emerald-500/15" : ""}`}>
                              <p className="text-[13px] font-extrabold text-white">{e.zone}</p>
                              {e.rationale && <p className="text-[10px] leading-snug text-emerald-200/70 mt-0.5">{e.rationale}</p>}
                            </div>
                          )) : <p className="text-[11px] text-gray-500">Zone non définie</p>}
                        </div>
                        {/* Stop loss */}
                        <div className="rounded-xl border border-rose-500/25 bg-rose-500/[0.07] p-3">
                          <p className="text-[10px] font-black uppercase tracking-wider text-rose-300 mb-2 flex items-center gap-1.5"><ShieldAlert className="w-3.5 h-3.5" /> Stop loss</p>
                          <p className="text-[13px] font-extrabold text-white">{tp.stop_loss || "—"}</p>
                          {tp.stop_rationale && <p className="text-[10px] leading-snug text-rose-200/70 mt-0.5">{tp.stop_rationale}</p>}
                        </div>
                        {/* Take profits */}
                        <div className="md:w-52 rounded-xl border border-sky-500/25 bg-sky-500/[0.07] p-3">
                          <p className="text-[10px] font-black uppercase tracking-wider text-sky-300 mb-2 flex items-center gap-1.5"><TrendingUp className="w-3.5 h-3.5" /> Sorties (TP)</p>
                          {tp.take_profits.length > 0 ? (
                            <ul className="space-y-1.5">
                              {tp.take_profits.map((t, i) => (
                                <li key={i} className="flex items-baseline justify-between gap-2">
                                  <span className="text-[10px] font-black text-sky-300/80">{t.label}</span>
                                  <span className="text-[12px] font-extrabold text-white text-right">{t.level}</span>
                                </li>
                              ))}
                            </ul>
                          ) : <p className="text-[11px] text-gray-500">—</p>}
                        </div>
                      </div>
                      {tp.position_note && (
                        <p className="text-[10px] text-gray-500 mt-2.5 flex items-start gap-1.5"><Zap className="w-3 h-3 mt-0.5 text-amber-400/70 flex-shrink-0" /> {tp.position_note}</p>
                      )}
                    </SectionCard>
                  )}

                  {/* Liquidité */}
                  {(a.liquidity.buy_side.length > 0 || a.liquidity.sell_side.length > 0 || a.liquidity.recent_sweep || a.liquidity.inducement) && (
                    <SectionCard icon={<Waves className="w-4 h-4" />} title="Analyse de liquidité (SMC)" accent="indigo">
                      <div className="grid sm:grid-cols-2 gap-3 mb-3">
                        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                          <p className="text-[10px] font-black uppercase tracking-wider text-emerald-300/90 mb-1.5">Liquidité d’achat (BSL)</p>
                          {a.liquidity.buy_side.length > 0 ? (
                            <ul className="space-y-1">{a.liquidity.buy_side.map((l, i) => <li key={i} className="text-[11px] text-gray-300 flex items-start gap-1.5"><span className="text-emerald-400 mt-0.5">▲</span> {l}</li>)}</ul>
                          ) : <p className="text-[11px] text-gray-600">—</p>}
                        </div>
                        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                          <p className="text-[10px] font-black uppercase tracking-wider text-rose-300/90 mb-1.5">Liquidité de vente (SSL)</p>
                          {a.liquidity.sell_side.length > 0 ? (
                            <ul className="space-y-1">{a.liquidity.sell_side.map((l, i) => <li key={i} className="text-[11px] text-gray-300 flex items-start gap-1.5"><span className="text-rose-400 mt-0.5">▼</span> {l}</li>)}</ul>
                          ) : <p className="text-[11px] text-gray-600">—</p>}
                        </div>
                      </div>
                      {a.liquidity.recent_sweep && <StructRow label="Sweep récent" value={a.liquidity.recent_sweep} />}
                      {a.liquidity.inducement && <StructRow label="Inducement" value={a.liquidity.inducement} />}
                    </SectionCard>
                  )}

                  {/* Points d'intérêt */}
                  {(a.points_of_interest.order_blocks.length > 0 || a.points_of_interest.fvgs.length > 0 || a.points_of_interest.breakers.length > 0) && (
                    <SectionCard icon={<Target className="w-4 h-4" />} title="Points d’intérêt (POI)" accent="amber">
                      {a.points_of_interest.order_blocks.length > 0 && (
                        <div className="mb-4">
                          <p className="text-[10px] font-black uppercase tracking-wider text-gray-400 mb-2">Order Blocks</p>
                          <div className="overflow-x-auto -mx-1">
                            <table className="w-full text-left min-w-[480px]">
                              <thead>
                                <tr className="text-[9px] uppercase tracking-wider text-gray-500 border-b border-white/[0.06]">
                                  <th className="py-1.5 px-2 font-bold">Type</th>
                                  <th className="py-1.5 px-2 font-bold">Zone</th>
                                  <th className="py-1.5 px-2 font-bold">Force</th>
                                  <th className="py-1.5 px-2 font-bold">Note</th>
                                </tr>
                              </thead>
                              <tbody>
                                {a.points_of_interest.order_blocks.map((o, i) => (
                                  <tr key={i} className="border-b border-white/[0.04] last:border-0">
                                    <td className="py-2 px-2">
                                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-black ${o.type === "demand" ? "bg-emerald-500/15 text-emerald-300" : "bg-rose-500/15 text-rose-300"}`}>
                                        {o.type === "demand" ? "DEMANDE" : "OFFRE"}
                                      </span>
                                    </td>
                                    <td className="py-2 px-2 text-[12px] font-bold text-white whitespace-nowrap">{o.zone}</td>
                                    <td className="py-2 px-2"><span className="text-[10px] text-gray-400 mr-1.5">{o.strength}</span><Stars n={o.stars} /></td>
                                    <td className="py-2 px-2 text-[10px] text-gray-400 leading-snug">{o.note}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                      {a.points_of_interest.fvgs.length > 0 && (
                        <div className="mb-4">
                          <p className="text-[10px] font-black uppercase tracking-wider text-gray-400 mb-2">Fair Value Gaps (FVG)</p>
                          <div className="space-y-1.5">
                            {a.points_of_interest.fvgs.map((f, i) => (
                              <div key={i} className="flex flex-wrap items-center gap-2 rounded-lg bg-white/[0.03] border border-white/[0.05] px-2.5 py-1.5">
                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-black ${f.type.toLowerCase().includes("baiss") ? "bg-rose-500/15 text-rose-300" : "bg-emerald-500/15 text-emerald-300"}`}>{f.type.toUpperCase() || "FVG"}</span>
                                <span className="text-[12px] font-bold text-white">{f.zone}</span>
                                {f.status && <span className="text-[10px] text-gray-500">({f.status})</span>}
                                {f.note && <span className="text-[10px] text-gray-400 basis-full md:basis-auto">— {f.note}</span>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {a.points_of_interest.breakers.length > 0 && (
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-wider text-gray-400 mb-2">Breaker Blocks</p>
                          <div className="space-y-1.5">
                            {a.points_of_interest.breakers.map((b, i) => (
                              <div key={i} className="flex flex-wrap items-center gap-2 rounded-lg bg-white/[0.03] border border-white/[0.05] px-2.5 py-1.5">
                                <span className="text-[12px] font-bold text-white">{b.zone}</span>
                                {b.note && <span className="text-[10px] text-gray-400">— {b.note}</span>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </SectionCard>
                  )}

                  {/* Indicateurs visibles */}
                  {a.indicators_visible.length > 0 && (
                    <SectionCard icon={<Activity className="w-4 h-4" />} title="Indicateurs visibles sur l’image" accent="cyan">
                      <div className="flex flex-wrap gap-1.5">
                        {a.indicators_visible.map((ind, i) => (
                          <span key={i} className="px-2 py-1 rounded-lg bg-white/[0.04] border border-white/[0.07] text-[11px] text-gray-300">{ind}</span>
                        ))}
                      </div>
                    </SectionCard>
                  )}

                  {/* Niveaux à surveiller */}
                  {a.key_levels.length > 0 && (
                    <SectionCard icon={<Eye className="w-4 h-4" />} title="Niveaux à surveiller" accent="indigo">
                      <div className="overflow-x-auto -mx-1">
                        <table className="w-full text-left min-w-[420px]">
                          <thead>
                            <tr className="text-[9px] uppercase tracking-wider text-gray-500 border-b border-white/[0.06]">
                              <th className="py-1.5 px-2 font-bold">Niveau</th>
                              <th className="py-1.5 px-2 font-bold">Rôle technique</th>
                              <th className="py-1.5 px-2 font-bold">Priorité</th>
                            </tr>
                          </thead>
                          <tbody>
                            {a.key_levels.map((l, i) => (
                              <tr key={i} className="border-b border-white/[0.04] last:border-0">
                                <td className="py-2 px-2 text-[12px] font-extrabold text-white whitespace-nowrap">{l.level}</td>
                                <td className="py-2 px-2 text-[11px] text-gray-300">{l.role}</td>
                                <td className="py-2 px-2">
                                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-black ${l.priority.toLowerCase().includes("critique") ? "bg-rose-500/15 text-rose-300" : l.priority.toLowerCase().includes("haute") ? "bg-amber-500/15 text-amber-300" : "bg-white/[0.06] text-gray-400"}`}>
                                    {(l.priority || "—").toUpperCase()}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </SectionCard>
                  )}

                  {/* Scénarios */}
                  {a.scenarios.length > 0 && (
                    <SectionCard icon={<GitBranchIcon />} title="Scénarios proposés" accent="indigo">
                      <div className="space-y-3">
                        {a.scenarios.map((s, i) => {
                          const bull = s.direction.toLowerCase().includes("hauss");
                          return (
                            <div key={i} className={`rounded-xl border p-3.5 ${i === 0 ? "border-indigo-400/30 bg-indigo-500/[0.06]" : "border-white/[0.06] bg-white/[0.02]"}`}>
                              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                                <p className={`text-[12px] font-extrabold flex items-center gap-1.5 ${bull ? "text-emerald-300" : s.direction.toLowerCase().includes("baiss") ? "text-rose-300" : "text-gray-200"}`}>
                                  {bull ? <TrendingUp className="w-3.5 h-3.5" /> : s.direction.toLowerCase().includes("baiss") ? <TrendingDown className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
                                  {s.name}{s.direction ? ` — ${s.direction}` : ""}
                                </p>
                                {s.probability != null && (
                                  <span className="px-2 py-0.5 rounded-full bg-white/[0.07] border border-white/10 text-[10px] font-black text-gray-200 tabular-nums">
                                    probabilité ~ {s.probability} %
                                  </span>
                                )}
                              </div>
                              {s.path && <p className="text-[11px] leading-relaxed text-gray-300">{s.path}</p>}
                              {(s.entry || s.stop_loss || s.take_profits.length > 0) && (
                                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-[10px]">
                                  {s.entry && <span className="text-emerald-300"><b className="text-emerald-400/80">Entrée :</b> {s.entry}</span>}
                                  {s.stop_loss && <span className="text-rose-300"><b className="text-rose-400/80">SL :</b> {s.stop_loss}</span>}
                                  {s.take_profits.length > 0 && <span className="text-sky-300"><b className="text-sky-400/80">TP :</b> {s.take_profits.join(" → ")}</span>}
                                </div>
                              )}
                              {s.conditions.length > 0 && (
                                <ul className="mt-2 space-y-0.5">
                                  {s.conditions.map((c, j) => <li key={j} className="text-[10px] text-gray-400 flex items-start gap-1.5"><CheckCircle2 className="w-3 h-3 text-gray-500 mt-0.5 flex-shrink-0" /> {c}</li>)}
                                </ul>
                              )}
                              {s.invalidation && (
                                <p className="mt-2 text-[10px] text-amber-200/90 bg-amber-500/[0.08] border border-amber-500/20 rounded-lg px-2 py-1.5">
                                  <b>Invalidation :</b> {s.invalidation}
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </SectionCard>
                  )}

                  {/* Conclusion */}
                  {a.conclusion && (
                    <SectionCard icon={<Sparkles className="w-4 h-4" />} title="Conclusion" accent="emerald">
                      <div className="flex flex-wrap items-start gap-4">
                        <p className="flex-1 min-w-[240px] text-[12px] leading-relaxed text-gray-300">{a.conclusion}</p>
                        {a.confidence != null && (
                          <div className="text-center px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.07]">
                            <p className="text-[9px] uppercase tracking-wider text-gray-500 font-bold">Confiance</p>
                            <p className="text-xl font-black text-white tabular-nums">{a.confidence}<span className="text-[11px] text-gray-500">/10</span></p>
                          </div>
                        )}
                      </div>
                    </SectionCard>
                  )}

                  {/* Avertissement légal */}
                  <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/25 bg-amber-500/[0.07] px-4 py-3">
                    <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                    <p className="text-[10px] leading-relaxed text-amber-100/90">
                      <b>Avertissement :</b> cette analyse est générée automatiquement par une IA à partir d’une image.
                      Elle est fournie à titre <b>purement pédagogique</b> et ne constitue <b>pas un conseil financier</b>.
                      Les niveaux dépendent de la qualité de la capture. Le trading de cryptomonnaies comporte un risque
                      élevé de perte en capital — ne risque que ce que tu peux te permettre de perdre.
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          <p className="text-center text-[10px] text-gray-600 mt-8 mb-4">
            CryptoIA — Analyse de Graphique IA · les analyses sont le reflet de l’image fournie, jamais une certitude.
          </p>
        </div>
      </main>
    </div>
  );
}

function StructRow({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2">
      <span className="text-[10px] uppercase tracking-wider text-gray-500 font-bold min-w-[110px] pt-0.5">{label}</span>
      <span className="text-[12px] text-gray-200 leading-snug flex-1">{value}</span>
    </div>
  );
}

function ChecklistIcon() {
  return <ClipboardCopy className="w-3.5 h-3.5 text-gray-500" />;
}

function GitBranchIcon() {
  return <RefreshCw className="w-4 h-4" />;
}

function AnalysisSkeleton() {
  const steps = [
    "Lecture de l’image (paire, timeframe, échelle de prix)…",
    "Identification de la structure de marché (BOS, HH/HL, LH/LL)…",
    "Détection des zones de liquidité, order blocks et FVG…",
    "Élaboration des scénarios, entrées et sorties…",
  ];
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-[#0D1220]/80 p-5">
      <div className="flex items-center gap-2.5 mb-4">
        <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
        <p className="text-[12px] font-bold text-gray-300">L’IA décrypte ton graphique — cela peut prendre 20 à 60 secondes.</p>
      </div>
      <ul className="space-y-2">
        {steps.map((s, i) => (
          <li key={i} className="flex items-center gap-2 text-[11px] text-gray-500">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400/60 animate-pulse" style={{ animationDelay: `${i * 300}ms` }} /> {s}
          </li>
        ))}
      </ul>
      <div className="mt-4 space-y-2.5">
        {[100, 85, 92, 70].map((w, i) => (
          <div key={i} className="h-3 rounded bg-white/[0.05] animate-pulse" style={{ width: `${w}%` }} />
        ))}
      </div>
    </div>
  );
}
