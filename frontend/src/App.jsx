import { Navigate, Route, Routes } from "react-router-dom";

import { GuestRoute, PrivateRoute } from "./components/RouteGuards.jsx";
import { SessionProvider } from "./context/SessionContext.jsx";
import AppLayout from "./layouts/AppLayout.jsx";
import AuthLayout from "./layouts/AuthLayout.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import EmployeeTasks from "./pages/EmployeeTasks.jsx";
import Login from "./pages/Login.jsx";
import ManagerPanel from "./pages/ManagerPanel.jsx";
import Register from "./pages/Register.jsx";
import "./styles.css";


export default function App() {
  return (
    <SessionProvider>
      <Routes>
        <Route element={<AuthLayout />}>
          <Route
            path="/login"
            element={(
              <GuestRoute>
                <Login />
              </GuestRoute>
            )}
          />
          <Route
            path="/register"
            element={(
              <GuestRoute>
                <Register />
              </GuestRoute>
            )}
          />
        </Route>

        <Route element={<AppLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route
            path="/dashboard"
            element={(
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            )}
          />
          <Route
            path="/employee"
            element={(
              <PrivateRoute role="employee">
                <EmployeeTasks />
              </PrivateRoute>
            )}
          />
          <Route
            path="/manager"
            element={(
              <PrivateRoute role="manager">
                <ManagerPanel />
              </PrivateRoute>
            )}
          />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </SessionProvider>
  );
}
