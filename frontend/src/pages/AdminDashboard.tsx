import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Sidebar from "@/components/Sidebar";
import {
  Shield, Users, BarChart3, CreditCard, MessageSquare, Tag, TrendingUp, TrendingDown,
  Activity, Eye, DollarSign, Clock, ArrowUpRight, ArrowDownRight, Zap
} from "lucide-react";

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  revenue: number;
  revenueChange: number;
  proSubscribers: number;
  enterpriseSubscribers: number;
  openTickets: number;
  avgSessionTime: string;
  pageViews: number;
  conversionRate: number;
}

function StatCard({ icon: Icon, label, value, change, color, trend }: {
  icon: React.ElementType; label: string; value: string; change?: string; color: string; trend?: "up" | "down";
}) {
  return (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5 hover:border-white/[0.12] transition-all group">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        {change && (
          <span className={`flex items-center gap-1 text-xs font-bold ${
            trend === "up" ? "text-emerald-400" : trend === "down" ? "text-red-400" : "text-gray-400"
          }`}>
            {trend === "up" ? <ArrowUpRight className="w-3 h-3" /> : trend === "down" ? <ArrowDownRight className="w-3 h-3" /> : null}
            {change}
          </span>
        )}
      </div>
      <p className="text-2xl font-black mb-1">{value}</p>
      <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">{label}</p>
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 12547,
    activeUsers: 3842,
    revenue: 47850,
    revenueChange: 12.5,
    proSubscribers: 892,
    enterpriseSubscribers: 47,
    openTickets: 23,
    avgSessionTime: "14m 32s",
    pageViews: 284500,
    conversionRate: 3.8,
  });

  const [recentActivity] = useState([
    { time: "Il y a 2 min", event: "Nouvel abonnement Pro", user: "marc.d@email.com", type: "subscription" },
    { time: "Il y a 5 min", event: "Ticket support ouvert", user: "sophie.l@email.com", type: "ticket" },
    { time: "Il y a 12 min", event: "Paiement reçu — $29", user: "thomas.r@email.com", type: "payment" },
    { time: "Il y a 18 min", event: "Nouveau membre inscrit", user: "amira.k@email.com", type: "signup" },
    { time: "Il y a 25 min", event: "Upgrade Enterprise", user: "lucas.p@email.com", type: "subscription" },
    { time: "Il y a 30 min", event: "Ticket résolu", user: "karim.b@email.com", type: "ticket" },
  ]);

  const adminLinks = [
    { path: "/admin/analytics", label: "Analytics", icon: BarChart3, desc: "Statistiques détaillées", color: "from-blue-500 to-indigo-600" },
    { path: "/admin/users", label: "Utilisateurs", icon: Users, desc: "Gestion des comptes", color: "from-emerald-500 to-green-600" },
    { path: "/admin/pricing", label: "Tarification", icon: CreditCard, desc: "Plans et prix", color: "from-amber-500 to-orange-600" },
    { path: "/admin/promos", label: "Promotions", icon: Tag, desc: "Codes promo", color: "from-purple-500 to-pink-600" },
    { path: "/admin/messages", label: "Messages", icon: MessageSquare, desc: "Support client", color: "from-cyan-500 to-blue-600" },
  ];

  return (
    <div className="min-h-screen bg-[#0A0E1A] text-white">
      <Sidebar />
      <main className="ml-[260px] p-6 min-h-screen">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold">Admin Dashboard</h1>
              <p className="text-sm text-gray-400">Vue d'ensemble de la plateforme CryptoIA</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-bold text-emerald-400">
              <Activity className="w-3 h-3" /> Système OK
            </span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
          <StatCard icon={Users} label="Total Utilisateurs" value={stats.totalUsers.toLocaleString()} change="+245 ce mois" color="bg-gradient-to-r from-blue-500 to-indigo-600" trend="up" />
          <StatCard icon={Eye} label="Utilisateurs Actifs" value={stats.activeUsers.toLocaleString()} change="30.6% du total" color="bg-gradient-to-r from-emerald-500 to-green-600" trend="up" />
          <StatCard icon={DollarSign} label="Revenu Mensuel" value={`$${stats.revenue.toLocaleString()}`} change={`+${stats.revenueChange}%`} color="bg-gradient-to-r from-amber-500 to-orange-600" trend="up" />
          <StatCard icon={Zap} label="Abonnés Pro" value={stats.proSubscribers.toLocaleString()} change="+38 ce mois" color="bg-gradient-to-r from-purple-500 to-pink-600" trend="up" />
          <StatCard icon={MessageSquare} label="Tickets Ouverts" value={String(stats.openTickets)} change="-5 vs semaine" color="bg-gradient-to-r from-cyan-500 to-blue-600" trend="down" />
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          {/* Quick Links */}
          <div className="lg:col-span-2">
            <h2 className="text-lg font-bold mb-4">Accès Rapide</h2>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
              {adminLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link key={link.path} to={link.path}
                    className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 hover:bg-white/[0.05] hover:border-white/[0.12] transition-all group">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-r ${link.color} flex items-center justify-center mb-3`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="font-bold text-sm mb-0.5">{link.label}</h3>
                    <p className="text-[10px] text-gray-500">{link.desc}</p>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Recent Activity */}
          <div>
            <h2 className="text-lg font-bold mb-4">Activité Récente</h2>
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl divide-y divide-white/[0.04]">
              {recentActivity.map((activity, i) => (
                <div key={i} className="px-4 py-3 hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                      activity.type === "subscription" ? "bg-purple-400" :
                      activity.type === "payment" ? "bg-emerald-400" :
                      activity.type === "ticket" ? "bg-amber-400" : "bg-blue-400"
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate">{activity.event}</p>
                      <p className="text-[10px] text-gray-500 truncate">{activity.user}</p>
                    </div>
                    <span className="text-[10px] text-gray-600 whitespace-nowrap">{activity.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Additional KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={Clock} label="Session Moyenne" value={stats.avgSessionTime} color="bg-gradient-to-r from-indigo-500 to-blue-600" />
          <StatCard icon={TrendingUp} label="Pages Vues / Mois" value={`${(stats.pageViews / 1000).toFixed(1)}K`} change="+18%" color="bg-gradient-to-r from-teal-500 to-emerald-600" trend="up" />
          <StatCard icon={Activity} label="Taux Conversion" value={`${stats.conversionRate}%`} change="+0.3%" color="bg-gradient-to-r from-rose-500 to-pink-600" trend="up" />
          <StatCard icon={Shield} label="Enterprise" value={String(stats.enterpriseSubscribers)} change="+3 ce mois" color="bg-gradient-to-r from-amber-500 to-yellow-600" trend="up" />
        </div>
      </main>
    </div>
  );
}