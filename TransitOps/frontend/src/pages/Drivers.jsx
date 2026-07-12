import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { Plus, Edit2, Search, X, AlertTriangle, UserCheck, ShieldAlert } from "lucide-react";

export default function Drivers() {
  const { user } = useAuth();
  const isSafetyOfficer = user?.role === "SAFETY_OFFICER";

  const [drivers, setDrivers] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("ADD"); // ADD or EDIT
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [modalError, setModalError] = useState("");

  // Form Fields
  const [formFields, setFormFields] = useState({
    name: "",
    licenseNumber: "",
    licenseCategory: "Class A",
    licenseExpiry: "",
    contactNumber: "",
    safetyScore: "100",
    status: "AVAILABLE"
  });

  const loadDrivers = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api.getDrivers(statusFilter, search);
      setDrivers(data);
    } catch (err) {
      setError(err.message || "Failed to load drivers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDrivers();
  }, [statusFilter, search]);

  const handleOpenAddModal = () => {
    if (!isSafetyOfficer) return;
    setModalMode("ADD");
    setFormFields({
      name: "",
      licenseNumber: "",
      licenseCategory: "Class A",
      licenseExpiry: "",
      contactNumber: "",
      safetyScore: "100",
      status: "AVAILABLE"
    });
    setModalError("");
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (driver) => {
    if (!isSafetyOfficer) return;
    setModalMode("EDIT");
    setSelectedDriver(driver);
    setFormFields({
      name: driver.name,
      licenseNumber: driver.licenseNumber,
      licenseCategory: driver.licenseCategory,
      licenseExpiry: driver.licenseExpiry,
      contactNumber: driver.contactNumber,
      safetyScore: driver.safetyScore.toString(),
      status: driver.status
    });
    setModalError("");
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setModalError("");

    const payload = {
      ...formFields,
      safetyScore: Number(formFields.safetyScore)
    };

    try {
      if (modalMode === "ADD") {
        await api.createDriver(payload);
      } else {
        await api.updateDriver(selectedDriver.id, payload);
      }
      setIsModalOpen(false);
      loadDrivers();
    } catch (err) {
      setModalError(err.message || "Operation failed. Please verify input data.");
    }
  };

  const isLicenseExpired = (expiryDate) => {
    const today = new Date();
    // Normalize time to compare dates only
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(expiryDate);
    return expiry < today;
  };

  const getSafetyScoreColor = (score) => {
    if (score >= 90) return "text-brand-success bg-emerald-500/10 border-emerald-500/20";
    if (score >= 80) return "text-brand-warning bg-amber-500/10 border-amber-500/20";
    return "text-brand-danger bg-red-500/10 border-red-500/20";
  };

  return (
    <div className="p-8 space-y-8">
      {/* Title */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight m-0">Drivers Registry</h1>
          <p className="text-slate-400 text-sm mt-1">
            {isSafetyOfficer
              ? "Manage driver certifications, safety compliance scoring, and licensing verification."
              : "Read-only view of the drivers registry and licensing status."}
          </p>
        </div>
        {isSafetyOfficer && (
          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 px-5 py-2.5 bg-brand-primary hover:bg-brand-primary-light text-white rounded-xl text-sm font-semibold transition-all cursor-pointer shadow-lg shadow-brand-primary/20"
          >
            <Plus size={16} />
            <span>Add Driver</span>
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-brand-danger text-sm">
          {error}
        </div>
      )}

      {/* Grid of Drivers (showing cards for detailed overview) */}
      <div className="space-y-6">
        {/* Controls bar */}
        <div className="glass-panel p-6 rounded-2xl border border-dark-border bg-dark-surface/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            <UserCheck size={16} className="text-brand-primary" />
            <span>Active Driver Roster</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                <Search size={15} />
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search drivers (name, license)..."
                className="pl-10 pr-4 py-2 text-xs rounded-xl form-input-custom text-white w-64"
              />
            </div>

            {/* Status Select */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 text-xs rounded-xl form-input-custom text-white bg-dark-bg cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option value="AVAILABLE">Available</option>
              <option value="ON_TRIP">On Trip</option>
              <option value="OFF_DUTY">Off Duty</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
          </div>
        </div>

        {/* Drivers grid */}
        {loading ? (
          <div className="text-center py-12 text-slate-400">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-brand-primary border-t-transparent mr-2 align-middle"></div>
            Loading driver roster...
          </div>
        ) : drivers.length === 0 ? (
          <div className="text-center py-12 glass-panel rounded-2xl border border-dark-border text-slate-500">
            No drivers found matching search parameters.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {drivers.map((driver) => {
              const expired = isLicenseExpired(driver.licenseExpiry);
              return (
                <div
                  key={driver.id}
                  className={`glass-panel p-6 rounded-2xl flex flex-col justify-between border relative overflow-hidden transition-all duration-300 ${expired ? "border-red-500/40 shadow-lg shadow-red-500/5 bg-red-950/5" : "border-dark-border"
                    }`}
                >
                  {/* License status indicator */}
                  {expired && (
                    <div className="absolute top-0 right-0 px-3 py-1 bg-brand-danger text-white text-[10px] font-bold uppercase tracking-wider rounded-bl-lg flex items-center gap-1">
                      <ShieldAlert size={10} />
                      <span>License Expired</span>
                    </div>
                  )}

                  <div className="space-y-4">
                    {/* Header: Driver Name */}
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-bold text-white">{driver.name}</h3>
                        <p className="text-xs text-slate-400 font-mono mt-0.5">{driver.licenseNumber} • {driver.licenseCategory}</p>
                      </div>
                      <span className={`px-2.5 py-1 text-xs font-bold rounded border ${getSafetyScoreColor(driver.safetyScore)}`}>
                        Score: {driver.safetyScore}
                      </span>
                    </div>

                    {/* License Expiry warning */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">License Expiry:</span>
                        <span className={expired ? "text-brand-danger font-bold flex items-center gap-1" : "text-slate-300"}>
                          {driver.licenseExpiry}
                        </span>
                      </div>
                      {expired && (
                        <div className="text-[11px] text-brand-danger font-semibold bg-red-500/10 border border-red-500/20 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 mt-1.5">
                          <AlertTriangle size={12} className="shrink-0 animate-bounce" />
                          <span>Licensing issue: Driving privileges suspended!</span>
                        </div>
                      )}
                    </div>

                    {/* Contact & Status details */}
                    <div className="text-xs space-y-1.5 pt-2 border-t border-dark-border/40">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Contact:</span>
                        <span className="text-slate-300">{driver.contactNumber}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Status:</span>
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${driver.status === "AVAILABLE" ? "bg-emerald-500/10 text-brand-success" :
                          driver.status === "ON_TRIP" ? "bg-cyan-500/10 text-brand-secondary" :
                            driver.status === "SUSPENDED" ? "bg-red-500/10 text-brand-danger" : "bg-slate-500/10 text-slate-400"
                          }`}>
                          {driver.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions (Safety Officer only) */}
                  {isSafetyOfficer && (
                    <div className="mt-6 pt-4 border-t border-dark-border/40 flex justify-end">
                      <button
                        onClick={() => handleOpenEditModal(driver)}
                        className="flex items-center gap-1 px-3.5 py-1.5 rounded-xl border border-dark-border hover:border-brand-primary text-slate-400 hover:text-white hover:bg-brand-primary/10 text-xs font-semibold transition-all cursor-pointer"
                      >
                        <Edit2 size={12} />
                        <span>Edit Driver Profile</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Global Policy Warning Box matching mockup */}
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-brand-danger text-xs font-semibold shadow-inner">
          <AlertTriangle size={16} className="shrink-0 animate-pulse" />
          <span>Driving privilege is suspended if driving license has expired. Drivers with expired licenses cannot be assigned to trips.</span>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg glass-panel rounded-2xl shadow-2xl overflow-hidden border border-dark-border">
            <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-brand-primary to-brand-secondary"></div>

            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-dark-border bg-dark-surface/40">
              <h3 className="text-lg font-bold text-white">
                {modalMode === "ADD" ? "Register New Driver" : "Modify Driver Credentials"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-dark-surface rounded-lg transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              {modalError && (
                <div className="flex items-center gap-2 p-3.5 rounded-lg bg-red-500/10 border border-red-500/20 text-brand-danger text-xs">
                  <AlertTriangle size={16} className="shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Driver Name</label>
                  <input
                    type="text"
                    required
                    value={formFields.name}
                    onChange={(e) => setFormFields({ ...formFields, name: e.target.value })}
                    className="w-full form-input-custom px-3 py-2 text-sm rounded-lg text-white"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">License Number</label>
                  <input
                    type="text"
                    required
                    value={formFields.licenseNumber}
                    onChange={(e) => setFormFields({ ...formFields, licenseNumber: e.target.value })}
                    className="w-full form-input-custom px-3 py-2 text-sm rounded-lg text-white"
                    placeholder="DL-908123A"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">License Category</label>
                  <select
                    value={formFields.licenseCategory}
                    onChange={(e) => setFormFields({ ...formFields, licenseCategory: e.target.value })}
                    className="w-full form-input-custom px-3 py-2 text-sm rounded-lg text-white bg-dark-bg cursor-pointer"
                  >
                    <option value="Class A">Class A CDL (Heavy truck)</option>
                    <option value="Class B">Class B CDL (Light truck/Bus)</option>
                    <option value="Class C">Class C Standard (Van/Car)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">License Expiry Date</label>
                  <input
                    type="date"
                    required
                    value={formFields.licenseExpiry}
                    onChange={(e) => setFormFields({ ...formFields, licenseExpiry: e.target.value })}
                    className="w-full form-input-custom px-3 py-2 text-sm rounded-lg text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Contact Number</label>
                  <input
                    type="tel"
                    required
                    value={formFields.contactNumber}
                    onChange={(e) => setFormFields({ ...formFields, contactNumber: e.target.value })}
                    className="w-full form-input-custom px-3 py-2 text-sm rounded-lg text-white"
                    placeholder="+1-555-0192"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Safety Score (0 - 100)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    max="100"
                    value={formFields.safetyScore}
                    onChange={(e) => setFormFields({ ...formFields, safetyScore: e.target.value })}
                    className="w-full form-input-custom px-3 py-2 text-sm rounded-lg text-white"
                    placeholder="92"
                  />
                </div>
              </div>

              {modalMode === "EDIT" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Roster Status</label>
                  <select
                    value={formFields.status}
                    onChange={(e) => setFormFields({ ...formFields, status: e.target.value })}
                    className="w-full form-input-custom px-3 py-2 text-sm rounded-lg text-white bg-dark-bg cursor-pointer"
                  >
                    <option value="AVAILABLE">Available</option>
                    <option value="ON_TRIP">On Trip</option>
                    <option value="OFF_DUTY">Off Duty</option>
                    <option value="SUSPENDED">Suspended</option>
                  </select>
                </div>
              )}

              {/* Actions Footer */}
              <div className="flex justify-end gap-3 pt-4 border-t border-dark-border mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-dark-border text-slate-300 hover:bg-dark-surface rounded-xl text-sm font-semibold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand-primary hover:bg-brand-primary-light text-white rounded-xl text-sm font-semibold transition-all cursor-pointer shadow-lg shadow-brand-primary/20"
                >
                  {modalMode === "ADD" ? "Register Driver" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
