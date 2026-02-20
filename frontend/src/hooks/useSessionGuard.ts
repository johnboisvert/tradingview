import { useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getUserSession, validateUserSession } from "@/lib/store";

/**
 * Hook that periodically validates the user session.
 * If the session is invalidated (e.g., another device logged in),
 * it redirects to login with an error message.
 */
export function useSessionGuard(intervalMs = 15000) {
  const navigate = useNavigate();

  const checkSession = useCallback(() => {
    const session = getUserSession();
    if (!session) return; // Not logged in, nothing to check

    const result = validateUserSession(session.username);
    if (!result.valid) {
      // Force redirect to login with message
      navigate("/login", {
        state: { sessionError: result.message },
        replace: true,
      });
    }
  }, [navigate]);

  useEffect(() => {
    // Check immediately
    checkSession();

    // Then check periodically
    const timer = setInterval(checkSession, intervalMs);
    return () => clearInterval(timer);
  }, [checkSession, intervalMs]);
}