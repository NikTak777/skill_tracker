import { Link, Outlet } from "react-router-dom";


export default function AuthLayout() {
  return (
    <main className="page auth-page">
      <header className="auth-header">
        <Link className="auth-brand" to="/login">
          <strong>SkillTracker</strong>
          <span>Планы развития</span>
        </Link>
      </header>

      <Outlet />
    </main>
  );
}
