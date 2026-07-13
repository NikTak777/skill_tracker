import { Link, Outlet, useLocation } from "react-router-dom";

import ThemeToggle from "../components/ThemeToggle.jsx";


export default function AuthLayout() {
  const location = useLocation();
  const isLogin = location.pathname === "/login";

  return (
    <main className="page auth-page">
      <header className="auth-header">
        <Link className="auth-brand" to="/login">
          <strong>SkillTracker</strong>
        </Link>
        <ThemeToggle />
      </header>

      <Outlet />
    </main>
  );
}
