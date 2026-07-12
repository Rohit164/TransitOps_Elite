import axios from "axios";
import { mockDb } from "./mockDb";

const API_BASE_URL = "http://localhost:3000";

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 5000,
});

// Request interceptor to attach JWT token
client.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("transitops_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Helper to check if error is a network connection failure
const isNetworkError = (error) => {
  return !error.response && (error.code === "ERR_NETWORK" || error.message.includes("Network Error") || error.code === "ECONNABORTED");
};

// Generic handler that wraps requests and falls back to mockDb if network fails
const handleCall = async (apiCallFn, mockDbFn) => {
  try {
    const response = await apiCallFn();
    return response.data;
  } catch (error) {
    if (isNetworkError(error)) {
      console.warn("Backend server offline. Falling back to local Mock Database.");
      return mockDbFn();
    }
    // For normal API errors (400, 401, 403, 404, 500), propagate the error response
    if (error.response && error.response.data) {
      throw new Error(error.response.data.message || error.response.data.error || "API Error");
    }
    throw error;
  }
};

export const api = {
  // Auth
  login: async (email, password) => {
    return handleCall(
      () => client.post("/api/auth/login", { email, password }),
      () => mockDb.login(email, password)
    );
  },

  // Fleet
  getVehicles: async (status, search) => {
    const params = {};
    if (status) params.status = status;
    if (search) params.search = search;
    return handleCall(
      () => client.get("/api/fleet", { params }),
      () => mockDb.getVehicles(status, search)
    );
  },

  createVehicle: async (vehicleData) => {
    return handleCall(
      () => client.post("/api/fleet", vehicleData),
      () => mockDb.createVehicle(vehicleData)
    );
  },

  updateVehicle: async (id, vehicleData) => {
    return handleCall(
      () => client.put(`/api/fleet/${id}`, vehicleData),
      () => mockDb.updateVehicle(id, vehicleData)
    );
  },

  deleteVehicle: async (id) => {
    return handleCall(
      () => client.delete(`/api/fleet/${id}`),
      () => mockDb.deleteVehicle(id)
    );
  },

  // Drivers
  getDrivers: async (status, search) => {
    const params = {};
    if (status) params.status = status;
    if (search) params.search = search;
    return handleCall(
      () => client.get("/api/drivers", { params }),
      () => mockDb.getDrivers(status, search)
    );
  },

  createDriver: async (driverData) => {
    return handleCall(
      () => client.post("/api/drivers", driverData),
      () => mockDb.createDriver(driverData)
    );
  },

  updateDriver: async (id, driverData) => {
    return handleCall(
      () => client.put(`/api/drivers/${id}`, driverData),
      () => mockDb.updateDriver(id, driverData)
    );
  },

  // Trips
  getTrips: async () => {
    return handleCall(
      () => client.get("/api/trips"),
      () => mockDb.getTrips()
    );
  },

  createTrip: async (tripData) => {
    return handleCall(
      () => client.post("/api/trips", tripData),
      () => mockDb.createTrip(tripData)
    );
  },

  dispatchTrip: async (id) => {
    return handleCall(
      () => client.post(`/api/trips/${id}/dispatch`),
      () => mockDb.dispatchTrip(id)
    );
  },

  completeTrip: async (id, completeData) => {
    return handleCall(
      () => client.post(`/api/trips/${id}/complete`, completeData),
      () => mockDb.completeTrip(id, completeData)
    );
  },

  // Maintenance
  getMaintenance: async () => {
    return handleCall(
      () => client.get("/api/maintenance"),
      () => mockDb.getMaintenance()
    );
  },

  createMaintenance: async (maintData) => {
    return handleCall(
      () => client.post("/api/maintenance", maintData),
      () => mockDb.createMaintenance(maintData)
    );
  },

  completeMaintenance: async (id, completeData) => {
    return handleCall(
      () => client.post(`/api/maintenance/${id}/complete`, completeData),
      () => mockDb.completeMaintenance(id, completeData)
    );
  },

  // Expenses
  getExpenses: async () => {
    return handleCall(
      () => client.get("/api/expenses"),
      () => mockDb.getExpenses()
    );
  },

  getExpenseStats: async () => {
    return handleCall(
      () => client.get("/api/expenses/stats"),
      () => mockDb.getExpenseStats()
    );
  },

  createExpense: async (expenseData) => {
    return handleCall(
      () => client.post("/api/expenses", expenseData),
      () => mockDb.createExpense(expenseData)
    );
  },

  // Analytics
  getKpis: async () => {
    return handleCall(
      () => client.get("/api/analytics/kpis"),
      () => mockDb.getKpis()
    );
  },

  getReports: async () => {
    return handleCall(
      () => client.get("/api/analytics/reports"),
      () => mockDb.getReports()
    );
  },

  exportData: async (type) => {
    try {
      // Try hitting the actual backend
      const response = await client.get(`/api/analytics/export`, {
        params: { type },
        responseType: "blob"
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `transitops-${type}-report.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      return { success: true };
    } catch (error) {
      if (isNetworkError(error)) {
        console.warn("Backend offline. Generating CSV in memory from Mock DB.");
        let dataToExport = [];
        let headers = [];

        if (type === "vehicles") {
          dataToExport = mockDb.getVehicles();
          headers = ["id", "registrationNumber", "name", "type", "maxLoadCapacity", "acquisitionCost", "currentOdometer", "status"];
        } else if (type === "trips") {
          dataToExport = mockDb.getTrips();
          headers = ["id", "source", "destination", "vehicleId", "driverId", "cargoWeight", "plannedDistance", "status", "fuelUsed", "finalOdometer", "dispatchDate", "completionDate"];
        } else if (type === "expenses") {
          dataToExport = mockDb.getExpenses();
          headers = ["id", "vehicleId", "type", "amount", "litres", "date", "description"];
        } else {
          throw new Error("Invalid export type");
        }

        // Create CSV string
        const csvContent = [
          headers.join(","),
          ...dataToExport.map(row => 
            headers.map(field => {
              const val = row[field];
              return typeof val === "string" && val.includes(",") ? `"${val}"` : val ?? "";
            }).join(",")
          )
        ].join("\n");

        // Download trigger
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `transitops-${type}-mock-report.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        return { success: true };
      }
      throw error;
    }
  },

  // Settings
  getUsers: async () => {
    return handleCall(
      () => client.get("/api/settings/users"),
      () => mockDb.getUsers()
    );
  },

  createUser: async (userData) => {
    return handleCall(
      () => client.post("/api/settings/users", userData),
      () => mockDb.createUser(userData)
    );
  },

  updateUserRole: async (id, role) => {
    return handleCall(
      () => client.patch(`/api/settings/users/${id}/role`, { role }),
      () => mockDb.updateUserRole(id, role)
    );
  },

  changePassword: async (currentPassword, newPassword) => {
    // Determine user ID from token
    const token = localStorage.getItem("transitops_token");
    let userId = "u1"; // default fallback for mock
    if (token && token.startsWith("mock-jwt-token-for-")) {
      const parts = token.split("-");
      userId = parts[4]; // parts are ['mock', 'jwt', 'token', 'for', 'userId', 'role']
    }

    return handleCall(
      () => client.post("/api/settings/change-password", { currentPassword, newPassword }),
      () => mockDb.changePassword(userId, currentPassword, newPassword)
    );
  }
};
