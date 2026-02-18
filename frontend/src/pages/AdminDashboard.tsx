import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import { Link } from "react-router-dom";
import {
  Users,
  CreditCard,
  Tag,
  MessageSquare,
  BarChart3,
  Shield,
} from "lucide-react";

const ADMIN_CARDS = [
  { label: "Utilisateurs", value: "1,247", change: "+12%", icon: Users, path: "/admin/users", color: "indigo" },
  { label: "Revenus", value: "$45,890", change: "+8%", icon: CreditCard, path: "/admin/pricing", color: "emerald" },
  { label: "Promos actives", value: "5", change: "+2", icon: Tag, path: "/admin/promos", color: "amber" },
  { label: "Messages", value: "23", change: "+5", icon: MessageSquare, path: "/admin/messages", color: "blue" },
  { label: "Analytics", value: "98.5%", change: "+0.3%", icon: BarChart3, path: "/admin/analytics", color: "purple" },
];

function getColor(c: string) {
  const map: Record<string, { bg: string; text: string; icon: string }> = {
    indigo: { bg: "bg-indigo-500/10", text: "text-indigo-400", icon: "bg-indigo-500/20" },
    emerald: { bg: "bg-emerald-500/10", text: "text-emerald-400", icon: "bg-emerald-500/20" },
    amber: { bg: "bg-amber-500/10", text: "text-amber-400", icon: "bg-amber-500/20" },
    blue: { bg: "bg-blue-500/10", text: "text-blue-400", icon: "bg-blue-500/20" },
    purple: { bg: "bg-purple-500/10", text: "text-purple-400", icon: "bg-purple-500/20" },
  };
  return map[c] || map.indigo;
}

export default function AdminDashboard() {
  const [, setTime] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setTime(new Date()), 60000); return () => clearInterval(t); }, []);

  return (
    <div className="min-h-screen bg-[#0A0E1A] flex">
      <Sidebar />
      <main className="flex-1 ml-[260px] p-8">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="w-8 h-8 text-amber-400" />
          <h1 className="text-3xl font-bold text-white">Admin Panel</h1>
        </div>
        <p className="text-gray-400 mb-8">Gérez votre plateforme CryptoIA</p>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {ADMIN_CARDS.map((card, i) => {
            const c = getColor(card.color);
            const Icon = card.icon;
            return (
              <Link key={i} to={card.path} className={`${c.bg} rounded-2xl border border-white/[0.06] p-6 hover:border-white/[0.12] transition-colors`}>
                <div className={`w-10 h-10 rounded-xl ${c.icon} flex items-center justify-center mb-3`}>
                  <Icon className={`w-5 h-5 ${c.text}`} />
                </div>
                <p className="text-gray-400 text-xs font-semibold">{card.label}</p>
                <p className="text-white text-2xl font-black mt-1">{card.value}</p>
                <p className="text-emerald-400 text-xs font-semibold mt-1">{card.change}</p>
              </Link>
            );
          })}
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-[#111827] rounded-2xl border border-white/[0.06] p-8">
            <h2 className="text-lg font-bold text-white mb-4">📊 Activité récente</h2>
            <div className="space-y-3">
              {[
                { action: "Nouvel abonnement Premium", user: "marc.d@email.com", time: "Il y a 5 min" },
                { action: "Paiement reçu $69.99", user: "julie.l@email.com", time: "Il y a 15 min" },
                { action: "Nouveau compte créé", user: "alex.r@email.com", time: "Il y a 30 min" },
                { action: "Upgrade vers Pro", user: "sophie.m@email.com", time: "Il y a 1h" },
                { action: "Code promo utilisé: CRYPTO20", user: "pierre.b@email.com", time: "Il y a 2h" },
              ].map((a, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-white/[0.03] rounded-xl">
                  <div>
                    <p className="text-white text-sm font-semibold">{a.action}</p>
                    <p className="text-gray-500 text-xs">{a.user}</p>
                  </div>
                  <span className="text-gray-500 text-xs">{a.time}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#111827] rounded-2xl border border-white/[0.06] p-8">
            <h2 className="text-lg font-bold text-white mb-4">📈 Répartition des plans</h2>
            <div className="space-y-4">
              {[
                { plan: "Free", users: 680, pct: 55, color: "#6b7280" },
                { plan: "Premium", users: 312, pct: 25, color: "#3b82f6" },
                { plan: "Advanced", users: 178, pct: 14, color: "#8b5cf6" },
                { plan: "Pro", users: 77, pct: 6, color: "#f59e0b" },
              ].map((p, i) => (
                <div key={i} className="flex items-center gap-4">
                  <span className="text-gray-300 text-sm font-semibold w-20">{p.plan}</span>
                  <div className="flex-1 h-3 bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${p.pct}%`, background: p.color }} />
                  </div>
                  <span className="text-white font-bold text-sm w-12 text-right">{p.users}</span>
                  <span className="text-gray-500 text-xs w-10 text-right">{p.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}