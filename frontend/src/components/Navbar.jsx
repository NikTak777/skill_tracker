import { Link, useNavigate } from "react-router-dom";

import { clearTokens } from "../api.js";
import { useSession } from "../context/SessionContext.jsx";


const ROLE_LABELS = {
  manager: "Руководитель",
  employee: "Сотрудник",
};

const navItems = [
  { path: "/dashboard", label: "Панель работника", authOnly: true },
];

export default function Navbar({ activePath, onNavigate, session, onLogout }) {
  const navigate = useNavigate();

  const visibleNavItems = navItems.filter((item) => {
    if (item.authOnly && !session.isAuthenticated) {
      return false;
    }

    return true;
  });

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
        <span>Планы развития</span>
      </Link>

      <div className="nav-actions">
        {visibleNavItems.map((item) => (
          <button
            className={activePath === item.path ? "active" : ""}
            key={item.path}
            type="button"
            onClick={() => onNavigate(item.path)}
          >
            {item.label}
          </button>
        ))}
      </div>

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
    </nav>
  );
}
