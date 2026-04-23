import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { isAdminSessionActive, verifyAdminSession } from "@/lib/store";
import { Loader2 } from "lucide-react";

export default function ProtectedAdminRoute({ children }: { children: React.ReactNode }) {
  const [checking, setChecking] = useState(true);
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function verify() {
      // Quick sync check first — if no token at all, redirect immediately
      if (!isAdminSessionActive()) {
        if (!cancelled) {
          setIsValid(false);
          setChecking(false);
        }
        return;
      }

      // Verify token with server
      try {
        const result = await verifyAdminSession();
        if (!cancelled) {
          setIsValid(result.valid);
          setChecking(false);
        }
      } catch {
        if (!cancelled) {
          // On network error, allow access if we have a cached session
          setIsValid(isAdminSessionActive());
          setChecking(false);
        }
      }
    }

    verify();
    return () => { cancelled = true; };
  }, []);

  if (checking) {
    return (
      <div className="min-h-screen bg-[#0A0E1A] text-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-400 mx-auto mb-4" />
          <p className="text-sm text-gray-400">Vérification de la session...</p>
        </div>
      </div>
    );
  }

  if (!isValid) {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
}