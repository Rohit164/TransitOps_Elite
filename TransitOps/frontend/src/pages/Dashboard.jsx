import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import {
  Truck,
  Compass,
  AlertTriangle,
  Users,
  Percent,
  Search,
  RefreshCw,
  Eye
} from "lucide-react";

export default function Dashboard() {
  const [kpis, setKpis] = useState({
    activeVehicles: 0,
    availableVehicles: 0,
    inMaintenance: 0,
    activeTrips: 0,
    pendingTrips: 0,
    driversOnDuty: 0,
    fleetUtilization: 0
  });
  const [trips, setTrips] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [kpiRes, tripsRes, vehiclesRes, driversRes] = await Promise.all([
        api.getKpis(),
        api.getTrips(),
        api.getVehicles(),
        api.getDrivers()
      ]);
      setKpis(kpiRes);
      setTrips(tripsRes);
      setVehicles(vehiclesRes);
      setDrivers(driversRes);
    } catch (err) {
      setError(err.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const getVehicleReg = (vId) => {
    const v = vehicles.find(x => x.id === vId);
    return v ? `${v.name} (${v.registrationNumber})` : "Unknown Vehicle";
  };

  const getDriverName = (dId) => {
    const d = drivers.find(x => x.id === dId);
    return d ? d.name : "Unknown Driver";
  };

  const filteredTrips = trips.filter(trip => {
    const vReg = getVehicleReg(trip.vehicleId).toLowerCase();
    const dName = getDriverName(trip.driverId).toLowerCase();
    const src = trip.source.toLowerCase();
    const dest = trip.destination.toLowerCase();
    const query = search.toLowerCase();

    const matchesSearch =
      vReg.includes(query) ||
      dName.includes(query) ||
      src.includes(query) ||
      dest.includes(query);

    const matchesStatus = statusFilter === "ALL" || trip.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "COMPLETED":
        return "bg-emerald-500/10 text-brand-success border-emerald-500/20";
      case "DISPATCHED":
        return "bg-cyan-500/10 text-brand-secondary border-cyan-500/20";
      case "PENDING":
        return "bg-amber-500/10 text-brand-warning border-amber-500/20";
      default:
        return "bg-slate-500/10 text-slate-400 border-slate-500/20";
    }
  };

  return (
    <div className="space-y-8 p-8">
      {/* Upper header section */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight m-0">Operations Overview</h1>
          <p className="text-slate-400 text-sm mt-1">Real-time status updates and telemetry feeds.</p>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-dark-surface hover:bg-dark-surface-hover text-slate-300 rounded-xl border border-dark-border text-sm font-semibold transition-all cursor-pointer active:scale-95 disabled:opacity-50"
        >
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          <span>Refresh Data</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-brand-danger text-sm">
          {error}
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Fleet Utilization Card */}
        <div className="glass-panel p-6 rounded-2xl relative overflow-hidden flex flex-col justify-between h-36">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Percent size={80} className="text-brand-primary" />
          </div>
          <div>
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Fleet Utilization</span>
            <h3 className="text-3xl font-extrabold text-white mt-1">{kpis.fleetUtilization}%</h3>
          </div>
          <div className="w-full bg-dark-border rounded-full h-1.5 mt-2">
            <div
              className="bg-brand-primary h-1.5 rounded-full transition-all duration-1000"
              style={{ width: `${kpis.fleetUtilization}%` }}
            ></div>
          </div>
        </div>

        {/* Active Vehicles Card */}
        <div className="glass-panel p-6 rounded-2xl relative overflow-hidden flex flex-col justify-between h-36">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Truck size={80} className="text-brand-secondary" />
          </div>
          <div>
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Active Fleet Status</span>
            <h3 className="text-3xl font-extrabold text-white mt-1">
              {kpis.activeVehicles} <span className="text-sm font-semibold text-slate-400">/ {kpis.availableVehicles + kpis.activeVehicles + kpis.inMaintenance} total</span>
            </h3>
          </div>
          <div className="flex justify-between text-xs text-slate-400">
            <span>Available: {kpis.availableVehicles}</span>
            <span>In Shop: {kpis.inMaintenance}</span>
          </div>
        </div>

        {/* Active Trips Card */}
        <div className="glass-panel p-6 rounded-2xl relative overflow-hidden flex flex-col justify-between h-36">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Compass size={80} className="text-brand-success" />
          </div>
          <div>
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Active Cargo Trips</span>
            <h3 className="text-3xl font-extrabold text-white mt-1">{kpis.activeTrips}</h3>
          </div>
          <div className="text-xs text-slate-400">
            Pending Dispatch: <span className="text-brand-warning font-semibold">{kpis.pendingTrips}</span>
          </div>
        </div>

        {/* Drivers On Duty Card */}
        <div className="glass-panel p-6 rounded-2xl relative overflow-hidden flex flex-col justify-between h-36">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Users size={80} className="text-brand-warning" />
          </div>
          <div>
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Drivers on Duty</span>
            <h3 className="text-3xl font-extrabold text-white mt-1">{kpis.driversOnDuty}</h3>
          </div>
          <div className="text-xs text-slate-400">
            On active dispatch routes
          </div>
        </div>
      </div>

      {/* Interactive Controls & Recent Trips Widget */}
      <div className="glass-panel rounded-2xl overflow-hidden shadow-lg border border-dark-border">
        {/* Card Header with Filters */}
        <div className="p-6 border-b border-dark-border bg-dark-surface/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h3 className="text-lg font-bold text-white m-0">Recent Trips</h3>
          
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
                placeholder="Search trip details..."
                className="pl-10 pr-4 py-2 text-xs rounded-xl form-input-custom text-white w-60"
              />
            </div>

            {/* Status Dropdown */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 text-xs rounded-xl form-input-custom text-white bg-dark-bg cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="DISPATCHED">Dispatched</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>
        </div>

        {/* Trips Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-dark-border bg-dark-bg/20 text-slate-400 text-xs font-bold uppercase tracking-wider">
                <th className="py-4 px-6">Route</th>
                <th className="py-4 px-6">Vehicle</th>
                <th className="py-4 px-6">Driver</th>
                <th className="py-4 px-6">Cargo & Distance</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6">Timestamps</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-border/40 text-sm">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400">
                    <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-brand-primary border-t-transparent mr-2 align-middle"></div>
                    Fetching logs...
                  </td>
                </tr>
              ) : filteredTrips.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-500">
                    No matching trip logs found.
                  </td>
                </tr>
              ) : (
                filteredTrips.map((trip) => (
                  <tr key={trip.id} className="hover:bg-dark-surface/30 transition-colors">
                    <td className="py-4 px-6 font-semibold text-white">
                      {trip.source} <span className="text-slate-500 font-normal">→</span> {trip.destination}
                    </td>
                    <td className="py-4 px-6 text-slate-300">
                      {getVehicleReg(trip.vehicleId)}
                    </td>
                    <td className="py-4 px-6 text-slate-300">
                      {getDriverName(trip.driverId)}
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-slate-300 font-semibold">{trip.cargoWeight.toLocaleString()} kg</div>
                      <div className="text-xs text-slate-500">{trip.plannedDistance} km planned</div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-2.5 py-1 rounded-full border text-xs font-bold tracking-wide ${getStatusBadgeClass(trip.status)}`}>
                        {trip.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-400">
                      {trip.dispatchDate ? (
                        <div>Dispatched: {new Date(trip.dispatchDate).toLocaleString()}</div>
                      ) : (
                        <div className="italic text-slate-600">Not dispatched yet</div>
                      )}
                      {trip.completionDate && (
                        <div className="text-brand-success">Completed: {new Date(trip.completionDate).toLocaleString()}</div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
