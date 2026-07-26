import { Outlet, useNavigate } from "react-router-dom";

import NewTaskNotificationPoller from "../components/NewTaskNotificationPoller.jsx";
import Navbar from "../components/Navbar.jsx";
import NotificationStack from "../components/NotificationStack.jsx";
import { useSession } from "../context/SessionContext.jsx";


export default function AppLayout() {
  const navigate = useNavigate();
  const { authChecked, handleLogout, session } = useSession();

  return (
    <main className="page">
      <Navbar
        onLogout={handleLogout}
        onNavigate={navigate}
        session={session}
      />
      <Outlet />
      {authChecked && session.isAuthenticated && session.role === "employee" && (
        <NewTaskNotificationPoller />
      )}
      <NotificationStack />
    </main>
  );
}
