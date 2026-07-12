import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Truck, LogIn, AlertCircle } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (roleEmail) => {
    setEmail(roleEmail);
    setPassword("password123");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-dark-bg p-4 select-none">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-900/10 via-dark-bg to-dark-bg pointer-events-none"></div>

      <div className="w-full max-w-md z-10">
        {/* Logo Branding */}
        <div className="flex flex-col items-center mb-8">
          <div className="p-4 bg-brand-primary/10 border border-brand-primary/30 rounded-2xl mb-3 shadow-inner shadow-brand-primary/10">
            <Truck size={40} className="text-brand-primary" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white m-0">
            Transit<span className="text-brand-primary">Ops</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">Enterprise Fleet & Dispatch ERP</p>
        </div>

        {/* Login Glass Card */}
        <div className="glass-panel p-8 rounded-2xl shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-brand-primary to-brand-secondary"></div>
          
          <h2 className="text-2xl font-bold text-white mb-6">Sign In</h2>
          
          {error && (
            <div className="flex items-center gap-3 p-3.5 mb-5 rounded-lg bg-red-500/10 border border-red-500/20 text-brand-danger text-sm">
              <AlertCircle size={18} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-slate-300 text-sm font-semibold mb-2" htmlFor="email">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full form-input-custom px-4 py-3 rounded-lg text-white text-sm"
                placeholder="name@transitops.com"
              />
            </div>

            <div>
              <label className="block text-slate-300 text-sm font-semibold mb-2" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full form-input-custom px-4 py-3 rounded-lg text-white text-sm"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-brand-primary text-white font-semibold text-sm hover:bg-brand-primary-light active:scale-[0.99] transition-all cursor-pointer shadow-lg shadow-brand-primary/20 disabled:opacity-50"
            >
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              ) : (
                <>
                  <LogIn size={18} />
                  <span>Authenticate Session</span>
                </>
              )}
            </button>
          </form>

          {/* Quick-fill Helper Roles for testing */}
          <div className="mt-8 border-t border-dark-border pt-6">
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">
              Developer Quick-Fill Roles
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => fillCredentials("fleet_manager@transitops.com")}
                className="px-3 py-2 rounded bg-dark-surface hover:bg-dark-surface-hover text-left border border-dark-border text-slate-300 transition-colors cursor-pointer truncate"
              >
                💼 Fleet Manager
              </button>
              <button
                onClick={() => fillCredentials("dispatcher@transitops.com")}
                className="px-3 py-2 rounded bg-dark-surface hover:bg-dark-surface-hover text-left border border-dark-border text-slate-300 transition-colors cursor-pointer truncate"
              >
                📡 Dispatcher
              </button>
              <button
                onClick={() => fillCredentials("safety_officer@transitops.com")}
                className="px-3 py-2 rounded bg-dark-surface hover:bg-dark-surface-hover text-left border border-dark-border text-slate-300 transition-colors cursor-pointer truncate"
              >
                🛡️ Safety Officer
              </button>
              <button
                onClick={() => fillCredentials("financial_analyst@transitops.com")}
                className="px-3 py-2 rounded bg-dark-surface hover:bg-dark-surface-hover text-left border border-dark-border text-slate-300 transition-colors cursor-pointer truncate"
              >
                📊 Financial Analyst
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
