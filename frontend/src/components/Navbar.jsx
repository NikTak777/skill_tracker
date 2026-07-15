import { Link, useNavigate } from "react-router-dom";

import { clearTokens } from "../api.js";
import { useSession } from "../context/SessionContext.jsx";
import ThemeToggle from "./ThemeToggle.jsx";


const ROLE_LABELS = {
  manager: "Руководитель",
  employee: "Сотрудник",
};

export default function Navbar({ onNavigate, session, onLogout }) {
  const navigate = useNavigate();

  function handleLogout() {
    clearTokens();
    localStorage.removeItem("skilltracker_user_role");
    localStorage.removeItem("skilltracker_username");
    onLogout();
    onNavigate("/login");
  }

  return (
    <nav className="top-nav" aria-label="Разделы приложения">
      <Link className="brand auth-brand" to={session.isAuthenticated ? "/dashboard" : "/login"}>
        <strong>SkillTracker</strong>
      </Link>

      <div className="top-nav__actions">
        <ThemeToggle />

        <div className={`session-badge ${session.isAuthenticated ? "active" : ""}`}>
          <div>
            <strong>{session.isAuthenticated ? session.username || "В системе" : "Не в системе"}</strong>
            <span>{session.isAuthenticated ? ROLE_LABELS[session.role] || session.role : "Гость"}</span>
          </div>
          {session.isAuthenticated ? (
            <button className="logout-button" type="button" onClick={handleLogout}>
              Выйти
            </button>
          ) : (
            <button className="logout-button" type="button" onClick={() => navigate("/login")}>
              Войти
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
