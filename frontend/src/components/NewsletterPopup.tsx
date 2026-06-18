// Smart Newsletter Popup — appears on 30s timer OR exit-intent
import { useEffect, useState } from "react";
import { Sparkles, X, Mail } from "lucide-react";
import { trackEvent } from "@/lib/analytics";

const DISMISS_KEY = "cryptoia_newsletter_popup_v1";

export default function NewsletterPopup() {
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "ok" | "err">("idle");

  useEffect(() => {
    if (typeof window === "undefined") return;
    try { if (localStorage.getItem(DISMISS_KEY)) return; } catch {}
    // Don't show on admin or login pages
    if (window.location.pathname.startsWith("/admin") || window.location.pathname.includes("/login")) return;

    const timer = setTimeout(() => { setVisible(true); trackEvent("popup_shown", { type: "newsletter" }); }, 30000);

    const onMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 && !visible) {
        clearTimeout(timer);
        setVisible(true);
        trackEvent("popup_shown", { type: "newsletter_exit_intent" });
      }
    };
    document.addEventListener("mouseleave", onMouseLeave);
    return () => { clearTimeout(timer); document.removeEventListener("mouseleave", onMouseLeave); };
  }, [visible]);

  const dismiss = () => {
    setVisible(false);
    try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch {}
    trackEvent("popup_dismiss", { type: "newsletter" });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("sending");
    try {
      const res = await fetch("/api/v1/lead-magnet/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), source: "newsletter_popup", lang: "fr" }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error();
      setStatus("ok");
      try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch {}
      setTimeout(() => setVisible(false), 3000);
    } catch { setStatus("err"); }
  };

  if (!visible) return null;
  return (
    <div data-testid="newsletter-popup" className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="relative max-w-md w-full rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-950 via-[#0a0a14] to-purple-950 p-7 shadow-2xl">
        <button onClick={dismiss} aria-label="Close" className="absolute top-3 right-3 p-1.5 rounded-full bg-white/[0.06] border border-white/10 hover:bg-white/10">
          <X className="w-4 h-4 text-gray-400" />
        </button>
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span className="text-[10px] uppercase tracking-widest font-black text-amber-300">Newsletter gratuite</span>
        </div>
        <h2 className="text-xl md:text-2xl font-black text-white mb-2 leading-tight">📬 1 analyse crypto pro par semaine</h2>
        <p className="text-sm text-gray-300 mb-5 leading-relaxed">Reçois nos meilleures analyses IA chaque dimanche. Pas de spam, désinscription en 1 clic.</p>
        {status === "ok" ? (
          <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-4 text-center text-emerald-300 text-sm font-bold">✓ Inscrit ! Vérifie ta boîte mail.</div>
        ) : (
          <form onSubmit={submit} className="space-y-2">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
              <input
                type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="ton@email.com" data-testid="newsletter-popup-email"
                className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-white/[0.06] border border-white/10 text-white text-sm placeholder:text-gray-500 focus:outline-none focus:border-indigo-400/50"
              />
            </div>
            <button type="submit" disabled={status === "sending"} data-testid="newsletter-popup-submit"
              className="w-full px-5 py-2.5 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-black text-sm hover:scale-[1.01] transition-transform disabled:opacity-60">
              {status === "sending" ? "Inscription..." : "Recevoir la newsletter →"}
            </button>
            {status === "err" && <p className="text-xs text-red-400">Erreur. Réessaie.</p>}
            <button type="button" onClick={dismiss} className="w-full text-[11px] text-gray-500 hover:text-gray-300 mt-2">Non merci, je passe</button>
          </form>
        )}
      </div>
    </div>
  );
}
