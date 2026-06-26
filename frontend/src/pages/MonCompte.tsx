import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import Sidebar from "@/components/Sidebar";
import {
  getUserPlan,
  getPlanDisplayInfo,
  getSubscriptionInfo,
  clearUserPlan,
  type PlanType,
} from "@/lib/subscription";
import { isAdminAuthenticated } from "@/pages/AdminLogin";
import {
  User, Shield, Bell, Key, LogOut, Calendar, CreditCard, Settings,
  Eye, EyeOff, Save, CheckCircle, Crown, ShieldCheck, Clock,
  AlertTriangle, RefreshCw,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Footer from "@/components/Footer";

export default function MonCompte() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"profile" | "security" | "notifications" | "subscription">("profile");
  const [showApiKey, setShowApiKey] = useState(false);
  const [saved, setSaved] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<PlanType>(getUserPlan());
  const isAdmin = isAdminAuthenticated();
  const subInfo = getSubscriptionInfo();

  useEffect(() => {
    setCurrentPlan(getUserPlan());
  }, []);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleCancelSubscription = () => {
    if (window.confirm(t("pages.monCompte.cancelConfirm"))) {
      clearUserPlan();
      setCurrentPlan("free");
      window.location.reload();
    }
  };

  const planInfo = getPlanDisplayInfo(currentPlan);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    try {
      return new Date(dateStr).toLocaleDateString(i18n.language === "en" ? "en-US" : "fr-CA", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  // Summary cards data
  const summaryCards = [
    { icon: Calendar, label: t("pages.monCompte.memberSince"), value: i18n.language === "en" ? "Jan 2026" : "Jan 2026", color: "text-blue-400" },
    { icon: isAdmin ? ShieldCheck : CreditCard, label: t("pages.monCompte.currentPlan"), value: planInfo.label, color: planInfo.color },
    {
      icon: Shield,
      label: t("pages.monCompte.status"),
      value: isAdmin ? t("pages.monCompte.statusAdmin") : subInfo.expired ? t("pages.monCompte.statusExpired") : subInfo.isActive ? t("pages.monCompte.statusActive") : t("pages.monCompte.statusFree"),
      color: isAdmin ? "text-red-400" : subInfo.expired ? "text-red-400" : subInfo.isActive ? "text-emerald-400" : "text-gray-400",
    },
    {
      icon: Clock,
      label: subInfo.isActive ? t("pages.monCompte.daysRemaining") : t("pages.monCompte.activeAlerts"),
      value: subInfo.isActive ? `${subInfo.daysRemaining}${t("pages.monCompte.days")}` : "3",
      color: subInfo.isActive
        ? subInfo.daysRemaining <= 7 ? "text-red-400" : subInfo.daysRemaining <= 14 ? "text-amber-400" : "text-emerald-400"
        : "text-amber-400",
    },
  ];

  const tabs = [
    { id: "profile" as const, label: t("pages.monCompte.tabProfile"), icon: User },
    { id: "subscription" as const, label: t("pages.monCompte.tabSubscription"), icon: Crown },
    { id: "security" as const, label: t("pages.monCompte.tabSecurity"), icon: Shield },
    { id: "notifications" as const, label: t("pages.monCompte.tabNotifications"), icon: Bell },
  ];

  const notifications = [
    { label: t("pages.monCompte.notifPriceAlerts"), desc: t("pages.monCompte.notifPriceAlertsDesc"), enabled: true },
    { label: t("pages.monCompte.notifAiSignals"), desc: t("pages.monCompte.notifAiSignalsDesc"), enabled: true },
    { label: t("pages.monCompte.notifNews"), desc: t("pages.monCompte.notifNewsDesc"), enabled: false },
    { label: t("pages.monCompte.notifWeekly"), desc: t("pages.monCompte.notifWeeklyDesc"), enabled: true },
    { label: t("pages.monCompte.notifProduct"), desc: t("pages.monCompte.notifProductDesc"), enabled: false },
  ];

  return (
    <div className="min-h-screen bg-[#0A0E1A] text-white">
      <Sidebar />
      <main className="md:ml-[260px] p-4 md:p-6 pt-[72px] md:pt-6 min-h-screen">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 flex items-center justify-center">
              <User className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold" data-testid="account-title">{t("pages.monCompte.title")}</h1>
              <p className="text-sm text-gray-400">{t("pages.monCompte.subtitle")}</p>
            </div>
          </div>
        </div>

        {/* Account Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {summaryCards.map((item, i) => {
            const Icon = item.icon;
            return (
              <div key={i} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
                <Icon className={`w-5 h-5 ${item.color} mb-2`} />
                <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">{item.label}</p>
                <p className={`text-lg font-bold ${item.color} mt-1`}>{item.value}</p>
              </div>
            );
          })}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                data-testid={`account-tab-${tab.id}`}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? "bg-gradient-to-r from-emerald-500/15 to-green-500/10 text-emerald-400 border border-emerald-500/20"
                    : "bg-white/[0.03] border border-white/[0.06] text-gray-400 hover:text-white hover:bg-white/[0.05]"
                }`}>
                <Icon className="w-4 h-4" /> {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6">
          {activeTab === "profile" && (
            <div className="space-y-5">
              <h2 className="text-lg font-bold flex items-center gap-2"><User className="w-5 h-5 text-emerald-400" /> {t("pages.monCompte.profileInfo")}</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{t("pages.monCompte.fullName")}</label>
                  <input type="text" defaultValue="Utilisateur CryptoIA" className="w-full px-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500/50" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{t("pages.monCompte.email")}</label>
                  <input type="email" defaultValue="user@cryptoia.com" className="w-full px-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500/50" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{t("pages.monCompte.phone")}</label>
                  <input type="tel" defaultValue="+1 (514) 000-0000" className="w-full px-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500/50" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{t("pages.monCompte.timezone")}</label>
                  <select className="w-full px-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500/50">
                    <option value="est">EST (UTC-5)</option>
                    <option value="pst">PST (UTC-8)</option>
                    <option value="cet">CET (UTC+1)</option>
                  </select>
                </div>
              </div>
              <button onClick={handleSave} className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold text-sm hover:brightness-110 transition-all" data-testid="account-save-profile">
                {saved ? <><CheckCircle className="w-4 h-4" /> {t("pages.monCompte.saved")}</> : <><Save className="w-4 h-4" /> {t("pages.monCompte.save")}</>}
              </button>
            </div>
          )}

          {activeTab === "subscription" && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold flex items-center gap-2"><Crown className="w-5 h-5 text-amber-400" /> {t("pages.monCompte.subscriptionManagement")}</h2>

              {/* Admin Notice */}
              {isAdmin && (
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20">
                  <ShieldCheck className="w-5 h-5 text-red-400 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-red-400">{t("pages.monCompte.adminModeActive")}</p>
                    <p className="text-xs text-gray-400">{t("pages.monCompte.adminModeDesc")}</p>
                  </div>
                </div>
              )}

              {/* Expired Warning */}
              {subInfo.expired && (
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20">
                  <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-red-400">{t("pages.monCompte.subExpired")}</p>
                    <p className="text-xs text-gray-400">{t("pages.monCompte.subExpiredDesc", { date: formatDate(subInfo.endDate) })}</p>
                  </div>
                </div>
              )}

              {/* Expiring Soon Warning */}
              {subInfo.isActive && subInfo.daysRemaining <= 7 && subInfo.daysRemaining > 0 && (
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <Clock className="w-5 h-5 text-amber-400 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-amber-400">{t("pages.monCompte.renewalSoon")}</p>
                    <p className="text-xs text-gray-400">{t("pages.monCompte.renewalSoonDesc", { count: subInfo.daysRemaining, date: formatDate(subInfo.endDate) })}</p>
                  </div>
                </div>
              )}

              {/* Current Plan Card */}
              <div className={`bg-gradient-to-r ${planInfo.gradient} rounded-2xl p-6 relative overflow-hidden`}>
                <div className="absolute inset-0 bg-black/60" />
                <div className="relative z-10">
                  <p className="text-xs text-gray-300 uppercase tracking-wider mb-1">{t("pages.monCompte.currentPlan")}</p>
                  <h3 className="text-2xl font-extrabold mb-2">{planInfo.label}</h3>
                  <p className="text-sm text-gray-300">
                    {currentPlan === "admin"
                      ? t("pages.monCompte.planAdminDesc")
                      : currentPlan === "free"
                      ? t("pages.monCompte.planFreeDesc")
                      : t("pages.monCompte.planPaidDesc", { plan: planInfo.label })}
                  </p>
                </div>
              </div>

              {/* Subscription Details — only for active paid plans */}
              {subInfo.isActive && (
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
                    <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-1">{t("pages.monCompte.billingPeriod")}</p>
                    <p className="text-sm font-bold text-white flex items-center gap-2">
                      <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />
                      {subInfo.billingPeriod === "annual" ? t("pages.monCompte.annual") : t("pages.monCompte.monthly")}
                    </p>
                  </div>
                  <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
                    <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-1">{t("pages.monCompte.nextRenewal")}</p>
                    <p className="text-sm font-bold text-white flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-blue-400" />
                      {formatDate(subInfo.endDate)}
                    </p>
                  </div>
                  <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
                    <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-1">{t("pages.monCompte.daysRemaining")}</p>
                    <p className={`text-sm font-bold flex items-center gap-2 ${
                      subInfo.daysRemaining <= 7 ? "text-red-400" : subInfo.daysRemaining <= 14 ? "text-amber-400" : "text-emerald-400"
                    }`}>
                      <Clock className="w-3.5 h-3.5" />
                      {subInfo.daysRemaining} {t("pages.monCompte.days")}
                    </p>
                  </div>
                </div>
              )}

              {/* Cancel Subscription — only for active paid plans */}
              {subInfo.isActive && (
                <div className="p-4 bg-white/[0.02] border border-white/[0.06] rounded-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-gray-300">{t("pages.monCompte.cancelSub")}</h3>
                      <p className="text-xs text-gray-500 mt-1">{t("pages.monCompte.cancelSubDesc", { date: formatDate(subInfo.endDate) })}</p>
                    </div>
                    <button
                      onClick={handleCancelSubscription}
                      data-testid="account-cancel-subscription"
                      className="px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-xs font-semibold text-red-400 hover:bg-red-500/20 transition-all"
                    >
                      {t("pages.monCompte.cancelButton")}
                    </button>
                  </div>
                </div>
              )}

              {/* Upgrade CTA - only show for non-admin users who aren't on elite */}
              {!isAdmin && currentPlan !== "elite" && (
                <div className="p-5 bg-white/[0.03] border border-white/[0.06] rounded-xl">
                  <h3 className="text-sm font-bold text-gray-300 mb-2">
                    {subInfo.expired ? t("pages.monCompte.renewSub") : t("pages.monCompte.upgradePlan")}
                  </h3>
                  <p className="text-xs text-gray-500 mb-4">
                    {subInfo.expired ? t("pages.monCompte.renewDesc") : t("pages.monCompte.upgradeDesc")}
                  </p>
                  <button
                    onClick={() => navigate("/abonnements")}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-blue-600 text-white font-bold text-sm hover:brightness-110 transition-all"
                    data-testid="account-upgrade-btn"
                  >
                    <Crown className="w-4 h-4" /> {subInfo.expired ? t("pages.monCompte.renewBtn") : t("pages.monCompte.viewPlansBtn")}
                  </button>
                </div>
              )}

              {!isAdmin && currentPlan === "elite" && !subInfo.expired && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
                  <CheckCircle className="w-4 h-4" />
                  <span>{t("pages.monCompte.eliteFull")}</span>
                </div>
              )}
            </div>
          )}

          {activeTab === "security" && (
            <div className="space-y-5">
              <h2 className="text-lg font-bold flex items-center gap-2"><Shield className="w-5 h-5 text-emerald-400" /> {t("pages.monCompte.security")}</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{t("pages.monCompte.currentPassword")}</label>
                  <input type="password" placeholder="••••••••" className="w-full px-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500/50" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{t("pages.monCompte.newPassword")}</label>
                  <input type="password" placeholder="••••••••" className="w-full px-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500/50" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{t("pages.monCompte.confirmNewPassword")}</label>
                  <input type="password" placeholder="••••••••" className="w-full px-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500/50" />
                </div>
              </div>
              <button onClick={handleSave} className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold text-sm hover:brightness-110 transition-all" data-testid="account-update-password">
                {saved ? <><CheckCircle className="w-4 h-4" /> {t("pages.monCompte.saved")}</> : <><Save className="w-4 h-4" /> {t("pages.monCompte.update")}</>}
              </button>

              {/* 2FA */}
              <div className="mt-6 p-4 bg-white/[0.03] border border-white/[0.06] rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold">{t("pages.monCompte.twofa")}</h3>
                    <p className="text-xs text-gray-500 mt-1">{t("pages.monCompte.twofaDesc")}</p>
                  </div>
                  <button className="px-4 py-2 rounded-lg bg-white/[0.06] text-xs font-semibold text-gray-400 hover:text-white hover:bg-white/[0.1] transition-all" data-testid="account-activate-2fa">
                    {t("pages.monCompte.activate")}
                  </button>
                </div>
              </div>

              {/* API Keys */}
              <div className="mt-4 p-4 bg-white/[0.03] border border-white/[0.06] rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-bold flex items-center gap-2"><Key className="w-4 h-4 text-amber-400" /> {t("pages.monCompte.apiKey")}</h3>
                    <p className="text-xs text-gray-500 mt-1">{t("pages.monCompte.apiKeyDesc")}</p>
                  </div>
                  <button onClick={() => setShowApiKey(!showApiKey)} className="text-gray-500 hover:text-white transition-colors" data-testid="account-toggle-apikey">
                    {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <div className="px-4 py-3 bg-black/30 rounded-lg font-mono text-xs text-gray-400">
                  {showApiKey ? "cia_sk_live_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6" : "cia_sk_live_••••••••••••••••••••••••••••"}
                </div>
              </div>
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="space-y-5">
              <h2 className="text-lg font-bold flex items-center gap-2"><Bell className="w-5 h-5 text-emerald-400" /> {t("pages.monCompte.notificationPrefs")}</h2>
              {notifications.map((item, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/[0.06] rounded-xl">
                  <div>
                    <p className="text-sm font-bold">{item.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked={item.enabled} className="sr-only peer" />
                    <div className="w-10 h-5 bg-white/[0.08] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-gray-400 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500 peer-checked:after:bg-white" />
                  </label>
                </div>
              ))}
              <button onClick={handleSave} className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold text-sm hover:brightness-110 transition-all" data-testid="account-save-notifications">
                {saved ? <><CheckCircle className="w-4 h-4" /> {t("pages.monCompte.saved")}</> : <><Save className="w-4 h-4" /> {t("pages.monCompte.save")}</>}
              </button>
            </div>
          )}
        </div>

        {/* Danger Zone */}
        <div className="mt-6 bg-red-500/[0.03] border border-red-500/10 rounded-2xl p-6">
          <h3 className="text-sm font-bold text-red-400 mb-2">{t("pages.monCompte.dangerZone")}</h3>
          <p className="text-xs text-gray-500 mb-4">{t("pages.monCompte.dangerZoneDesc")}</p>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold hover:bg-red-500/20 transition-all" data-testid="account-logout">
              <LogOut className="w-3.5 h-3.5" /> {t("pages.monCompte.logout")}
            </button>
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold hover:bg-red-500/20 transition-all" data-testid="account-delete">
              <Settings className="w-3.5 h-3.5" /> {t("pages.monCompte.deleteAccount")}
            </button>
          </div>
        </div>
        <Footer />
      </main>
    </div>
  );
}
