import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { ShieldCheck, Plus, UserPlus, Key, AlertTriangle, Eye, Info } from "lucide-react";

export default function Settings() {
  const { user } = useAuth();
  
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Create User Form State
  const [createUserFields, setCreateUserFields] = useState({
    name: "",
    email: "",
    password: "",
    role: "DRIVER"
  });
  const [createError, setCreateError] = useState("");
  const [createSuccess, setCreateSuccess] = useState(false);

  // Change Password Form State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api.getUsers();
      setUsers(data);
    } catch (err) {
      setError(err.message || "Failed to load user list");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setCreateError("");
    setCreateSuccess(false);

    try {
      await api.createUser(createUserFields);
      setCreateSuccess(true);
      setCreateUserFields({
        name: "",
        email: "",
        password: "",
        role: "DRIVER"
      });
      loadUsers();
      setTimeout(() => setCreateSuccess(false), 3000);
    } catch (err) {
      setCreateError(err.message || "Failed to create user account");
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    setError("");
    try {
      await api.updateUserRole(userId, newRole);
      loadUsers();
    } catch (err) {
      setError(err.message || "Failed to update user access level");
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPwError("");
    setPwSuccess(false);

    if (newPassword !== confirmPassword) {
      setPwError("New password confirmation does not match.");
      return;
    }

    try {
      await api.changePassword(currentPassword, newPassword);
      setPwSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPwSuccess(false), 3000);
    } catch (err) {
      setPwError(err.message || "Failed to update credentials.");
    }
  };

  return (
    <div className="p-8 space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight m-0">System Settings</h1>
        <p className="text-slate-400 text-sm mt-1">Configure user accounts, control access policies, and manage security credentials.</p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-brand-danger text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left/Middle: User Directory (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel rounded-2xl border border-dark-border shadow-lg overflow-hidden">
            <div className="p-6 border-b border-dark-border bg-dark-surface/30">
              <h3 className="text-md font-bold text-white m-0 flex items-center gap-2">
                <ShieldCheck size={18} className="text-brand-primary" />
                <span>Operator Scope Controls</span>
              </h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-dark-border bg-dark-bg/20 text-slate-400 text-xs font-bold uppercase tracking-wider">
                    <th className="py-4 px-6">Name</th>
                    <th className="py-4 px-6">Email / Account ID</th>
                    <th className="py-4 px-6">Assigned Role</th>
                    <th className="py-4 px-6 text-right">Role override</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-border/40 text-sm">
                  {loading ? (
                    <tr>
                      <td colSpan="4" className="py-8 text-center text-slate-400">
                        Querying personnel registry...
                      </td>
                    </tr>
                  ) : (
                    users.map((u) => (
                      <tr key={u.id} className="hover:bg-dark-surface/30 transition-colors">
                        <td className="py-4 px-6 font-semibold text-white">
                          {u.name}
                        </td>
                        <td className="py-4 px-6 text-slate-300">
                          {u.email}
                        </td>
                        <td className="py-4 px-6">
                          <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-brand-primary/10 text-brand-primary-light border border-brand-primary/20">
                            {u.role.replace("_", " ")}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <select
                            value={u.role}
                            onChange={(e) => handleRoleChange(u.id, e.target.value)}
                            className="px-3 py-1.5 text-xs rounded-lg form-input-custom text-white bg-dark-bg cursor-pointer"
                          >
                            <option value="FLEET_MANAGER">Fleet Manager</option>
                            <option value="DISPATCHER">Dispatcher</option>
                            <option value="SAFETY_OFFICER">Safety Officer</option>
                            <option value="FINANCIAL_ANALYST">Financial Analyst</option>
                          </select>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* User registration form (Fleet Manager only) */}
          <div className="glass-panel rounded-2xl border border-dark-border shadow-lg p-6">
            <h3 className="text-md font-bold text-white mb-5 flex items-center gap-2 border-b border-dark-border pb-4">
              <UserPlus size={18} className="text-brand-primary" />
              <span>Create New User Profile</span>
            </h3>

            {createSuccess && (
              <div className="p-3.5 mb-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-brand-success text-xs font-semibold">
                User registered and added to directory.
              </div>
            )}

            {createError && (
              <div className="flex items-center gap-2 p-3.5 mb-4 rounded-lg bg-red-500/10 border border-red-500/20 text-brand-danger text-xs">
                <AlertTriangle size={16} className="shrink-0" />
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-400 mb-1.5 uppercase">Full Name</label>
                <input
                  type="text"
                  required
                  value={createUserFields.name}
                  onChange={(e) => setCreateUserFields({ ...createUserFields, name: e.target.value })}
                  className="w-full form-input-custom px-3 py-2 text-sm rounded-lg text-white"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-400 mb-1.5 uppercase">Email Address</label>
                <input
                  type="email"
                  required
                  value={createUserFields.email}
                  onChange={(e) => setCreateUserFields({ ...createUserFields, email: e.target.value })}
                  className="w-full form-input-custom px-3 py-2 text-sm rounded-lg text-white"
                  placeholder="johndoe@transitops.com"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-400 mb-1.5 uppercase">Default Password</label>
                <input
                  type="password"
                  required
                  value={createUserFields.password}
                  onChange={(e) => setCreateUserFields({ ...createUserFields, password: e.target.value })}
                  className="w-full form-input-custom px-3 py-2 text-sm rounded-lg text-white"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-400 mb-1.5 uppercase">Select Access Role</label>
                <select
                  value={createUserFields.role}
                  onChange={(e) => setCreateUserFields({ ...createUserFields, role: e.target.value })}
                  className="w-full form-input-custom px-3 py-2.5 text-sm rounded-lg text-white bg-dark-bg cursor-pointer"
                >
                  <option value="FLEET_MANAGER">Fleet Manager</option>
                  <option value="DISPATCHER">Dispatcher</option>
                  <option value="SAFETY_OFFICER">Safety Officer</option>
                  <option value="FINANCIAL_ANALYST">Financial Analyst</option>
                </select>
              </div>

              <div className="md:col-span-2 pt-2 flex justify-end">
                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2.5 bg-brand-primary hover:bg-brand-primary-light text-white rounded-xl font-semibold text-xs transition-all cursor-pointer shadow-lg shadow-brand-primary/20"
                >
                  <Plus size={14} />
                  <span>Register Account</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Side: Change Password Form (Accessible to all who visit Settings, and we mirror this in Header) */}
        <div>
          <div className="glass-panel rounded-2xl border border-dark-border shadow-lg p-6 sticky top-24">
            <h3 className="text-md font-bold text-white mb-5 flex items-center gap-2 border-b border-dark-border pb-4">
              <Key size={18} className="text-brand-primary" />
              <span>Update Credentials</span>
            </h3>

            {pwSuccess && (
              <div className="p-3.5 mb-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-brand-success text-xs font-semibold">
                Password updated successfully.
              </div>
            )}

            {pwError && (
              <div className="flex items-center gap-2 p-3.5 mb-4 rounded-lg bg-red-500/10 border border-red-500/20 text-brand-danger text-xs">
                <AlertTriangle size={16} className="shrink-0" />
                <span>{pwError}</span>
              </div>
            )}

            <form onSubmit={handlePasswordChange} className="space-y-4 text-xs">
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

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 py-3 mt-4 rounded-lg bg-brand-primary text-white font-semibold text-xs hover:bg-brand-primary-light active:scale-[0.99] transition-all cursor-pointer shadow-lg shadow-brand-primary/20"
              >
                <span>Save Password</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
