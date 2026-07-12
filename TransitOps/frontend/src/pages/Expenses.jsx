import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import {
  DollarSign,
  TrendingUp,
  Receipt,
  Plus,
  AlertTriangle,
  Info,
  Calendar,
  Layers
} from "lucide-react";

export default function Expenses() {
  const { user } = useAuth();
  const isAnalyst = user?.role === "FINANCIAL_ANALYST";

  const [expenses, setExpenses] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [stats, setStats] = useState({
    totalOperationalCost: 0,
    totalFuelCost: 0,
    costPerVehicle: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Form State
  const [formFields, setFormFields] = useState({
    vehicleId: "",
    type: "FUEL",
    amount: "",
    litres: "",
    date: new Date().toISOString().split("T")[0],
    description: ""
  });
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [expensesData, statsData, vehiclesData] = await Promise.all([
        api.getExpenses(),
        api.getExpenseStats(),
        api.getVehicles()
      ]);
      setExpenses(expensesData);
      setStats(statsData);
      setVehicles(vehiclesData);
    } catch (err) {
      setError(err.message || "Failed to load financial data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess(false);

    // Validate litres if FUEL
    if (formFields.type === "FUEL" && (!formFields.litres || Number(formFields.litres) <= 0)) {
      setFormError("Litres are required and must be greater than zero for fuel expenses.");
      return;
    }

    const payload = {
      ...formFields,
      amount: Number(formFields.amount),
      litres: formFields.type === "FUEL" ? Number(formFields.litres) : 0
    };

    try {
      await api.createExpense(payload);
      setFormSuccess(true);
      // Reset form
      setFormFields({
        vehicleId: "",
        type: "FUEL",
        amount: "",
        litres: "",
        date: new Date().toISOString().split("T")[0],
        description: ""
      });
      // Reload stats and table
      loadData();
      // Hide success message after 3 seconds
      setTimeout(() => setFormSuccess(false), 3000);
    } catch (err) {
      setFormError(err.message || "Failed to log expense");
    }
  };

  const getVehicleLabel = (vId) => {
    const v = vehicles.find(x => x.id === vId);
    return v ? `${v.name} (${v.registrationNumber})` : "N/A";
  };

  return (
    <div className="p-8 space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight m-0">Fuel & Expenses</h1>
        <p className="text-slate-400 text-sm mt-1">
          {isAnalyst
            ? "Log transactions, record fuel entries, and track vehicle operational costs."
            : "Read-only access to operational costs and logs."}
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-brand-danger text-sm">
          {error}
        </div>
      )}

      {/* KPI Stats Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-panel p-6 rounded-2xl flex items-center justify-between border border-dark-border shadow-lg">
          <div className="space-y-1">
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Total Operational Cost</span>
            <h2 className="text-3xl font-extrabold text-white">${stats.totalOperationalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
          </div>
          <div className="p-3 bg-brand-primary/10 border border-brand-primary/30 rounded-xl text-brand-primary">
            <DollarSign size={24} />
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl flex items-center justify-between border border-dark-border shadow-lg">
          <div className="space-y-1">
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Total Fuel Costs</span>
            <h2 className="text-3xl font-extrabold text-white">${stats.totalFuelCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
          </div>
          <div className="p-3 bg-brand-secondary/10 border border-brand-secondary/30 rounded-xl text-brand-secondary">
            <TrendingUp size={24} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side: Expense Logs & Vehicle Cost Breakdown */}
        <div className="lg:col-span-2 space-y-6">
          {/* Logs */}
          <div className="glass-panel rounded-2xl border border-dark-border shadow-lg overflow-hidden">
            <div className="p-6 border-b border-dark-border bg-dark-surface/30">
              <h3 className="text-md font-bold text-white m-0">Transaction Log</h3>
            </div>
            <div className="overflow-x-auto max-h-[350px] overflow-y-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-dark-border bg-dark-bg/20 text-slate-400 text-xs font-bold uppercase tracking-wider sticky top-0 z-10">
                    <th className="py-3.5 px-6">Vehicle</th>
                    <th className="py-3.5 px-6">Category</th>
                    <th className="py-3.5 px-6">Details</th>
                    <th className="py-3.5 px-6 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-border/40 text-sm">
                  {loading ? (
                    <tr>
                      <td colSpan="4" className="py-8 text-center text-slate-400">
                        <div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-brand-primary border-t-transparent mr-2 align-middle"></div>
                        Fetching ledger...
                      </td>
                    </tr>
                  ) : expenses.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="py-8 text-center text-slate-500">
                        No transactions logged.
                      </td>
                    </tr>
                  ) : (
                    expenses.map((e) => (
                      <tr key={e.id} className="hover:bg-dark-surface/30 transition-colors">
                        <td className="py-3 px-6 text-slate-300">
                          {getVehicleLabel(e.vehicleId)}
                        </td>
                        <td className="py-3 px-6">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${
                            e.type === "FUEL" ? "bg-cyan-500/10 text-brand-secondary border-cyan-500/20" :
                            e.type === "REPAIR" || e.type === "MAINTENANCE" ? "bg-red-500/10 text-brand-danger border-red-500/20" :
                            "bg-slate-500/10 text-slate-400 border-slate-500/20"
                          }`}>
                            {e.type}
                          </span>
                        </td>
                        <td className="py-3 px-6 text-xs">
                          <div className="text-slate-300 font-semibold">{e.description}</div>
                          <div className="text-slate-500 mt-0.5">{e.date} {e.litres > 0 && `• ${e.litres} Litres`}</div>
                        </td>
                        <td className="py-3 px-6 text-right font-semibold text-white">
                          ${e.amount.toFixed(2)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Cost per vehicle breakdown list */}
          <div className="glass-panel rounded-2xl border border-dark-border shadow-lg p-6">
            <h3 className="text-md font-bold text-white mb-4">Operational Cost per Vehicle</h3>
            <div className="space-y-3 max-h-[200px] overflow-y-auto pr-2">
              {stats.costPerVehicle.map((v) => (
                <div key={v.vehicleId} className="flex justify-between items-center text-sm p-3 rounded-xl bg-dark-bg/40 border border-dark-border/40 hover:border-brand-primary/30 transition-colors">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white">{v.name}</span>
                    <span className="text-xs font-mono text-slate-500">({v.registrationNumber})</span>
                  </div>
                  <span className="font-bold text-brand-primary">${v.cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Create Expense Form (Only for Financial Analyst) */}
        <div>
          {isAnalyst ? (
            <div className="glass-panel rounded-2xl border border-dark-border shadow-lg p-6 sticky top-24">
              <h3 className="text-md font-bold text-white mb-5 flex items-center gap-2 border-b border-dark-border pb-4">
                <Receipt size={18} className="text-brand-primary" />
                <span>Log New Transaction</span>
              </h3>

              {formSuccess && (
                <div className="p-3.5 mb-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-brand-success text-xs font-semibold">
                  Expense registered and added to general ledger.
                </div>
              )}

              {formError && (
                <div className="flex items-center gap-2 p-3.5 mb-4 rounded-lg bg-red-500/10 border border-red-500/20 text-brand-danger text-xs">
                  <AlertTriangle size={16} className="shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-400 mb-1.5 uppercase">Select Vehicle</label>
                  <select
                    required
                    value={formFields.vehicleId}
                    onChange={(e) => setFormFields({ ...formFields, vehicleId: e.target.value })}
                    className="w-full form-input-custom px-3 py-2 text-sm rounded-lg text-white bg-dark-bg cursor-pointer"
                  >
                    <option value="">Select a vehicle...</option>
                    {vehicles.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.name} ({v.registrationNumber})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-400 mb-1.5 uppercase">Expense Type</label>
                    <select
                      value={formFields.type}
                      onChange={(e) => setFormFields({ ...formFields, type: e.target.value })}
                      className="w-full form-input-custom px-3 py-2 text-sm rounded-lg text-white bg-dark-bg cursor-pointer"
                    >
                      <option value="FUEL">Fuel</option>
                      <option value="TOLL">Toll</option>
                      <option value="PARKING">Parking</option>
                      <option value="REPAIR">Repair</option>
                      <option value="MAINTENANCE">Maintenance</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-400 mb-1.5 uppercase">Amount ($)</label>
                    <input
                      type="number"
                      required
                      min="0.01"
                      step="0.01"
                      value={formFields.amount}
                      onChange={(e) => setFormFields({ ...formFields, amount: e.target.value })}
                      className="w-full form-input-custom px-3 py-2 text-sm rounded-lg text-white"
                      placeholder="285.50"
                    />
                  </div>
                </div>

                {formFields.type === "FUEL" && (
                  <div>
                    <label className="block font-semibold text-slate-400 mb-1.5 uppercase">Fuel Litres</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={formFields.litres}
                      onChange={(e) => setFormFields({ ...formFields, litres: e.target.value })}
                      className="w-full form-input-custom px-3 py-2 text-sm rounded-lg text-white"
                      placeholder="95"
                    />
                  </div>
                )}

                <div>
                  <label className="block font-semibold text-slate-400 mb-1.5 uppercase">Transaction Date</label>
                  <input
                    type="date"
                    required
                    value={formFields.date}
                    onChange={(e) => setFormFields({ ...formFields, date: e.target.value })}
                    className="w-full form-input-custom px-3 py-2 text-sm rounded-lg text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-400 mb-1.5 uppercase">Description</label>
                  <textarea
                    required
                    rows="3"
                    value={formFields.description}
                    onChange={(e) => setFormFields({ ...formFields, description: e.target.value })}
                    className="w-full form-input-custom px-3 py-2 text-sm rounded-lg text-white resize-none"
                    placeholder="Refuel for Boston trip route..."
                  />
                </div>

                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 py-3 mt-4 rounded-lg bg-brand-primary text-white font-semibold text-xs hover:bg-brand-primary-light active:scale-[0.99] transition-all cursor-pointer shadow-lg shadow-brand-primary/20"
                >
                  <Plus size={14} />
                  <span>Register Expense</span>
                </button>
              </form>
            </div>
          ) : (
            <div className="glass-panel rounded-2xl border border-dark-border shadow-lg p-6 text-center text-slate-400">
              <Lock size={32} className="mx-auto text-brand-primary mb-3 opacity-65" />
              <h4 className="font-bold text-white text-sm mb-1">Creation Blocked</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Only user accounts with <span className="text-brand-primary font-semibold">FINANCIAL ANALYST</span> access rights can log new transactions or refuels.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
