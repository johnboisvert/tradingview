import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { CheckCircle, XCircle, Loader2, ArrowRight, Home } from "lucide-react";

const PLAN_LABELS: Record<string, string> = {
  premium: "Premium",
  advanced: "Advanced",
  pro: "Pro",
  elite: "Elite",
};

export default function PaymentSuccess() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = params.get("session_id") || "";
  const planParam = params.get("plan") || "";
  const provider = params.get("provider") || "stripe"; // "stripe" | "nowpayments"
  const orderId = params.get("order_id") || "";

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [planName, setPlanName] = useState(planParam);

  useEffect(() => {
    // NOWPayments — success redirect means payment was initiated (not necessarily confirmed)
    // We show a "pending confirmation" success screen
    if (provider === "nowpayments") {
      if (planParam) {
        setPlanName(planParam);
        // Optimistically store plan; webhook will confirm server-side
        localStorage.setItem("cryptoia_user_plan", planParam);
        setStatus("success");
      } else {
        setStatus("error");
      }
      return;
    }

    // Stripe verification
    if (!sessionId) {
      setStatus("error");
      return;
    }

    const verify = async () => {
      try {
        const res = await fetch("/api/v1/payment/verify_payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ session_id: sessionId }),
        });
        if (!res.ok) throw new Error("Verification failed");
        const data = await res.json();

        if (data.status === "complete" || data.payment_status === "paid") {
          setPlanName(data.plan || planParam);
          localStorage.setItem("cryptoia_user_plan", data.plan || planParam);
          setStatus("success");
        } else {
          setStatus("error");
        }
      } catch {
        setStatus("error");
      }
    };

    verify();
  }, [sessionId, planParam, provider]);

  const isNowPayments = provider === "nowpayments";

  return (
    <div className="min-h-screen bg-[#0A0E1A] text-white flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        {status === "loading" && (
          <div className="space-y-4">
            <Loader2 className="w-16 h-16 text-indigo-400 mx-auto animate-spin" />
            <h1 className="text-2xl font-bold">Vérification du paiement…</h1>
            <p className="text-gray-400 text-sm">Veuillez patienter quelques secondes.</p>
          </div>
        )}

        {status === "success" && (
          <div className="space-y-6">
            <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto">
              <CheckCircle className="w-12 h-12 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold mb-2 bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                {isNowPayments ? "Paiement initié !" : "Paiement réussi !"}
              </h1>
              <p className="text-gray-300 text-sm leading-relaxed">
                {isNowPayments ? (
                  <>
                    Votre paiement crypto pour le plan{" "}
                    <span className="font-bold text-white">
                      {PLAN_LABELS[planName] || planName}
                    </span>{" "}
                    est en cours de confirmation sur la blockchain.
                  </>
                ) : (
                  <>
                    Bienvenue dans le plan{" "}
                    <span className="font-bold text-white">
                      {PLAN_LABELS[planName] || planName}
                    </span>
                    . Votre abonnement est maintenant actif.
                  </>
                )}
              </p>
            </div>

            <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-5 text-left space-y-3">
              {isNowPayments ? (
                <>
                  <p className="text-xs text-gray-400">
                    ⏳ Confirmation blockchain en cours (généralement 1–30 min)
                  </p>
                  <p className="text-xs text-gray-400">
                    ✅ Votre accès sera activé automatiquement après confirmation
                  </p>
                  <p className="text-xs text-gray-400">
                    📧 Référence commande : <span className="font-mono text-white text-xs">{orderId || "—"}</span>
                  </p>
                  <p className="text-xs text-gray-400">
                    💬 Questions ? Contactez <a href="mailto:cryptoia2026@proton.me" className="text-indigo-400 underline">cryptoia2026@proton.me</a>
                  </p>
                </>
              ) : (
                <>
                  <p className="text-xs text-gray-400">
                    ✅ Accès immédiat à toutes les fonctionnalités de votre plan
                  </p>
                  <p className="text-xs text-gray-400">
                    ✅ Confirmation envoyée par email via Stripe
                  </p>
                  <p className="text-xs text-gray-400">
                    ✅ Renouvellement automatique chaque mois
                  </p>
                </>
              )}
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => navigate("/")}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 font-bold text-sm hover:brightness-110 transition-all flex items-center justify-center gap-2"
              >
                Accéder au Dashboard <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => navigate("/abonnements")}
                className="w-full py-3 rounded-xl bg-white/[0.06] border border-white/[0.08] font-bold text-sm hover:bg-white/[0.1] transition-all flex items-center justify-center gap-2"
              >
                <Home className="w-4 h-4" /> Voir mes abonnements
              </button>
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-6">
            <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mx-auto">
              <XCircle className="w-12 h-12 text-red-400" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold mb-2 text-red-400">
                Paiement non confirmé
              </h1>
              <p className="text-gray-400 text-sm leading-relaxed">
                Nous n'avons pas pu confirmer votre paiement. Si vous avez été débité, contactez-nous à{" "}
                <a href="mailto:cryptoia2026@proton.me" className="text-indigo-400 underline">
                  cryptoia2026@proton.me
                </a>
              </p>
            </div>
            <button
              onClick={() => navigate("/abonnements")}
              className="w-full py-3 rounded-xl bg-white/[0.06] border border-white/[0.08] font-bold text-sm hover:bg-white/[0.1] transition-all"
            >
              Retour aux abonnements
            </button>
          </div>
        )}
      </div>
    </div>
  );
}