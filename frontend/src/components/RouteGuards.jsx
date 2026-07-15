import { Navigate } from "react-router-dom";

import { useSession } from "../context/SessionContext.jsx";
import LoadingSpinner from "./LoadingSpinner.jsx";


export function PrivateRoute({ children, role }) {
  const { authChecked, session } = useSession();

  if (!authChecked) {
    return <LoadingSpinner label="Проверяем авторизацию..." />;
  }

  if (!session.isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (role && session.role !== role) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export function GuestRoute({ children }) {
  const { authChecked, session } = useSession();

  if (!authChecked) {
    return <LoadingSpinner label="Проверяем авторизацию..." />;
  }

  if (session.isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
