import React from "react";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";

// Pages
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Fleet from "./pages/Fleet";
import Drivers from "./pages/Drivers";
import Trips from "./pages/Trips";
import Maintenance from "./pages/Maintenance";
import Expenses from "./pages/Expenses";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";

// Dashboard Layout wrapper
function Layout() {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-dark-bg text-f3f4f6">
      {/* Sidebar navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header bar */}
        <Header />

        {/* Dynamic page container */}
        <main className="flex-1 overflow-y-auto bg-[#0b0e17]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

// Root application component
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Route */}
          <Route path="/login" element={<Login />} />

          {/* Protected Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            {/* Redirect root to dashboard */}
            <Route index element={<Navigate to="/dashboard" replace />} />
            
            {/* Dashboard: All roles */}
            <Route path="dashboard" element={<Dashboard />} />

            {/* Fleet: Fleet Manager (CRUD), Driver (View), Financial Analyst (View). Blocked for Safety Officer. */}
            <Route
              path="fleet"
              element={
                <ProtectedRoute allowedRoles={["FLEET_MANAGER", "DRIVER", "FINANCIAL_ANALYST"]}>
                  <Fleet />
                </ProtectedRoute>
              }
            />

            {/* Drivers: Safety Officer (CRUD), Fleet Manager (View), Driver (View). Blocked for Financial Analyst. */}
            <Route
              path="drivers"
              element={
                <ProtectedRoute allowedRoles={["FLEET_MANAGER", "DRIVER", "SAFETY_OFFICER"]}>
                  <Drivers />
                </ProtectedRoute>
              }
            />

            {/* Trips: Driver (CRUD), Fleet Manager (View), Safety Officer (View). Blocked for Financial Analyst. */}
            <Route
              path="trips"
              element={
                <ProtectedRoute allowedRoles={["FLEET_MANAGER", "DRIVER", "SAFETY_OFFICER"]}>
                  <Trips />
                </ProtectedRoute>
              }
            />

            {/* Maintenance: Fleet Manager (CRUD), Driver (View), Financial Analyst (View). Blocked for Safety Officer. */}
            <Route
              path="maintenance"
              element={
                <ProtectedRoute allowedRoles={["FLEET_MANAGER", "DRIVER", "FINANCIAL_ANALYST"]}>
                  <Maintenance />
                </ProtectedRoute>
              }
            />

            {/* Fuel & Expense: Financial Analyst (CRUD), Fleet Manager (View). Blocked for Driver, Safety Officer. */}
            <Route
              path="expenses"
              element={
                <ProtectedRoute allowedRoles={["FLEET_MANAGER", "FINANCIAL_ANALYST"]}>
                  <Expenses />
                </ProtectedRoute>
              }
            />

            {/* Analytics: All roles */}
            <Route path="analytics" element={<Analytics />} />

            {/* Settings: Fleet Manager only */}
            <Route
              path="settings"
              element={
                <ProtectedRoute allowedRoles={["FLEET_MANAGER"]}>
                  <Settings />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Catch-all Route redirects to /dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
