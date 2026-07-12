import { Link, Outlet, useLocation } from "react-router-dom";


export default function AuthLayout() {
  const location = useLocation();
  const isLogin = location.pathname === "/login";

  return (
    <main className="page auth-page">
      <header className="auth-header">
        <Link className="auth-brand" to="/login">
          <strong>SkillTracker</strong>
          <span>Планы развития</span>
        </Link>

        <div className="auth-header__links">
          <Link className={isLogin ? "active" : ""} to="/login">
            Вход
          </Link>
          <Link className={!isLogin ? "active" : ""} to="/register">
            Регистрация
          </Link>
        </div>
      </header>

      <Outlet />
    </main>
  );
}
