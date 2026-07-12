import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import {
  Plus,
  Compass,
  ArrowRight,
  Truck,
  User,
  Scale,
  MapPin,
  X,
  AlertTriangle,
  CheckCircle2,
  Lock,
  ChevronRight,
  ChevronLeft
} from "lucide-react";

export default function Trips() {
  const { user } = useAuth();
  const isDispatcher = user?.role === "DISPATCHER";

  const [trips, setTrips] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Complete Modal State
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [activeCompleteTrip, setActiveCompleteTrip] = useState(null);
  const [completeOdo, setCompleteOdo] = useState("");
  const [completeFuel, setCompleteFuel] = useState("");
  const [completeError, setCompleteError] = useState("");

  // Wizard Modal State
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [wizardError, setWizardError] = useState("");

  // Wizard Fields
  const [wizardFields, setWizardFields] = useState({
    source: "",
    destination: "",
    vehicleId: "",
    driverId: "",
    cargoWeight: "",
    plannedDistance: ""
  });

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [tripsData, vehiclesData, driversData] = await Promise.all([
        api.getTrips(),
        api.getVehicles(),
        api.getDrivers()
      ]);
      setTrips(tripsData);
      setVehicles(vehiclesData);
      setDrivers(driversData);
    } catch (err) {
      setError(err.message || "Failed to load dispatcher logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenWizard = () => {
    if (!isDispatcher) return;
    setWizardStep(1);
    setWizardFields({
      source: "",
      destination: "",
      vehicleId: "",
      driverId: "",
      cargoWeight: "",
      plannedDistance: ""
    });
    setWizardError("");
    setIsWizardOpen(true);
  };

  const handleNextStep = () => {
    // Basic validation per step
    if (wizardStep === 1 && (!wizardFields.source || !wizardFields.destination)) {
      setWizardError("Please provide both source and destination routes.");
      return;
    }
    if (wizardStep === 2 && !wizardFields.vehicleId) {
      setWizardError("Please select a vehicle for cargo transport.");
      return;
    }
    if (wizardStep === 3 && !wizardFields.driverId) {
      setWizardError("Please select a driver for dispatch.");
      return;
    }
    if (wizardStep === 4 && (!wizardFields.cargoWeight || !wizardFields.plannedDistance)) {
      setWizardError("Please provide cargo load weight and trip distance.");
      return;
    }

    setWizardError("");
    setWizardStep(prev => prev + 1);
  };

  const handlePrevStep = () => {
    setWizardError("");
    setWizardStep(prev => prev - 1);
  };

  const handleDispatchAction = async () => {
    setWizardError("");
    try {
      // 1. Create the Trip in PENDING state
      const newTrip = await api.createTrip(wizardFields);
      
      // 2. Attempt to Dispatch it (Triggering backend constraints validation)
      await api.dispatchTrip(newTrip.id);
      
      setIsWizardOpen(false);
      loadData();
    } catch (err) {
      setWizardError(err.message || "Dispatch aborted due to business validation error.");
    }
  };

  const handleOpenCompleteModal = (trip) => {
    const v = vehicles.find(x => x.id === trip.vehicleId);
    setActiveCompleteTrip(trip);
    setCompleteOdo(v ? v.currentOdometer.toString() : "");
    setCompleteFuel("");
    setCompleteError("");
    setIsCompleteModalOpen(true);
  };

  const handleCompleteSubmit = async (e) => {
    e.preventDefault();
    setCompleteError("");
    try {
      await api.completeTrip(activeCompleteTrip.id, {
        finalOdometer: Number(completeOdo),
        fuelUsed: Number(completeFuel)
      });
      setIsCompleteModalOpen(false);
      loadData();
    } catch (err) {
      setCompleteError(err.message || "Failed to log completion. Verify odometer readings.");
    }
  };

  const getVehicleLabel = (id) => {
    const v = vehicles.find(x => x.id === id);
    return v ? `${v.name} (${v.registrationNumber})` : "N/A";
  };

  const getDriverLabel = (id) => {
    const d = drivers.find(x => x.id === id);
    return d ? d.name : "N/A";
  };

  // Only show AVAILABLE status items in selectors
  const availableVehiclesList = vehicles.filter(v => v.status === "AVAILABLE");
  const availableDriversList = drivers.filter(d => d.status === "AVAILABLE");

  const getStatusBadge = (status) => {
    switch (status) {
      case "COMPLETED":
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-500/10 text-brand-success border border-emerald-500/20">Completed</span>;
      case "DISPATCHED":
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-cyan-500/10 text-brand-secondary border border-cyan-500/20">Dispatched</span>;
      case "PENDING":
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-amber-500/10 text-brand-warning border border-brand-warning/20">Pending</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-slate-500/10 text-slate-400 border border-slate-500/20">{status}</span>;
    }
  };

  return (
    <div className="p-8 space-y-8">
      {/* Title */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight m-0">Trip Dispatch Center</h1>
          <p className="text-slate-400 text-sm mt-1">
            {isDispatcher
              ? "Plan, validate, and dispatch route shipments across the fleet."
              : "Read-only dispatcher logs and routes."}
          </p>
        </div>
        {isDispatcher && (
          <button
            onClick={handleOpenWizard}
            className="flex items-center gap-2 px-5 py-2.5 bg-brand-primary hover:bg-brand-primary-light text-white rounded-xl text-sm font-semibold transition-all cursor-pointer shadow-lg shadow-brand-primary/20"
          >
            <Plus size={16} />
            <span>Dispatch Wizard</span>
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-brand-danger text-sm">
          {error}
        </div>
      )}

      {/* Trips logs list */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-dark-border shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-dark-border bg-dark-bg/20 text-slate-400 text-xs font-bold uppercase tracking-wider">
                <th className="py-4 px-6">Source Location</th>
                <th className="py-4 px-6">Destination Location</th>
                <th className="py-4 px-6">Vehicle Assigned</th>
                <th className="py-4 px-6">Driver Assigned</th>
                <th className="py-4 px-6">Cargo & Distance</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-border/40 text-sm">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-400">
                    <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-brand-primary border-t-transparent mr-2 align-middle"></div>
                    Retrieving dispatch history...
                  </td>
                </tr>
              ) : trips.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-500">
                    No trips logged.
                  </td>
                </tr>
              ) : (
                trips.map((trip) => (
                  <tr key={trip.id} className="hover:bg-dark-surface/30 transition-colors">
                    <td className="py-4 px-6 font-semibold text-white">
                      {trip.source}
                    </td>
                    <td className="py-4 px-6 font-semibold text-white">
                      {trip.destination}
                    </td>
                    <td className="py-4 px-6 text-slate-300">
                      {getVehicleLabel(trip.vehicleId)}
                    </td>
                    <td className="py-4 px-6 text-slate-300">
                      {getDriverLabel(trip.driverId)}
                    </td>
                    <td className="py-4 px-6 text-slate-300">
                      <div>Weight: {trip.cargoWeight.toLocaleString()} kg</div>
                      <div className="text-xs text-slate-500">Distance: {trip.plannedDistance} km</div>
                    </td>
                    <td className="py-4 px-6">
                      {getStatusBadge(trip.status)}
                    </td>
                    <td className="py-4 px-6 text-right">
                      {trip.status === "DISPATCHED" ? (
                        <button
                          onClick={() => handleOpenCompleteModal(trip)}
                          className="px-3.5 py-1.5 rounded-lg border border-brand-success/30 hover:border-brand-success text-brand-success bg-emerald-500/5 hover:bg-emerald-500/10 text-xs font-semibold transition-all cursor-pointer"
                        >
                          Complete Route
                        </button>
                      ) : trip.status === "COMPLETED" ? (
                        <div className="text-xs text-slate-500">
                          <div>Fuel: {trip.fuelUsed} L</div>
                          <div>Odo: {trip.finalOdometer.toLocaleString()} km</div>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500 italic">Pending dispatch</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dispatch Wizard Modal */}
      {isWizardOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg glass-panel rounded-2xl shadow-2xl overflow-hidden border border-dark-border">
            <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-brand-primary to-brand-secondary"></div>
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-dark-border bg-dark-surface/40">
              <div className="flex flex-col">
                <h3 className="text-lg font-bold text-white">Create & Dispatch Route</h3>
                <span className="text-xs text-slate-500">Step {wizardStep} of 5</span>
              </div>
              <button
                onClick={() => setIsWizardOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-dark-surface rounded-lg transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Steps Visual Indicator */}
            <div className="flex items-center justify-between px-6 py-3 bg-dark-bg/25 border-b border-dark-border/40 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              <span className={wizardStep >= 1 ? "text-brand-primary" : ""}>1. Route</span>
              <ChevronRight size={10} />
              <span className={wizardStep >= 2 ? "text-brand-primary" : ""}>2. Vehicle</span>
              <ChevronRight size={10} />
              <span className={wizardStep >= 3 ? "text-brand-primary" : ""}>3. Driver</span>
              <ChevronRight size={10} />
              <span className={wizardStep >= 4 ? "text-brand-primary" : ""}>4. Cargo</span>
              <ChevronRight size={10} />
              <span className={wizardStep >= 5 ? "text-brand-primary" : ""}>5. Dispatch</span>
            </div>

            {/* Form Step Body */}
            <div className="p-6 space-y-4">
              {wizardError && (
                <div className="flex items-center gap-2.5 p-3.5 rounded-lg bg-red-500/10 border border-red-500/20 text-brand-danger text-xs">
                  <AlertTriangle size={16} className="shrink-0" />
                  <span>{wizardError}</span>
                </div>
              )}

              {/* Step 1: Source & Destination */}
              {wizardStep === 1 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-1.5">
                    <MapPin size={16} className="text-brand-primary" />
                    <span>Define Route Boundaries</span>
                  </h4>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">SOURCE LOCATION</label>
                    <input
                      type="text"
                      required
                      value={wizardFields.source}
                      onChange={(e) => setWizardFields({ ...wizardFields, source: e.target.value })}
                      className="w-full form-input-custom px-3 py-2 text-sm rounded-lg text-white"
                      placeholder="e.g. Dallas, TX"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">DESTINATION LOCATION</label>
                    <input
                      type="text"
                      required
                      value={wizardFields.destination}
                      onChange={(e) => setWizardFields({ ...wizardFields, destination: e.target.value })}
                      className="w-full form-input-custom px-3 py-2 text-sm rounded-lg text-white"
                      placeholder="e.g. Houston, TX"
                    />
                  </div>
                </div>
              )}

              {/* Step 2: Choose Vehicle */}
              {wizardStep === 2 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-1.5">
                    <Truck size={16} className="text-brand-primary" />
                    <span>Select Available Vehicle</span>
                  </h4>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">CHOOSE TRUCK/VAN</label>
                    {availableVehiclesList.length === 0 ? (
                      <div className="text-xs text-brand-danger border border-red-500/20 bg-red-500/5 p-3 rounded-lg flex items-center gap-2">
                        <AlertTriangle size={14} />
                        <span>No vehicles currently AVAILABLE. Check maintenance shop.</span>
                      </div>
                    ) : (
                      <select
                        value={wizardFields.vehicleId}
                        onChange={(e) => setWizardFields({ ...wizardFields, vehicleId: e.target.value })}
                        className="w-full form-input-custom px-3 py-2.5 text-sm rounded-lg text-white bg-dark-bg cursor-pointer"
                      >
                        <option value="">Select a vehicle...</option>
                        {availableVehiclesList.map(v => (
                          <option key={v.id} value={v.id}>
                            {v.name} ({v.registrationNumber}) • Cap: {v.maxLoadCapacity.toLocaleString()} kg
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              )}

              {/* Step 3: Choose Driver */}
              {wizardStep === 3 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-1.5">
                    <User size={16} className="text-brand-primary" />
                    <span>Assign Available Driver</span>
                  </h4>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">CHOOSE OPERATOR</label>
                    {availableDriversList.length === 0 ? (
                      <div className="text-xs text-brand-danger border border-red-500/20 bg-red-500/5 p-3 rounded-lg flex items-center gap-2">
                        <AlertTriangle size={14} />
                        <span>No drivers currently AVAILABLE. All active on routes.</span>
                      </div>
                    ) : (
                      <select
                        value={wizardFields.driverId}
                        onChange={(e) => setWizardFields({ ...wizardFields, driverId: e.target.value })}
                        className="w-full form-input-custom px-3 py-2.5 text-sm rounded-lg text-white bg-dark-bg cursor-pointer"
                      >
                        <option value="">Select a driver...</option>
                        {availableDriversList.map(d => (
                          <option key={d.id} value={d.id}>
                            {d.name} (Score: {d.safetyScore} • Expiry: {d.licenseExpiry})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              )}

              {/* Step 4: Cargo & Distance */}
              {wizardStep === 4 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-1.5">
                    <Scale size={16} className="text-brand-primary" />
                    <span>Cargo Weight & Planned Distance</span>
                  </h4>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">CARGO WEIGHT (kg)</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={wizardFields.cargoWeight}
                      onChange={(e) => setWizardFields({ ...wizardFields, cargoWeight: e.target.value })}
                      className="w-full form-input-custom px-3 py-2 text-sm rounded-lg text-white"
                      placeholder="e.g. 18500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">PLANNED DISTANCE (km)</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={wizardFields.plannedDistance}
                      onChange={(e) => setWizardFields({ ...wizardFields, plannedDistance: e.target.value })}
                      className="w-full form-input-custom px-3 py-2 text-sm rounded-lg text-white"
                      placeholder="e.g. 385"
                    />
                  </div>
                </div>
              )}

              {/* Step 5: Summary & Validation Dispatch Action */}
              {wizardStep === 5 && (
                <div className="space-y-4 text-sm">
                  <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-1.5">
                    <CheckCircle2 size={16} className="text-brand-success" />
                    <span>Verify Dispatch Information</span>
                  </h4>
                  <div className="bg-dark-bg/40 border border-dark-border/40 rounded-xl p-4 space-y-2.5 text-xs text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Route:</span>
                      <span className="font-semibold text-white">{wizardFields.source} → {wizardFields.destination}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Vehicle:</span>
                      <span className="text-white">{getVehicleLabel(wizardFields.vehicleId)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Driver:</span>
                      <span className="text-white">{getDriverLabel(wizardFields.driverId)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Cargo Load:</span>
                      <span className="text-white font-semibold">{Number(wizardFields.cargoWeight).toLocaleString()} kg</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Planned Distance:</span>
                      <span className="text-white font-semibold">{wizardFields.plannedDistance} km</span>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-500 leading-relaxed bg-dark-bg/20 p-3 rounded-lg border border-dark-border/25">
                    <strong>Business Policy Rules applied on Dispatch:</strong>
                    <ul className="list-disc pl-4 mt-1.5 space-y-1">
                      <li>Active verification of driver license expiry dates.</li>
                      <li>Validation of cargo weight against maximum load limits.</li>
                      <li>Updates vehicle & driver states immediately on dispatch.</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions Footer */}
            <div className="flex justify-between items-center px-6 py-4 border-t border-dark-border bg-dark-surface/20">
              {wizardStep > 1 ? (
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="flex items-center gap-1 px-4 py-2 border border-dark-border text-slate-300 hover:bg-dark-surface rounded-xl text-xs font-semibold transition-all cursor-pointer"
                >
                  <ChevronLeft size={14} />
                  <span>Previous</span>
                </button>
              ) : (
                <div></div>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsWizardOpen(false)}
                  className="px-4 py-2 border border-dark-border text-slate-300 hover:bg-dark-surface rounded-xl text-xs font-semibold transition-all cursor-pointer"
                >
                  Cancel
                </button>

                {wizardStep < 5 ? (
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="flex items-center gap-1 px-5 py-2 bg-brand-primary hover:bg-brand-primary-light text-white rounded-xl text-xs font-semibold transition-all cursor-pointer"
                  >
                    <span>Next Step</span>
                    <ChevronRight size={14} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleDispatchAction}
                    className="flex items-center gap-1 px-5 py-2 bg-brand-success hover:bg-emerald-400 text-white rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-lg shadow-brand-success/20"
                  >
                    <Compass size={14} />
                    <span>Validate & Dispatch</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Complete Trip Modal */}
      {isCompleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md glass-panel rounded-2xl shadow-2xl overflow-hidden border border-dark-border">
            <div className="absolute top-0 left-0 w-full h-[3px] bg-brand-success"></div>
            
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-dark-border bg-dark-surface/40">
              <h3 className="text-lg font-bold text-white">Log Route Completion</h3>
              <button
                onClick={() => setIsCompleteModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-dark-surface rounded-lg transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCompleteSubmit} className="p-6 space-y-4">
              {completeError && (
                <div className="flex items-center gap-2 p-3.5 rounded-lg bg-red-500/10 border border-red-500/20 text-brand-danger text-xs">
                  <AlertTriangle size={16} className="shrink-0" />
                  <span>{completeError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Final Odometer Reading (km)</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={completeOdo}
                  onChange={(e) => setCompleteOdo(e.target.value)}
                  className="w-full form-input-custom px-3 py-2 text-sm rounded-lg text-white"
                  placeholder="e.g. 125800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Fuel Used (Litres)</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={completeFuel}
                  onChange={(e) => setCompleteFuel(e.target.value)}
                  className="w-full form-input-custom px-3 py-2 text-sm rounded-lg text-white"
                  placeholder="e.g. 95"
                />
              </div>

              <div className="text-[11px] text-slate-500 italic bg-dark-bg/25 border border-dark-border/40 p-3 rounded-lg leading-relaxed">
                Completing the trip updates the vehicle's odometer, changes the driver and vehicle status back to AVAILABLE, and automatically logs fuel refill costs.
              </div>

              {/* Actions Footer */}
              <div className="flex justify-end gap-3 pt-4 border-t border-dark-border mt-6">
                <button
                  type="button"
                  onClick={() => setIsCompleteModalOpen(false)}
                  className="px-4 py-2 border border-dark-border text-slate-300 hover:bg-dark-surface rounded-xl text-sm font-semibold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand-success hover:bg-emerald-400 text-white rounded-xl text-sm font-semibold transition-all cursor-pointer shadow-lg shadow-brand-success/20"
                >
                  Confirm Completion
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
