import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "@/components/AdminLayout";
import * as storeLib from "@/lib/store";
import {
  Shield, Users, BarChart3, CreditCard, MessageSquare, Tag, TrendingUp,
  Activity, Eye, DollarSign, Zap, ArrowUpRight, ArrowDownRight, BookOpen,
  Download, Mail, FileText
} from "lucide-react";
import Footer from "@/components/Footer";

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
  const [stats, setStats] = useState<ReturnType<typeof storeLib.getDashboardStats> | null>(null);

  useEffect(() => {
    setStats(storeLib.getDashboardStats());
  }, []);

  if (!stats) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  const adminLinks = [
    { path: "/admin/analytics", label: "Analytics", icon: BarChart3, desc: "Statistiques détaillées", color: "from-blue-500 to-indigo-600" },
    { path: "/admin/users", label: "Utilisateurs", icon: Users, desc: `${stats.totalUsers} comptes`, color: "from-emerald-500 to-green-600" },
    { path: "/admin/pricing", label: "Tarification", icon: CreditCard, desc: "Plans et prix", color: "from-amber-500 to-orange-600" },
    { path: "/admin/promos", label: "Promotions", icon: Tag, desc: `${stats.activePromos} actifs`, color: "from-purple-500 to-pink-600" },
    { path: "/admin/messages", label: "Messages", icon: MessageSquare, desc: `${stats.unreadMessages} non lus`, color: "from-cyan-500 to-blue-600" },
  ];

  // Build recent activity from real data
  const recentActivity: { time: string; event: string; user: string; type: string }[] = [];

  // Add recent messages
  stats.messages.slice(0, 3).forEach((msg) => {
    const date = new Date(msg.created_at);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const timeStr = diffMins < 60 ? `Il y a ${diffMins} min` : diffMins < 1440 ? `Il y a ${Math.floor(diffMins / 60)}h` : `Il y a ${Math.floor(diffMins / 1440)}j`;
    recentActivity.push({
      time: timeStr,
      event: `Message: ${msg.subject}`,
      user: msg.email,
      type: "message",
    });
  });

  // Add recent users
  stats.users
    .sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""))
    .slice(0, 3)
    .forEach((u) => {
      recentActivity.push({
        time: u.created_at || "",
        event: u.plan !== "free" ? `Abonnement ${u.plan}` : "Inscription gratuite",
        user: u.username,
        type: u.plan !== "free" ? "subscription" : "signup",
      });
    });

  return (
    <AdminLayout>
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
            <Activity className="w-3 h-3" /> Données en direct
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        <StatCard
          icon={Users}
          label="Total Utilisateurs"
          value={stats.totalUsers.toLocaleString()}
          color="bg-gradient-to-r from-blue-500 to-indigo-600"
        />
        <StatCard
          icon={Zap}
          label="Abonnés Payants"
          value={stats.activeSubscriptions.toLocaleString()}
          change={`${stats.conversionRate}% du total`}
          color="bg-gradient-to-r from-purple-500 to-pink-600"
          trend="up"
        />
        <StatCard
          icon={DollarSign}
          label="Revenu Estimé"
          value={`$${stats.totalRevenue.toFixed(0)}`}
          color="bg-gradient-to-r from-amber-500 to-orange-600"
        />
        <StatCard
          icon={Mail}
          label="Messages Non Lus"
          value={String(stats.unreadMessages)}
          change={`${stats.messages.length} total`}
          color="bg-gradient-to-r from-cyan-500 to-blue-600"
          trend={stats.unreadMessages > 0 ? "up" : undefined}
        />
        <StatCard
          icon={BookOpen}
          label="Ebooks Actifs"
          value={String(stats.activeEbooks)}
          change={`${stats.totalDownloads} DL`}
          color="bg-gradient-to-r from-emerald-500 to-green-600"
          trend="up"
        />
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
            {recentActivity.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500 text-sm">Aucune activité récente</div>
            ) : (
              recentActivity.slice(0, 6).map((activity, i) => (
                <div key={i} className="px-4 py-3 hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                      activity.type === "subscription" ? "bg-purple-400" :
                      activity.type === "payment" ? "bg-emerald-400" :
                      activity.type === "message" ? "bg-cyan-400" : "bg-blue-400"
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate">{activity.event}</p>
                      <p className="text-[10px] text-gray-500 truncate">{activity.user}</p>
                    </div>
                    <span className="text-[10px] text-gray-600 whitespace-nowrap">{activity.time}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Plan Distribution */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {stats.planDistribution.map((p) => (
          <div key={p.plan} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 text-center">
            <div className="w-8 h-8 rounded-lg mx-auto mb-2 flex items-center justify-center" style={{ backgroundColor: `${p.color}20` }}>
              <span className="text-sm font-black" style={{ color: p.color }}>{p.count}</span>
            </div>
            <p className="text-xs font-bold text-gray-400">{p.plan}</p>
          </div>
        ))}
      </div>

      {/* Additional KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={Tag}
          label="Promos Actives"
          value={String(stats.activePromos)}
          color="bg-gradient-to-r from-rose-500 to-pink-600"
        />
        <StatCard
          icon={Download}
          label="Total Téléchargements"
          value={stats.totalDownloads.toLocaleString()}
          color="bg-gradient-to-r from-teal-500 to-emerald-600"
        />
        <StatCard
          icon={Eye}
          label="Taux Conversion"
          value={`${stats.conversionRate}%`}
          color="bg-gradient-to-r from-indigo-500 to-blue-600"
        />
        <StatCard
          icon={FileText}
          label="Total Ebooks"
          value={String(stats.ebooks.length)}
          color="bg-gradient-to-r from-amber-500 to-yellow-600"
        />
      </div>
    </AdminLayout>
  );
}