import { Link, Outlet } from "react-router-dom";

import ThemeToggle from "../components/ThemeToggle.jsx";


export default function AuthLayout() {
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
