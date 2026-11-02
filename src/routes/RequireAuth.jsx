import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import AppLayout from "../components/layout/AppLayout.jsx";

/** Layout route: signed-out visitors go to /login, then back to where they were headed. */
export default function RequireAuth() {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  return <AppLayout />;
}
