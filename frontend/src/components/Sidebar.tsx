import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Search,
  Fish,
  BarChart3,
  Calculator,
  Gem,
  ChevronLeft,
  ChevronRight,
  Zap,
  Shield,
} from "lucide-react";

const NAV_ITEMS = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/token-scanner", label: "AI Token Scanner", icon: Search },
  { path: "/whale-watcher", label: "Whale Watcher", icon: Fish },
  { path: "/technical-analysis", label: "Analyse Technique", icon: BarChart3 },
  { path: "/position-sizer", label: "Position Sizer", icon: Calculator },
  { path: "/gem-hunter", label: "Gem Hunter", icon: Gem },
];

export default function Sidebar() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`fixed left-0 top-0 bottom-0 z-50 flex flex-col bg-[#0A0E1A]/95 backdrop-blur-xl border-r border-white/[0.06] transition-all duration-300 ${
        collapsed ? "w-[72px]" : "w-[260px]"
      }`}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 h-16 border-b border-white/[0.06] flex-shrink-0">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 flex-shrink-0">
          <Zap className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <h1 className="text-lg font-extrabold tracking-tight">
              <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                CryptoIA
              </span>
            </h1>
            <p className="text-[10px] text-gray-500 font-semibold -mt-0.5">
              Trading Platform
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {!collapsed && (
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-3 mb-3">
            Navigation
          </p>
        )}
        {NAV_ITEMS.map((item) => {
          const isActive =
            location.pathname === item.path ||
            (item.path !== "/" && location.pathname.startsWith(item.path));
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 relative ${
                isActive
                  ? "bg-gradient-to-r from-indigo-500/15 to-purple-500/10 text-white"
                  : "text-gray-400 hover:text-white hover:bg-white/[0.04]"
              }`}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-gradient-to-b from-indigo-400 to-purple-500 rounded-r-full" />
              )}
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                  isActive
                    ? "bg-indigo-500/20 text-indigo-400"
                    : "bg-white/[0.04] text-gray-500 group-hover:text-gray-300 group-hover:bg-white/[0.06]"
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>
              {!collapsed && (
                <span
                  className={`text-sm font-semibold truncate ${
                    isActive ? "text-white" : ""
                  }`}
                >
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}

        {/* Admin Section Divider */}
        {!collapsed && (
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-3 mb-3 mt-6">
            Administration
          </p>
        )}
        {collapsed && <div className="my-4 border-t border-white/[0.06]" />}

        {/* Admin Link */}
        <Link
          to="/admin"
          className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 relative ${
            location.pathname.startsWith("/admin")
              ? "bg-gradient-to-r from-amber-500/15 to-orange-500/10 text-white"
              : "text-gray-400 hover:text-white hover:bg-white/[0.04]"
          }`}
        >
          {location.pathname.startsWith("/admin") && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-gradient-to-b from-amber-400 to-orange-500 rounded-r-full" />
          )}
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
              location.pathname.startsWith("/admin")
                ? "bg-amber-500/20 text-amber-400"
                : "bg-white/[0.04] text-gray-500 group-hover:text-gray-300 group-hover:bg-white/[0.06]"
            }`}
          >
            <Shield className="w-4 h-4" />
          </div>
          {!collapsed && (
            <span
              className={`text-sm font-semibold truncate ${
                location.pathname.startsWith("/admin") ? "text-white" : ""
              }`}
            >
              Admin Panel
            </span>
          )}
        </Link>
      </nav>

      {/* Collapse Button */}
      <div className="px-3 pb-4">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-gray-400 hover:text-white transition-all text-xs font-semibold"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4" />
              <span>Réduire</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}