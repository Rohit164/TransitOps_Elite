import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { Plus, Wrench, X, AlertTriangle, CheckCircle2, DollarSign } from "lucide-react";

export default function Maintenance() {
  const { user } = useAuth();
  const isManager = user?.role === "FLEET_MANAGER";

  const [maintenance, setMaintenance] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [maintError, setMaintError] = useState("");
  const [formFields, setFormFields] = useState({
    vehicleId: "",
    description: ""
  });

  // Complete Service Modal
  const [isCompleteOpen, setIsCompleteOpen] = useState(false);
  const [activeMaint, setActiveMaint] = useState(null);
  const [serviceCost, setServiceCost] = useState("");
  const [completeError, setCompleteError] = useState("");

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [maintData, vehiclesData] = await Promise.all([
        api.getMaintenance(),
        api.getVehicles()
      ]);
      setMaintenance(maintData);
      setVehicles(vehiclesData);
    } catch (err) {
      setError(err.message || "Failed to load repair records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAddModal = () => {
    if (!isManager) return;
    setFormFields({ vehicleId: "", description: "" });
    setMaintError("");
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setMaintError("");
    try {
      await api.createMaintenance(formFields);
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      setMaintError(err.message || "Failed to enter maintenance record");
    }
  };

  const handleOpenCompleteModal = (maint) => {
    setActiveMaint(maint);
    setServiceCost("");
    setCompleteError("");
    setIsCompleteOpen(true);
  };

  const handleCompleteSubmit = async (e) => {
    e.preventDefault();
    setCompleteError("");
    try {
      await api.completeMaintenance(activeMaint.id, { serviceCost: Number(serviceCost) });
      setIsCompleteOpen(false);
      loadData();
    } catch (err) {
      setCompleteError(err.message || "Failed to log maintenance completion");
    }
  };

  const getVehicleReg = (vId) => {
    const v = vehicles.find(x => x.id === vId);
    return v ? `${v.name} (${v.registrationNumber})` : "N/A";
  };

  const availableVehicles = vehicles.filter(v => v.status === "AVAILABLE");

  return (
    <div className="p-8 space-y-8">
      {/* Title */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight m-0">Maintenance & Repairs</h1>
          <p className="text-slate-400 text-sm mt-1">
            {isManager
              ? "Oversee vehicle health, schedule repairs, and complete shop services."
              : "Read-only history of vehicle maintenance operations."}
          </p>
        </div>
        {isManager && (
          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 px-5 py-2.5 bg-brand-primary hover:bg-brand-primary-light text-white rounded-xl text-sm font-semibold transition-all cursor-pointer shadow-lg shadow-brand-primary/20"
          >
            <Plus size={16} />
            <span>Create Service Entry</span>
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-brand-danger text-sm">
          {error}
        </div>
      )}

      {/* Maintenance Logs Table */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-dark-border shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-dark-border bg-dark-bg/20 text-slate-400 text-xs font-bold uppercase tracking-wider">
                <th className="py-4 px-6">Vehicle</th>
                <th className="py-4 px-6">Service Description</th>
                <th className="py-4 px-6">Entry Date</th>
                <th className="py-4 px-6">Completion Details</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-border/40 text-sm">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400">
                    <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-brand-primary border-t-transparent mr-2 align-middle"></div>
                    Retrieving maintenance history...
                  </td>
                </tr>
              ) : maintenance.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-500">
                    No active or completed repairs recorded.
                  </td>
                </tr>
              ) : (
                maintenance.map((m) => (
                  <tr key={m.id} className="hover:bg-dark-surface/30 transition-colors">
                    <td className="py-4 px-6 font-semibold text-white">
                      {getVehicleReg(m.vehicleId)}
                    </td>
                    <td className="py-4 px-6 text-slate-300">
                      {m.description}
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-400">
                      {new Date(m.entryDate).toLocaleString()}
                    </td>
                    <td className="py-4 px-6 text-slate-300">
                      {m.completionDate ? (
                        <div>
                          <div className="text-xs text-slate-500">Completed: {new Date(m.completionDate).toLocaleString()}</div>
                          <div className="text-brand-success font-semibold">${Number(m.serviceCost).toLocaleString()}</div>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500 italic">Repair ongoing</span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      {m.status === "IN_SHOP" ? (
                        <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-red-500/10 text-brand-danger border border-red-500/20">In Shop</span>
                      ) : (
                        <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-500/10 text-brand-success border border-emerald-500/20">Fixed</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right">
                      {m.status === "IN_SHOP" && isManager ? (
                        <button
                          onClick={() => handleOpenCompleteModal(m)}
                          className="px-3.5 py-1.5 rounded-lg border border-brand-primary/30 hover:border-brand-primary text-brand-primary bg-brand-primary/5 hover:bg-brand-primary/10 text-xs font-semibold transition-all cursor-pointer"
                        >
                          Complete Service
                        </button>
                      ) : (
                        <span className="text-xs text-slate-600">No actions available</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Maintenance Entry Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md glass-panel rounded-2xl shadow-2xl overflow-hidden border border-dark-border">
            <div className="absolute top-0 left-0 w-full h-[3px] bg-brand-primary"></div>
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-dark-border bg-dark-surface/40">
              <h3 className="text-lg font-bold text-white">Create Service Entry</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-dark-surface rounded-lg transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              {maintError && (
                <div className="flex items-center gap-2.5 p-3.5 rounded-lg bg-red-500/10 border border-red-500/20 text-brand-danger text-xs">
                  <AlertTriangle size={16} className="shrink-0" />
                  <span>{maintError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Select Vehicle</label>
                {availableVehicles.length === 0 ? (
                  <div className="text-xs text-brand-danger border border-red-500/20 bg-red-500/5 p-3 rounded-lg flex items-center gap-2">
                    <AlertTriangle size={14} />
                    <span>No vehicles currently AVAILABLE to send to shop.</span>
                  </div>
                ) : (
                  <select
                    required
                    value={formFields.vehicleId}
                    onChange={(e) => setFormFields({ ...formFields, vehicleId: e.target.value })}
                    className="w-full form-input-custom px-3 py-2.5 text-sm rounded-lg text-white bg-dark-bg cursor-pointer"
                  >
                    <option value="">Choose a vehicle...</option>
                    {availableVehicles.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.name} ({v.registrationNumber}) • Odo: {v.currentOdometer.toLocaleString()} km
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Service Description</label>
                <textarea
                  required
                  rows="3"
                  value={formFields.description}
                  onChange={(e) => setFormFields({ ...formFields, description: e.target.value })}
                  className="w-full form-input-custom px-3 py-2 text-sm rounded-lg text-white resize-none"
                  placeholder="Brake pad replacement and diagnostic test..."
                />
              </div>

              <div className="text-[11px] text-slate-500 italic bg-dark-bg/25 border border-dark-border/40 p-3 rounded-lg leading-relaxed">
                Confirming transitions the vehicle status to IN_SHOP immediately. It will be hidden from the dispatcher's available vehicle selectors.
              </div>

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
                  disabled={availableVehicles.length === 0}
                  className="px-5 py-2 bg-brand-primary hover:bg-brand-primary-light text-white rounded-xl text-sm font-semibold transition-all cursor-pointer shadow-lg shadow-brand-primary/20 disabled:opacity-50"
                >
                  Send to Shop
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Complete Maintenance Modal */}
      {isCompleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md glass-panel rounded-2xl shadow-2xl overflow-hidden border border-dark-border">
            <div className="absolute top-0 left-0 w-full h-[3px] bg-brand-success"></div>
            
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-dark-border bg-dark-surface/40">
              <h3 className="text-lg font-bold text-white">Record Service Completion</h3>
              <button
                onClick={() => setIsCompleteOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-dark-surface rounded-lg transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCompleteSubmit} className="p-6 space-y-4">
              {completeError && (
                <div className="flex items-center gap-2.5 p-3.5 rounded-lg bg-red-500/10 border border-red-500/20 text-brand-danger text-xs">
                  <AlertTriangle size={16} className="shrink-0" />
                  <span>{completeError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Repair / Service Cost ($)</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                    <DollarSign size={15} />
                  </span>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={serviceCost}
                    onChange={(e) => setServiceCost(e.target.value)}
                    className="w-full form-input-custom pl-8 pr-3 py-2 text-sm rounded-lg text-white"
                    placeholder="450.00"
                  />
                </div>
              </div>

              <div className="text-[11px] text-slate-500 italic bg-dark-bg/25 border border-dark-border/40 p-3 rounded-lg leading-relaxed">
                Recording completion transitions the vehicle status back to AVAILABLE (allowing it to be dispatched for routes) and registers the maintenance cost under operational expenses.
              </div>

              {/* Actions Footer */}
              <div className="flex justify-end gap-3 pt-4 border-t border-dark-border mt-6">
                <button
                  type="button"
                  onClick={() => setIsCompleteOpen(false)}
                  className="px-4 py-2 border border-dark-border text-slate-300 hover:bg-dark-surface rounded-xl text-sm font-semibold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand-success hover:bg-emerald-400 text-white rounded-xl text-sm font-semibold transition-all cursor-pointer shadow-lg shadow-brand-success/20"
                >
                  Complete Service
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
