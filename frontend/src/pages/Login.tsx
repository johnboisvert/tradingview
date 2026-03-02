import Footer from "../components/Footer";
import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Eye, EyeOff, AlertCircle, LogIn, ShieldAlert, ChevronDown, ChevronUp, Trash2, CheckCircle2, XCircle } from "lucide-react";
import { loginUserServer, setUserSession, registerUserSession, removeUserSessionToken } from "@/lib/store";
import { setUserPlan } from "@/lib/subscription";

const APP_VERSION = "v2.1.0 - 2026-02-21";

export function isUserLoggedIn(): boolean {
  return sessionStorage.getItem("cryptoia_user_session") !== null;
}

export function userLogout(): void {
  const session = sessionStorage.getItem("cryptoia_user_session");
  if (session) {
    try {
      const parsed = JSON.parse(session);
      if (parsed.username) {
        removeUserSessionToken(parsed.username);
      }
    } catch { /* ignore */ }
  }
  sessionStorage.removeItem("cryptoia_user_session");
  sessionStorage.removeItem("cryptoia_session_token");
  localStorage.removeItem("cryptoia_user_plan");
}

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const sessionError = (location.state as { sessionError?: string } | null)?.sessionError;
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Diagnostics state
  const [healthStatus, setHealthStatus] = useState<"checking" | "ok" | "error">("checking");
  const [healthTimestamp, setHealthTimestamp] = useState<string>("");
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [diagnosticInfo, setDiagnosticInfo] = useState<{
    serverUrl: string;
    healthOk: boolean;
    userAgent: string;
    timestamp: string;
    errorDetail: string;
  } | null>(null);
  const [cacheCleared, setCacheCleared] = useState(false);

  // Health check on page load
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch("/api/health", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          setHealthStatus("ok");
          setHealthTimestamp(data.timestamp || new Date().toISOString());
        } else {
          setHealthStatus("error");
        }
      } catch {
        setHealthStatus("error");
      }
    };
    checkHealth();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setDiagnosticInfo(null);
    setShowDiagnostics(false);
    setLoading(true);

    try {
      const result = await loginUserServer(username.trim(), password);
      if (result.user) {
        // Register session token for double-connection protection
        registerUserSession(result.user.username);
        setUserSession(result.user.username, result.user.plan);
        setUserPlan(result.user.plan as Parameters<typeof setUserPlan>[0]);
        navigate("/");
      } else if (result.serverError) {
        setError("Serveur inaccessible. Veuillez réessayer dans quelques instants.");
        setDiagnosticInfo({
          serverUrl: window.location.origin,
          healthOk: healthStatus === "ok",
          userAgent: navigator.userAgent.substring(0, 100),
          timestamp: new Date().toISOString(),
          errorDetail: "Server returned non-OK status or was unreachable",
        });
      } else {
        setError("Nom d'utilisateur ou mot de passe incorrect.");
        setDiagnosticInfo({
          serverUrl: window.location.origin,
          healthOk: healthStatus === "ok",
          userAgent: navigator.userAgent.substring(0, 100),
          timestamp: new Date().toISOString(),
          errorDetail: "Server responded OK but credentials did not match",
        });
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Erreur de connexion. Veuillez réessayer.");
      setDiagnosticInfo({
        serverUrl: window.location.origin,
        healthOk: healthStatus === "ok",
        userAgent: navigator.userAgent.substring(0, 100),
        timestamp: new Date().toISOString(),
        errorDetail: String(err),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClearCache = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      setCacheCleared(true);
      setTimeout(() => setCacheCleared(false), 3000);
    } catch (err) {
      console.error("Failed to clear cache:", err);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0E1A] text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <img
              src="/assets/logo1.png"
              alt="CryptoIA"
              className="w-16 h-16 object-contain rounded-2xl"
            />
          </div>
          <h1 className="text-2xl font-extrabold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
            CryptoIA
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Connectez-vous à votre compte membre
          </p>
        </div>

        {/* Session Error Banner */}
        {sessionError && (
          <div className="mb-4 flex items-start gap-3 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <ShieldAlert className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-amber-400">Session expirée</p>
              <p className="text-xs text-gray-400 mt-0.5">{sessionError}</p>
            </div>
          </div>
        )}

        {/* Card */}
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-8 shadow-2xl backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Nom d&apos;utilisateur
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Votre nom d'utilisateur"
                required
                autoFocus
                className="w-full bg-white/[0.06] border border-white/[0.1] rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/60 focus:bg-white/[0.08] transition-all text-sm"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Mot de passe
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Votre mot de passe"
                  required
                  className="w-full bg-white/[0.06] border border-white/[0.1] rounded-xl px-4 py-3 pr-11 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/60 focus:bg-white/[0.08] transition-all text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <p className="text-sm text-red-400">{error}</p>
                </div>

                {/* Expandable Diagnostics */}
                {diagnosticInfo && (
                  <div className="bg-white/[0.03] border border-white/[0.06] rounded-lg overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setShowDiagnostics(!showDiagnostics)}
                      className="w-full flex items-center justify-between px-3 py-2 text-xs text-gray-500 hover:text-gray-400 transition-colors"
                    >
                      <span>Détails techniques</span>
                      {showDiagnostics ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                    {showDiagnostics && (
                      <div className="px-3 pb-3 space-y-1 text-[10px] font-mono text-gray-600 border-t border-white/[0.04]">
                        <p>Server: {diagnosticInfo.serverUrl}</p>
                        <p>Health: {diagnosticInfo.healthOk ? "✅ OK" : "❌ FAIL"}</p>
                        <p>UA: {diagnosticInfo.userAgent}</p>
                        <p>Time: {diagnosticInfo.timestamp}</p>
                        <p>Detail: {diagnosticInfo.errorDetail}</p>
                        <p>Version: {APP_VERSION}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold py-3 rounded-xl transition-all duration-200 shadow-lg shadow-indigo-500/20 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  Se connecter
                </>
              )}
            </button>
          </form>

          {/* Footer links */}
          <div className="mt-6 pt-5 border-t border-white/[0.06] text-center space-y-3">
            <p className="text-xs text-gray-500">
              Pas encore membre ?{" "}
              <Link to="/abonnements" className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">
                Voir les abonnements
              </Link>
            </p>
            <p className="text-xs text-gray-600">
              Problème de connexion ? Contactez le{" "}
              <Link to="/contact" className="text-gray-500 hover:text-gray-400 transition-colors">
                support
              </Link>
            </p>

            {/* Clear Cache Button */}
            <button
              type="button"
              onClick={handleClearCache}
              className="inline-flex items-center gap-1.5 text-[11px] text-gray-600 hover:text-gray-400 transition-colors mt-1"
            >
              <Trash2 className="w-3 h-3" />
              Vider le cache
            </button>
            {cacheCleared && (
              <p className="text-[10px] text-emerald-400 animate-pulse">✓ Cache vidé avec succès. Rechargez la page.</p>
            )}
          </div>

          {/* Health Status Indicator */}
          <div className="mt-4 flex items-center justify-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                healthStatus === "ok"
                  ? "bg-emerald-400"
                  : healthStatus === "error"
                  ? "bg-red-400"
                  : "bg-yellow-400 animate-pulse"
              }`}
            />
            <span className="text-[10px] text-gray-600">
              {healthStatus === "ok"
                ? `Serveur connecté`
                : healthStatus === "error"
                ? "Serveur déconnecté"
                : "Vérification..."}
              {healthTimestamp && healthStatus === "ok" && (
                <span className="ml-1 text-gray-700">({new Date(healthTimestamp).toLocaleTimeString()})</span>
              )}
            </span>
          </div>
        </div>

        {/* Version */}
        <p className="text-center text-[10px] text-gray-700 mt-4">{APP_VERSION}</p>
      </div>
      <Footer />
    </div>
  );
}