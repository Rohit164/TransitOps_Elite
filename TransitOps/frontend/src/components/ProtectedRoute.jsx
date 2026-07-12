import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ShieldAlert } from "lucide-react";

export const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-dark-bg text-f3f4f6">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-brand-primary border-t-transparent"></div>
          <p className="text-lg font-medium text-slate-400">Loading TransitOps ERP session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login but save the current location
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Access denied layout (premium styling)
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
        <div className="glass-panel max-w-md p-8 rounded-2xl text-center shadow-xl border-red-500/30 flex flex-col items-center">
          <div className="p-4 bg-red-500/10 text-brand-danger rounded-full mb-6">
            <ShieldAlert size={48} className="animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold text-f3f4f6 mb-2">Access Denied</h2>
          <p className="text-slate-400 text-sm mb-6 leading-relaxed">
            Your current role (<span className="text-brand-danger font-semibold">{user.role.replace("_", " ")}</span>) does not have permission to view or manage this section of the ERP.
          </p>
          <a
            href="/dashboard"
            className="px-6 py-2.5 rounded-lg bg-dark-border text-f3f4f6 hover:bg-dark-border-highlight font-medium transition-all text-sm shadow-sm"
          >
            Back to Dashboard
          </a>
        </div>
      </div>
    );
  }

  return children;
};
