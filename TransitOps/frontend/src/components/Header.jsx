import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { LogOut, User, Key, X, AlertTriangle } from "lucide-react";
import { useLocation } from "react-router-dom";
import { api } from "../services/api";

export default function Header() {
  const { user, logout } = useAuth();
  const location = useLocation();

  // Password Modal State
  const [isPwModalOpen, setIsPwModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState(false);

  if (!user) return null;

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPwError("");
    setPwSuccess(false);

    if (newPassword !== confirmPassword) {
      setPwError("New password confirmation does not match.");
      return;
    }

    try {
      // Decode user ID from token
      const token = localStorage.getItem("transitops_token");
      let userId = user.id;
      if (token && token.startsWith("mock-jwt-token-for-")) {
        userId = token.split("-")[4];
      }
      await api.changePassword(currentPassword, newPassword);
      setPwSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => {
        setPwSuccess(false);
        setIsPwModalOpen(false);
      }, 2000);
    } catch (err) {
      setPwError(err.message || "Failed to update credentials.");
    }
  };

  // Derive route title
  const getPageTitle = () => {
    const path = location.pathname;
    if (path.startsWith("/dashboard")) return "Dashboard Hub";
    if (path.startsWith("/fleet")) return "Fleet Management";
    if (path.startsWith("/drivers")) return "Drivers Registry";
    if (path.startsWith("/trips")) return "Trips Dispatch Center";
    if (path.startsWith("/maintenance")) return "Maintenance & Repairs";
    if (path.startsWith("/expenses")) return "Fuel & Expenses Log";
    if (path.startsWith("/analytics")) return "Analytics & Reports";
    if (path.startsWith("/settings")) return "System Settings";
    return "TransitOps ERP";
  };

  return (
    <header className="h-20 border-b border-dark-border px-8 flex items-center justify-between bg-dark-bg/60 backdrop-blur-md sticky top-0 z-30">
      <h2 className="text-xl font-bold text-white m-0">{getPageTitle()}</h2>

      <div className="flex items-center gap-4">
        {/* User Card */}
        <div className="flex items-center gap-3 bg-dark-surface/50 border border-dark-border px-4 py-2 rounded-xl">
          <div className="h-8 w-8 rounded-lg bg-brand-primary/10 border border-brand-primary/30 flex items-center justify-center text-brand-primary">
            <User size={16} />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-sm font-semibold text-white leading-tight">{user.name}</span>
            <span className="text-xs text-slate-400 leading-tight">{user.email}</span>
          </div>
        </div>

        {/* Change PW Trigger */}
        <button
          onClick={() => setIsPwModalOpen(true)}
          className="flex items-center justify-center p-2.5 rounded-xl border border-dark-border text-slate-400 hover:text-white bg-dark-surface hover:bg-dark-surface-hover transition-all cursor-pointer shadow-sm active:scale-[0.98]"
          title="Change Password"
        >
          <Key size={16} />
        </button>

        {/* Logout Button */}
        <button
          onClick={logout}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-dark-border hover:border-red-500/30 text-slate-400 hover:text-brand-danger bg-dark-surface hover:bg-red-500/5 font-semibold text-sm transition-all cursor-pointer shadow-sm active:scale-[0.98]"
        >
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Change Password Modal */}
      {isPwModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm glass-panel rounded-2xl shadow-2xl overflow-hidden border border-dark-border">
            <div className="absolute top-0 left-0 w-full h-[3px] bg-brand-primary"></div>
            
            <div className="flex items-center justify-between px-6 py-4 border-b border-dark-border bg-dark-surface/40">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Key size={16} className="text-brand-primary" />
                <span>Update Credentials</span>
              </h3>
              <button
                onClick={() => setIsPwModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white hover:bg-dark-surface rounded-lg transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handlePasswordChange} className="p-6 space-y-4 text-xs">
              {pwSuccess && (
                <div className="p-3 mb-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-brand-success font-semibold">
                  Password updated successfully.
                </div>
              )}

              {pwError && (
                <div className="flex items-center gap-2 p-3 mb-2 rounded-lg bg-red-500/10 border border-red-500/20 text-brand-danger">
                  <AlertTriangle size={14} className="shrink-0" />
                  <span>{pwError}</span>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-400 mb-1.5 uppercase">Current Password</label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full form-input-custom px-3 py-2 text-sm rounded-lg text-white"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-400 mb-1.5 uppercase">New Password</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full form-input-custom px-3 py-2 text-sm rounded-lg text-white"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-400 mb-1.5 uppercase">Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full form-input-custom px-3 py-2 text-sm rounded-lg text-white"
                  placeholder="••••••••"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-dark-border mt-4">
                <button
                  type="button"
                  onClick={() => setIsPwModalOpen(false)}
                  className="px-3.5 py-1.5 border border-dark-border text-slate-300 hover:bg-dark-surface rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-brand-primary hover:bg-brand-primary-light text-white rounded-lg font-semibold"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
}
