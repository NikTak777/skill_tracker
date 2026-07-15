import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { getAccessToken, getMe } from "../api.js";


const SessionContext = createContext(null);

function normalizeRole(role) {
  return String(role || "").toLowerCase();
}

export function SessionProvider({ children }) {
  const navigate = useNavigate();
  const [authChecked, setAuthChecked] = useState(false);
  const [session, setSession] = useState(() => ({
    isAuthenticated: Boolean(getAccessToken()),
    role: localStorage.getItem("skilltracker_user_role") || "",
    username: localStorage.getItem("skilltracker_username") || "",
  }));

  useEffect(() => {
    async function loadCurrentUser() {
      const token = getAccessToken();

      if (!token) {
        setSession({
          isAuthenticated: false,
          role: "",
          username: "",
        });
        setAuthChecked(true);
        return;
      }

      try {
        const profile = await getMe();
        const role = normalizeRole(profile.role);
        const username = profile.username || "";

        localStorage.setItem("skilltracker_user_role", role);
        localStorage.setItem("skilltracker_username", username);
        setSession({
          isAuthenticated: true,
          role,
          username,
        });
      } catch {
        localStorage.removeItem("skilltracker_user_role");
        localStorage.removeItem("skilltracker_username");
        setSession({
          isAuthenticated: false,
          role: "",
          username: "",
        });
      } finally {
        setAuthChecked(true);
      }
    }

    loadCurrentUser();
  }, []);

  useEffect(() => {
    function handleUnauthorized() {
      setSession({
        isAuthenticated: false,
        role: "",
        username: "",
      });
      localStorage.removeItem("skilltracker_user_role");
      localStorage.removeItem("skilltracker_username");
      navigate("/login", { replace: true });
    }

    window.addEventListener("auth:unauthorized", handleUnauthorized);
    return () => window.removeEventListener("auth:unauthorized", handleUnauthorized);
  }, [navigate]);

  function handleAuthSuccess({ role, username }) {
    const normalizedRole = normalizeRole(role);

    localStorage.setItem("skilltracker_user_role", normalizedRole);
    localStorage.setItem("skilltracker_username", username);
    setSession({
      isAuthenticated: true,
      role: normalizedRole,
      username,
    });
    setAuthChecked(true);
    navigate("/dashboard", { replace: true });
  }

  function handleLogout() {
    setSession({
      isAuthenticated: false,
      role: "",
      username: "",
    });
    navigate("/login", { replace: true });
  }

  const value = useMemo(
    () => ({
      authChecked,
      handleAuthSuccess,
      handleLogout,
      session,
    }),
    [authChecked, session],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const context = useContext(SessionContext);

  if (!context) {
    throw new Error("useSession must be used within SessionProvider");
  }

  return context;
}
