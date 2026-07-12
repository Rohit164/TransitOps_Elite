import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { Plus, Edit2, Trash2, Search, X, AlertTriangle, Info } from "lucide-react";

export default function Fleet() {
  const { user } = useAuth();
  const isManager = user?.role === "FLEET_MANAGER";

  const [vehicles, setVehicles] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("ADD"); // ADD or EDIT
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [modalError, setModalError] = useState("");

  // Form Fields
  const [formFields, setFormFields] = useState({
    registrationNumber: "",
    name: "",
    type: "TRUCK",
    maxLoadCapacity: "",
    acquisitionCost: "",
    currentOdometer: "",
    status: "AVAILABLE"
  });

  const loadVehicles = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api.getVehicles(statusFilter, search);
      setVehicles(data);
    } catch (err) {
      setError(err.message || "Failed to load vehicles");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVehicles();
  }, [statusFilter, search]);

  const handleOpenAddModal = () => {
    if (!isManager) return;
    setModalMode("ADD");
    setFormFields({
      registrationNumber: "",
      name: "",
      type: "TRUCK",
      maxLoadCapacity: "",
      acquisitionCost: "",
      currentOdometer: "",
      status: "AVAILABLE"
    });
    setModalError("");
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (vehicle) => {
    if (!isManager) return;
    setModalMode("EDIT");
    setSelectedVehicle(vehicle);
    setFormFields({
      registrationNumber: vehicle.registrationNumber,
      name: vehicle.name,
      type: vehicle.type,
      maxLoadCapacity: vehicle.maxLoadCapacity.toString(),
      acquisitionCost: vehicle.acquisitionCost.toString(),
      currentOdometer: vehicle.currentOdometer.toString(),
      status: vehicle.status
    });
    setModalError("");
    setIsModalOpen(true);
  };

  const handleDeleteVehicle = async (id) => {
    if (!isManager) return;
    if (!window.confirm("Are you sure you want to retire and remove this vehicle from the registry?")) return;
    try {
      await api.deleteVehicle(id);
      loadVehicles();
    } catch (err) {
      setError(err.message || "Failed to delete vehicle");
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setModalError("");

    const payload = {
      ...formFields,
      maxLoadCapacity: Number(formFields.maxLoadCapacity),
      acquisitionCost: Number(formFields.acquisitionCost),
      currentOdometer: Number(formFields.currentOdometer)
    };

    try {
      if (modalMode === "ADD") {
        await api.createVehicle(payload);
      } else {
        await api.updateVehicle(selectedVehicle.id, payload);
      }
      setIsModalOpen(false);
      loadVehicles();
    } catch (err) {
      setModalError(err.message || "Operation failed. Please verify input data.");
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "AVAILABLE":
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-500/10 text-brand-success border border-emerald-500/20">Available</span>;
      case "ON_TRIP":
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-cyan-500/10 text-brand-secondary border border-cyan-500/20">On Trip</span>;
      case "IN_SHOP":
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-red-500/10 text-brand-danger border border-red-500/20">In Shop</span>;
      case "RETIRED":
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">Retired</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-slate-500/10 text-slate-400 border border-slate-500/20">{status}</span>;
    }
  };

  return (
    <div className="p-8 space-y-8">
      {/* Title */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight m-0">Fleet Registry</h1>
          <p className="text-slate-400 text-sm mt-1">
            {isManager
              ? "Register, update, and manage vehicles in the operational fleet."
              : "Read-only view of current fleet status and records."}
          </p>
        </div>
        {isManager && (
          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 px-5 py-2.5 bg-brand-primary hover:bg-brand-primary-light text-white rounded-xl text-sm font-semibold transition-all cursor-pointer shadow-lg shadow-brand-primary/20"
          >
            <Plus size={16} />
            <span>Add Vehicle</span>
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-brand-danger text-sm">
          {error}
        </div>
      )}

      {/* Filters & Table Glass Container */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-dark-border shadow-lg">
        {/* Controls bar */}
        <div className="p-6 border-b border-dark-border bg-dark-surface/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Info size={16} className="text-brand-primary" />
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Filtered Fleet Index</span>
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
                placeholder="Search registry (e.g. Volvo, plate)..."
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
              <option value="IN_SHOP">In Shop</option>
              <option value="RETIRED">Retired</option>
            </select>
          </div>
        </div>

        {/* Table list */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-dark-border bg-dark-bg/20 text-slate-400 text-xs font-bold uppercase tracking-wider">
                <th className="py-4 px-6">Model / Name</th>
                <th className="py-4 px-6">Plate Number</th>
                <th className="py-4 px-6">Category</th>
                <th className="py-4 px-6">Odometer</th>
                <th className="py-4 px-6">Details (Capacity / Cost)</th>
                <th className="py-4 px-6">Status</th>
                {isManager && <th className="py-4 px-6 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-border/40 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={isManager ? 7 : 6} className="py-8 text-center text-slate-400">
                    <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-brand-primary border-t-transparent mr-2 align-middle"></div>
                    Querying records...
                  </td>
                </tr>
              ) : vehicles.length === 0 ? (
                <tr>
                  <td colSpan={isManager ? 7 : 6} className="py-8 text-center text-slate-500">
                    No vehicles found matching the criteria.
                  </td>
                </tr>
              ) : (
                vehicles.map((vehicle) => (
                  <tr key={vehicle.id} className="hover:bg-dark-surface/30 transition-colors">
                    <td className="py-4 px-6 font-semibold text-white">
                      {vehicle.name}
                    </td>
                    <td className="py-4 px-6 font-mono text-slate-300">
                      {vehicle.registrationNumber}
                    </td>
                    <td className="py-4 px-6">
                      <span className="px-2 py-0.5 text-xs rounded bg-dark-border text-slate-300">
                        {vehicle.type}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-slate-300">
                      {vehicle.currentOdometer.toLocaleString()} km
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-slate-300">Capacity: {vehicle.maxLoadCapacity.toLocaleString()} kg</div>
                      <div className="text-xs text-slate-500">Cost: ${vehicle.acquisitionCost.toLocaleString()}</div>
                    </td>
                    <td className="py-4 px-6">
                      {getStatusBadge(vehicle.status)}
                    </td>
                    {isManager && (
                      <td className="py-4 px-6 text-right space-x-2">
                        <button
                          onClick={() => handleOpenEditModal(vehicle)}
                          className="p-1.5 rounded-lg border border-dark-border text-slate-400 hover:text-white hover:bg-dark-surface transition-all cursor-pointer active:scale-95 inline-flex"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteVehicle(vehicle.id)}
                          className="p-1.5 rounded-lg border border-dark-border text-slate-400 hover:text-brand-danger hover:bg-red-500/5 transition-all cursor-pointer active:scale-95 inline-flex"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal (Glassmorphism design) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg glass-panel rounded-2xl shadow-2xl overflow-hidden border border-dark-border">
            <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-brand-primary to-brand-secondary"></div>
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-dark-border bg-dark-surface/40">
              <h3 className="text-lg font-bold text-white">
                {modalMode === "ADD" ? "Register New Fleet Vehicle" : "Edit Vehicle Details"}
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
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Registration Number</label>
                  <input
                    type="text"
                    required
                    disabled={modalMode === "EDIT"} // Match standard DB schemas, plate shouldn't change
                    value={formFields.registrationNumber}
                    onChange={(e) => setFormFields({ ...formFields, registrationNumber: e.target.value })}
                    className="w-full form-input-custom px-3 py-2 text-sm rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="TX-901-AB"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Vehicle Name/Model</label>
                  <input
                    type="text"
                    required
                    value={formFields.name}
                    onChange={(e) => setFormFields({ ...formFields, name: e.target.value })}
                    className="w-full form-input-custom px-3 py-2 text-sm rounded-lg text-white"
                    placeholder="Volvo FH16 Heavy"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Category Type</label>
                  <select
                    value={formFields.type}
                    onChange={(e) => setFormFields({ ...formFields, type: e.target.value })}
                    className="w-full form-input-custom px-3 py-2 text-sm rounded-lg text-white bg-dark-bg cursor-pointer"
                  >
                    <option value="TRUCK">Truck</option>
                    <option value="VAN">Van</option>
                    <option value="FLATBED">Flatbed</option>
                    <option value="CAR">Car</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Max Load Capacity (kg)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formFields.maxLoadCapacity}
                    onChange={(e) => setFormFields({ ...formFields, maxLoadCapacity: e.target.value })}
                    className="w-full form-input-custom px-3 py-2 text-sm rounded-lg text-white"
                    placeholder="25000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Acquisition Cost ($)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formFields.acquisitionCost}
                    onChange={(e) => setFormFields({ ...formFields, acquisitionCost: e.target.value })}
                    className="w-full form-input-custom px-3 py-2 text-sm rounded-lg text-white"
                    placeholder="145000"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Odometer Reading (km)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formFields.currentOdometer}
                    onChange={(e) => setFormFields({ ...formFields, currentOdometer: e.target.value })}
                    className="w-full form-input-custom px-3 py-2 text-sm rounded-lg text-white"
                    placeholder="125400"
                  />
                </div>
              </div>

              {modalMode === "EDIT" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Operational Status</label>
                  <select
                    value={formFields.status}
                    onChange={(e) => setFormFields({ ...formFields, status: e.target.value })}
                    className="w-full form-input-custom px-3 py-2 text-sm rounded-lg text-white bg-dark-bg cursor-pointer"
                  >
                    <option value="AVAILABLE">Available</option>
                    <option value="ON_TRIP">On Trip</option>
                    <option value="IN_SHOP">In Shop</option>
                    <option value="RETIRED">Retired</option>
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
                  {modalMode === "ADD" ? "Add to Fleet" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
