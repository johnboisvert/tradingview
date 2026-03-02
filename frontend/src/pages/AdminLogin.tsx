import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Shield,
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertCircle,
  User,
  CheckCircle,
} from "lucide-react";
import {
  loginAdmin,
  clearAdminSession,
  isAdminSessionActive,
  isSuperAdminConfigured,
  initSuperAdmin,
} from "@/lib/store";

export function isAdminAuthenticated(): boolean {
  return isAdminSessionActive();
}

export function adminLogout(): void {
  clearAdminSession();
}

export default function AdminLogin() {
  const navigate = useNavigate();

  const [isSetupMode] = useState(() => !isSuperAdminConfigured());

  // Login state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState(0);

  // Setup state
  const [setupName, setSetupName] = useState("");
  const [setupEmail, setSetupEmail] = useState("");
  const [setupPassword, setSetupPassword] = useState("");
  const [setupConfirmPassword, setSetupConfirmPassword] = useState("");
  const [showSetupPassword, setShowSetupPassword] = useState(false);
  const [setupError, setSetupError] = useState("");
  const [setupSuccess, setSetupSuccess] = useState("");
  const [setupLoading, setSetupLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Brute force protection: lockout after 5 failed attempts
    if (Date.now() < lockoutUntil) {
      const secondsLeft = Math.ceil((lockoutUntil - Date.now()) / 1000);
      setError(`Trop de tentatives. Réessayez dans ${secondsLeft} secondes.`);
      return;
    }

    setLoading(true);

    try {
      const result = await loginAdmin(email, password);
      if (result.success) {
        setFailedAttempts(0);
        navigate("/admin");
      } else {
        const newAttempts = failedAttempts + 1;
        setFailedAttempts(newAttempts);
        if (newAttempts >= 5) {
          // Lock out for 60 seconds after 5 failed attempts
          setLockoutUntil(Date.now() + 60_000);
          setError("Trop de tentatives. Compte verrouillé pendant 60 secondes.");
        } else {
          setError(`Email ou mot de passe incorrect. (${newAttempts}/5 tentatives)`);
        }
      }
    } catch {
      setError("Erreur lors de la connexion.");
    } finally {
      setLoading(false);
    }
  };

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSetupError("");
    setSetupSuccess("");

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(setupEmail)) {
      setSetupError("Veuillez entrer une adresse email valide.");
      return;
    }

    // Validate name
    if (!setupName.trim()) {
      setSetupError("Veuillez entrer votre nom.");
      return;
    }

    // Validate password length
    if (setupPassword.length < 6) {
      setSetupError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }

    // Validate passwords match
    if (setupPassword !== setupConfirmPassword) {
      setSetupError("Les mots de passe ne correspondent pas.");
      return;
    }

    setSetupLoading(true);

    try {
      const result = await initSuperAdmin(setupEmail, setupName, setupPassword);
      if (result.success) {
        setSetupSuccess("Super-admin créé avec succès ! Connexion en cours...");
        // Auto-login after setup
        setTimeout(async () => {
          const loginResult = await loginAdmin(setupEmail, setupPassword);
          if (loginResult.success) {
            navigate("/admin");
          } else {
            setSetupError("Compte créé mais erreur lors de la connexion automatique. Veuillez vous connecter manuellement.");
            // Force page reload to switch to login mode
            window.location.reload();
          }
        }, 1500);
      } else {
        setSetupError(result.message);
      }
    } catch {
      setSetupError("Erreur lors de la création du compte.");
    } finally {
      setSetupLoading(false);
    }
  };

  if (isSetupMode) {
    return (
      <div className="min-h-screen bg-[#0A0E1A] text-white flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/20">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-extrabold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
              Configuration Super Admin
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              Créez votre compte super-administrateur pour démarrer
            </p>
          </div>

          {/* Setup Form */}
          <form
            onSubmit={handleSetup}
            className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 space-y-5"
          >
            {setupError && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{setupError}</span>
              </div>
            )}

            {setupSuccess && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                <span>{setupSuccess}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Nom
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  value={setupName}
                  onChange={(e) => setSetupName(e.target.value)}
                  placeholder="Super Admin"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="email"
                  value={setupEmail}
                  onChange={(e) => setSetupEmail(e.target.value)}
                  placeholder="admin@cryptoia.com"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type={showSetupPassword ? "text" : "password"}
                  value={setupPassword}
                  onChange={(e) => setSetupPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full pl-10 pr-12 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowSetupPassword(!showSetupPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showSetupPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Confirmer le mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type={showSetupPassword ? "text" : "password"}
                  value={setupConfirmPassword}
                  onChange={(e) => setSetupConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full pl-10 pr-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={setupLoading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-sm hover:from-emerald-600 hover:to-teal-700 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {setupLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Shield className="w-4 h-4" />
                  Créer le Super Admin
                </>
              )}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => navigate("/")}
                className="text-xs text-gray-500 hover:text-emerald-400 transition-colors"
              >
                ← Retour au site
              </button>
            </div>
          </form>

          <p className="text-center text-[10px] text-gray-600 mt-6">
            Cette configuration n&apos;est nécessaire qu&apos;une seule fois
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0E1A] text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/20">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
            CryptoIA Admin
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Connectez-vous pour accéder au panneau d&apos;administration
          </p>
        </div>

        {/* Login Form */}
        <form
          onSubmit={handleLogin}
          className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 space-y-5"
        >
          {error && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@cryptoia.com"
                required
                className="w-full pl-10 pr-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Mot de passe
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full pl-10 pr-12 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold text-sm hover:from-indigo-600 hover:to-purple-700 transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Lock className="w-4 h-4" />
                Se connecter
              </>
            )}
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="text-xs text-gray-500 hover:text-indigo-400 transition-colors"
            >
              ← Retour au site
            </button>
          </div>

          {failedAttempts >= 3 && (
            <div className="pt-2 border-t border-white/[0.06]">
              <p className="text-center text-[11px] text-red-400/60 py-1">
                Trop de tentatives échouées. Veuillez contacter le super-administrateur.
              </p>
            </div>
          )}
        </form>

        <p className="text-center text-[10px] text-gray-600 mt-6">
          Accès réservé aux administrateurs de CryptoIA
        </p>
      </div>
    </div>
  );
}