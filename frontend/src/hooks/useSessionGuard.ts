import { useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getUserSession, validateUserSession } from "@/lib/store";

/**
 * Hook that periodically validates the user session.
 * If the session is invalidated (e.g., another tab logged in with same account),
 * it redirects to login with an error message.
 *
 * IMPORTANT: This only checks for logged-in users. Non-logged-in visitors
 * are never affected. Since localStorage is per-browser, this protection
 * works for same-browser multi-tab scenarios. Cross-browser/cross-device
 * protection requires a shared backend (Supabase).
 */
export function useSessionGuard(intervalMs = 30000) {
  const navigate = useNavigate();
  const hasCheckedRef = useRef(false);

  const checkSession = useCallback(() => {
    const session = getUserSession();
    // Only check if user is actually logged in
    if (!session || !session.username) return;

    // Only validate if we have a session token stored
    const token = sessionStorage.getItem("cryptoia_session_token");
    if (!token) return;

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
    // Skip the immediate check on first mount to avoid blocking page load
    // Only do periodic checks after the first render
    if (!hasCheckedRef.current) {
      hasCheckedRef.current = true;
      // Delay first check by 2 seconds to let the page load
      const initialTimer = setTimeout(checkSession, 2000);
      const timer = setInterval(checkSession, intervalMs);
      return () => {
        clearTimeout(initialTimer);
        clearInterval(timer);
      };
    }

    const timer = setInterval(checkSession, intervalMs);
    return () => clearInterval(timer);
  }, [checkSession, intervalMs]);
}