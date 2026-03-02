import { Navigate } from "react-router-dom";
import { isAdminAuthenticated } from "@/pages/AdminLogin";

export default function ProtectedAdminRoute({ children }: { children: React.ReactNode }) {
  if (!isAdminAuthenticated()) {
    return <Navigate to="/admin/login" replace />;
  }
  return <>{children}</>;
}