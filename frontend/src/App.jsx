import { Navigate, Route, Routes } from "react-router-dom";

import { GuestRoute, PrivateRoute } from "./components/RouteGuards.jsx";
import { NotificationProvider } from "./context/NotificationContext.jsx";
import { SessionProvider } from "./context/SessionContext.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import AppLayout from "./layouts/AppLayout.jsx";
import AuthLayout from "./layouts/AuthLayout.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Login from "./pages/Login.jsx";
import "./styles.css";

export default function App() {
  return (
    <ThemeProvider>
      <SessionProvider>
        <NotificationProvider>
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
            <Route path="/register" element={<Navigate to="/login" replace />} />
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
            <Route path="/employee" element={<Navigate to="/dashboard" replace />} />
            <Route path="/manager" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
        </NotificationProvider>
      </SessionProvider>
    </ThemeProvider>
  );
}
