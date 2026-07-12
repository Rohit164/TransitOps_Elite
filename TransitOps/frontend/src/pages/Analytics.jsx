import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";
import { Download, BarChart2, TrendingUp, AlertTriangle, ShieldCheck, Lock } from "lucide-react";

export default function Analytics() {
  const { user } = useAuth();
  const canExport = user?.role === "FLEET_MANAGER" || user?.role === "FINANCIAL_ANALYST";

  const [reports, setReports] = useState({
    fuelEfficiency: "0.00",
    monthlyUsage: [],
    topCostVehicles: [],
    vehicleROI: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api.getReports();
      setReports(data);
    } catch (err) {
      setError(err.message || "Failed to compile analytical data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleExport = async (type) => {
    if (!canExport) return;
    setExporting(type);
    try {
      await api.exportData(type);
    } catch (err) {
      alert(`Export failed: ${err.message}`);
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="p-8 space-y-8">
      {/* Title */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight m-0">Analytics & Reports</h1>
          <p className="text-slate-400 text-sm mt-1">Operational fuel metrics, ROI indexes, and cost aggregates.</p>
        </div>

        {/* Export Buttons Panel */}
        <div className="flex items-center gap-3">
          {canExport ? (
            <>
              <button
                onClick={() => handleExport("vehicles")}
                disabled={exporting !== null}
                className="flex items-center gap-2 px-4 py-2 border border-dark-border bg-dark-surface hover:bg-dark-surface-hover text-slate-300 rounded-xl text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
              >
                <Download size={14} />
                <span>{exporting === "vehicles" ? "Exporting..." : "Export Fleet CSV"}</span>
              </button>
              <button
                onClick={() => handleExport("trips")}
                disabled={exporting !== null}
                className="flex items-center gap-2 px-4 py-2 border border-dark-border bg-dark-surface hover:bg-dark-surface-hover text-slate-300 rounded-xl text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
              >
                <Download size={14} />
                <span>{exporting === "trips" ? "Exporting..." : "Export Trips CSV"}</span>
              </button>
              <button
                onClick={() => handleExport("expenses")}
                disabled={exporting !== null}
                className="flex items-center gap-2 px-4 py-2 border border-dark-border bg-dark-surface hover:bg-dark-surface-hover text-slate-300 rounded-xl text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
              >
                <Download size={14} />
                <span>{exporting === "expenses" ? "Exporting..." : "Export Ledger CSV"}</span>
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2 px-4 py-2 border border-dashed border-dark-border text-slate-500 rounded-xl text-xs font-semibold">
              <Lock size={12} />
              <span>Data Export Locked</span>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-brand-danger text-sm">
          {error}
        </div>
      )}

      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-6 rounded-2xl flex items-center justify-between border border-dark-border shadow-lg">
          <div className="space-y-1">
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Avg Fuel Efficiency</span>
            <h2 className="text-3xl font-extrabold text-white">{reports.fuelEfficiency} <span className="text-sm font-normal text-slate-400">km / L</span></h2>
          </div>
          <div className="p-3 bg-brand-secondary/10 border border-brand-secondary/30 rounded-xl text-brand-secondary">
            <TrendingUp size={24} />
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl flex items-center justify-between border border-dark-border shadow-lg">
          <div className="space-y-1">
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Export Scope Access</span>
            <h2 className="text-lg font-bold text-white mt-1">
              {canExport ? "AUTHORIZED" : "READ ONLY"}
            </h2>
          </div>
          <div className={`p-3 rounded-xl border ${canExport ? "bg-emerald-500/10 border-emerald-500/30 text-brand-success" : "bg-red-500/10 border-red-500/30 text-brand-danger"}`}>
            {canExport ? <ShieldCheck size={24} /> : <Lock size={24} />}
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl flex items-center justify-between border border-dark-border shadow-lg">
          <div className="space-y-1">
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Analytics Compile</span>
            <h2 className="text-lg font-bold text-white mt-1">REAL-TIME TELEMETRY</h2>
          </div>
          <div className="p-3 bg-brand-primary/10 border border-brand-primary/30 rounded-xl text-brand-primary">
            <BarChart2 size={24} />
          </div>
        </div>
      </div>

      {/* Recharts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Line Chart: Monthly Usage */}
        <div className="glass-panel p-6 rounded-2xl border border-dark-border shadow-lg">
          <h3 className="text-md font-bold text-white mb-6">Fleet Monthly Mileage (km)</h3>
          <div className="h-72">
            {loading ? (
              <div className="h-full flex items-center justify-center text-slate-400">Loading charts...</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={reports.monthlyUsage} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222a3d" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} />
                  <Tooltip contentStyle={{ backgroundColor: "#131722", borderColor: "#222a3d", color: "#f3f4f6" }} />
                  <Legend fontSize={11} />
                  <Line type="monotone" dataKey="distance" name="Odometer (km)" stroke="#8b5cf6" strokeWidth={3} activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Bar Chart: Top Cost Vehicles */}
        <div className="glass-panel p-6 rounded-2xl border border-dark-border shadow-lg">
          <h3 className="text-md font-bold text-white mb-6">Top Fleet Cost Accumulators ($)</h3>
          <div className="h-72">
            {loading ? (
              <div className="h-full flex items-center justify-center text-slate-400">Loading charts...</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={reports.topCostVehicles} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222a3d" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} />
                  <Tooltip contentStyle={{ backgroundColor: "#131722", borderColor: "#222a3d", color: "#f3f4f6" }} />
                  <Legend fontSize={11} />
                  <Bar dataKey="amount" name="Accrued Cost ($)" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* ROI & Profit Table */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-dark-border shadow-lg">
        <div className="p-6 border-b border-dark-border bg-dark-surface/30">
          <h3 className="text-md font-bold text-white m-0">Operational Return on Investment (ROI) per Vehicle</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-dark-border bg-dark-bg/20 text-slate-400 text-xs font-bold uppercase tracking-wider">
                <th className="py-4 px-6">Vehicle</th>
                <th className="py-4 px-6">Plate Number</th>
                <th className="py-4 px-6">Est. Revenue</th>
                <th className="py-4 px-6">Direct Costs</th>
                <th className="py-4 px-6">Net Margin</th>
                <th className="py-4 px-6">ROI Percentage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-border/40 text-sm">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400">
                    Computing general ledger returns...
                  </td>
                </tr>
              ) : reports.vehicleROI.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-500">
                    No active ROI telemetry.
                  </td>
                </tr>
              ) : (
                reports.vehicleROI.map((v) => (
                  <tr key={v.vehicleId} className="hover:bg-dark-surface/30 transition-colors">
                    <td className="py-4 px-6 font-semibold text-white">
                      {v.name}
                    </td>
                    <td className="py-4 px-6 font-mono text-slate-300">
                      {v.registrationNumber}
                    </td>
                    <td className="py-4 px-6 text-slate-300">
                      ${v.revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-4 px-6 text-brand-danger">
                      -${v.cost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className={`py-4 px-6 font-semibold ${v.profit >= 0 ? "text-brand-success" : "text-brand-danger"}`}>
                      ${v.profit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-2.5 py-1 rounded text-xs font-bold ${
                        v.roi >= 10 ? "bg-emerald-500/10 text-brand-success border border-emerald-500/20" :
                        v.roi >= 0 ? "bg-amber-500/10 text-brand-warning border border-brand-warning/20" :
                        "bg-red-500/10 text-brand-danger border border-red-500/20"
                      }`}>
                        {v.roi}%
                      </span>
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
