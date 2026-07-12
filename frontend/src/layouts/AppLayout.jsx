import { Outlet, useLocation, useNavigate } from "react-router-dom";

import Navbar from "../components/Navbar.jsx";
import { useSession } from "../context/SessionContext.jsx";


export default function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { handleLogout, session } = useSession();

  return (
    <main className="page">
      <Navbar
        activePath={location.pathname}
        onLogout={handleLogout}
        onNavigate={navigate}
        session={session}
      />
      <Outlet />
    </main>
  );
}
