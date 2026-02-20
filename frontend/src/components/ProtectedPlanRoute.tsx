import { useNavigate } from "react-router-dom";
import Sidebar from "@/components/Sidebar";
import {
  getUserPlan,
  isRouteAccessible,
  getMinimumPlanForRoute,
  getPlanDisplayInfo,
} from "@/lib/subscription";
import { Lock, ArrowRight, Crown } from "lucide-react";
import { useSessionGuard } from "@/hooks/useSessionGuard";

interface ProtectedPlanRouteProps {
  children: React.ReactNode;
  routePath: string;
}

export default function ProtectedPlanRoute({ children, routePath }: ProtectedPlanRouteProps) {
  const navigate = useNavigate();
  const currentPlan = getUserPlan();

  // Check session validity every 15 seconds
  useSessionGuard(15000);

  if (isRouteAccessible(routePath, currentPlan)) {
    return <>{children}</>;
  }

  const requiredPlan = getMinimumPlanForRoute(routePath);
  const planInfo = getPlanDisplayInfo(requiredPlan);
  const currentPlanInfo = getPlanDisplayInfo(currentPlan);

  return (
    <div className="min-h-screen bg-[#0A0E1A] text-white">
      <Sidebar />
      <main className="md:ml-[260px] p-4 md:p-6 pt-[72px] md:pt-6 min-h-screen flex items-center justify-center">
        <div className="max-w-lg w-full text-center">
          {/* Lock Icon */}
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-500/20 flex items-center justify-center mx-auto mb-6">
            <Lock className="w-10 h-10 text-red-400" />
          </div>

          <h1 className="text-2xl md:text-3xl font-extrabold mb-3">Accès Restreint</h1>
          <p className="text-gray-400 mb-6 text-sm md:text-base">
            Cette fonctionnalité nécessite un abonnement{" "}
            <span className={`font-bold ${planInfo.color}`}>{planInfo.label}</span>{" "}
            ou supérieur.
          </p>

          {/* Current Plan Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06] mb-6">
            <span className="text-xs text-gray-500">Votre plan actuel :</span>
            <span className={`text-sm font-bold ${currentPlanInfo.color}`}>
              {currentPlanInfo.label}
            </span>
          </div>

          {/* Required Plan Card */}
          <div className={`bg-gradient-to-r ${planInfo.gradient} bg-opacity-10 rounded-2xl p-6 mb-6 relative overflow-hidden`}>
            <div className="absolute inset-0 bg-black/70" />
            <div className="relative z-10">
              <Crown className={`w-8 h-8 ${planInfo.color} mx-auto mb-3`} />
              <h3 className="text-xl font-bold mb-2">Plan {planInfo.label}</h3>
              <p className="text-sm text-gray-300 mb-4">
                Débloquez cette fonctionnalité et bien plus encore avec le plan {planInfo.label}.
              </p>
              <button
                onClick={() => navigate("/abonnements")}
                className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r ${planInfo.gradient} text-white font-bold text-sm hover:brightness-110 transition-all`}
              >
                Voir les abonnements
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="text-sm text-gray-500 hover:text-white transition-colors"
          >
            ← Retour à la page précédente
          </button>
        </div>
      </main>
    </div>
  );
}