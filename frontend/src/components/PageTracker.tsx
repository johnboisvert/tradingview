import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { trackPageVisit } from "@/lib/store";

/**
 * Invisible component that tracks page visits.
 * Place inside <Router> to track all route changes.
 */
export default function PageTracker() {
  const location = useLocation();

  useEffect(() => {
    // Track the page visit
    trackPageVisit(location.pathname);
  }, [location.pathname]);

  return null;
}