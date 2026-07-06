import { clearTokens } from "../api.js";


const ROLE_LABELS = {
  manager: "Руководитель",
  employee: "Сотрудник",
};

const navItems = [
  { id: "showcase", label: "Dashboard" },
  { id: "auth", label: "Вход" },
  { id: "employee", label: "Сотрудник" },
  { id: "manager", label: "Руководитель" },
];

export default function Navbar({ activePage, onNavigate, session, onLogout }) {
  function handleLogout() {
    clearTokens();
    localStorage.removeItem("skilltracker_user_role");
    localStorage.removeItem("skilltracker_username");
    onLogout();
    onNavigate("auth");
  }

  return (
    <nav className="top-nav" aria-label="Разделы приложения">
      <div className="brand">
        <strong>SkillTracker</strong>
        <span>Планы развития</span>
      </div>

      <div className="nav-actions">
        {navItems.map((item) => (
          <button
            className={activePage === item.id ? "active" : ""}
            key={item.id}
            type="button"
            onClick={() => onNavigate(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className={`session-badge ${session.isAuthenticated ? "active" : ""}`}>
        <span className="session-icon" aria-hidden="true">
          {session.isAuthenticated ? "✓" : "?"}
        </span>
        <div>
          <strong>{session.isAuthenticated ? session.username || "В системе" : "Не в системе"}</strong>
          <span>{session.isAuthenticated ? ROLE_LABELS[session.role] || session.role : "Гость"}</span>
        </div>
        {session.isAuthenticated && (
          <button className="logout-button" type="button" onClick={handleLogout}>
            Выйти
          </button>
        )}
      </div>
    </nav>
  );
}
