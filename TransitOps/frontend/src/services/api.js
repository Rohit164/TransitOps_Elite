import axios from "axios";
import { mockDb } from "./mockDb";

// Empty string = use the Vite dev server's own origin.
// Vite proxy (vite.config.js) forwards all /api/* calls to http://localhost:3000
const API_BASE_URL = "";

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // Handle slower local database responses
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
    return await apiCallFn();
  } catch (error) {
    if (isNetworkError(error)) {
      console.warn("Backend server offline. Falling back to local Mock Database.");
      return mockDbFn();
    }
    // For normal API errors, propagate the error response message
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
      async () => {
        const res = await client.post("/api/auth/login", { email, password });
        return res.data; // Returns { token, data: { user } }
      },
      () => mockDb.login(email, password)
    );
  },

  signup: async (name, email, password, role) => {
    return handleCall(
      async () => {
        const res = await client.post("/api/auth/signup", { name, email, password, role });
        return res.data; // Returns { token, data: { user } }
      },
      () => mockDb.signup(name, email, password, role)
    );
  },

  // Fleet
  getVehicles: async (status, search) => {
    const params = {};
    if (status) params.status = status;
    if (search) params.search = search;
    return handleCall(
      async () => {
        const res = await client.get("/api/fleet", { params });
        return res.data.data.vehicles; // Return direct array
      },
      () => mockDb.getVehicles(status, search)
    );
  },

  createVehicle: async (vehicleData) => {
    return handleCall(
      async () => {
        const res = await client.post("/api/fleet", vehicleData);
        return res.data.data.vehicle; // Return direct object
      },
      () => mockDb.createVehicle(vehicleData)
    );
  },

  updateVehicle: async (id, vehicleData) => {
    return handleCall(
      async () => {
        const res = await client.put(`/api/fleet/${id}`, vehicleData);
        return res.data.data.vehicle; // Return direct object
      },
      () => mockDb.updateVehicle(id, vehicleData)
    );
  },

  deleteVehicle: async (id) => {
    return handleCall(
      async () => {
        const res = await client.delete(`/api/fleet/${id}`);
        return res.data.data;
      },
      () => mockDb.deleteVehicle(id)
    );
  },

  // Drivers
  getDrivers: async (status, search) => {
    const params = {};
    if (status) params.status = status;
    if (search) params.search = search;
    return handleCall(
      async () => {
        const res = await client.get("/api/drivers", { params });
        return res.data.data.drivers; // Return direct array
      },
      () => mockDb.getDrivers(status, search)
    );
  },

  createDriver: async (driverData) => {
    return handleCall(
      async () => {
        const res = await client.post("/api/drivers", driverData);
        return res.data.data.driver; // Return direct object
      },
      () => mockDb.createDriver(driverData)
    );
  },

  updateDriver: async (id, driverData) => {
    return handleCall(
      async () => {
        const res = await client.put(`/api/drivers/${id}`, driverData);
        return res.data.data.driver; // Return direct object
      },
      () => mockDb.updateDriver(id, driverData)
    );
  },

  // Trips
  getTrips: async () => {
    return handleCall(
      async () => {
        const res = await client.get("/api/trips");
        return res.data.data.trips; // Return direct array
      },
      () => mockDb.getTrips()
    );
  },

  createTrip: async (tripData) => {
    return handleCall(
      async () => {
        const res = await client.post("/api/trips", tripData);
        return res.data.data.trip; // Return direct object
      },
      () => mockDb.createTrip(tripData)
    );
  },

  dispatchTrip: async (id) => {
    return handleCall(
      async () => {
        const res = await client.post(`/api/trips/${id}/dispatch`);
        return res.data.data.trip; // Return direct object
      },
      () => mockDb.dispatchTrip(id)
    );
  },

  completeTrip: async (id, completeData) => {
    return handleCall(
      async () => {
        const res = await client.post(`/api/trips/${id}/complete`, completeData);
        return res.data.data.trip; // Return direct object
      },
      () => mockDb.completeTrip(id, completeData)
    );
  },

  // Maintenance
  getMaintenance: async () => {
    return handleCall(
      async () => {
        const res = await client.get("/api/maintenance");
        return res.data.data.records; // Return direct array
      },
      () => mockDb.getMaintenance()
    );
  },

  createMaintenance: async (maintData) => {
    return handleCall(
      async () => {
        const res = await client.post("/api/maintenance", maintData);
        return res.data.data.record; // Return direct object
      },
      () => mockDb.createMaintenance(maintData)
    );
  },

  completeMaintenance: async (id, completeData) => {
    return handleCall(
      async () => {
        const res = await client.post(`/api/maintenance/${id}/complete`, completeData);
        return res.data.data.record; // Return direct object
      },
      () => mockDb.completeMaintenance(id, completeData)
    );
  },

  // Expenses
  getExpenses: async () => {
    return handleCall(
      async () => {
        const res = await client.get("/api/expenses");
        return res.data.data.expenses; // Return direct array
      },
      () => mockDb.getExpenses()
    );
  },

  getExpenseStats: async () => {
    return handleCall(
      async () => {
        const res = await client.get("/api/expenses/stats");
        return res.data.data; // Return stats block
      },
      () => mockDb.getExpenseStats()
    );
  },

  createExpense: async (expenseData) => {
    return handleCall(
      async () => {
        const res = await client.post("/api/expenses", expenseData);
        return res.data.data.expense; // Return direct object
      },
      () => mockDb.createExpense(expenseData)
    );
  },

  // Analytics
  getKpis: async () => {
    return handleCall(
      async () => {
        const res = await client.get("/api/analytics/kpis");
        return res.data.data; // Return direct object
      },
      () => mockDb.getKpis()
    );
  },

  getReports: async () => {
    return handleCall(
      async () => {
        const res = await client.get("/api/analytics/reports");
        return res.data.data; // Return direct object
      },
      () => mockDb.getReports()
    );
  },

  exportData: async (type) => {
    try {
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
      async () => {
        const res = await client.get("/api/settings/users");
        return res.data.data.users; // Return direct array
      },
      () => mockDb.getUsers()
    );
  },

  createUser: async (userData) => {
    return handleCall(
      async () => {
        const res = await client.post("/api/settings/users", userData);
        return res.data.data.user; // Return direct object
      },
      () => mockDb.createUser(userData)
    );
  },

  updateUserRole: async (id, role) => {
    return handleCall(
      async () => {
        const res = await client.patch(`/api/settings/users/${id}/role`, { role });
        return res.data.data.user; // Return direct object
      },
      () => mockDb.updateUserRole(id, role)
    );
  },

  changePassword: async (currentPassword, newPassword) => {
    const token = localStorage.getItem("transitops_token");
    let userId = "u1"; // default fallback for mock
    if (token && token.startsWith("mock-jwt-token-for-")) {
      const parts = token.split("-");
      userId = parts[4]; // parts are ['mock', 'jwt', 'token', 'for', 'userId', 'role']
    }

    return handleCall(
      async () => {
        const res = await client.post("/api/settings/change-password", { currentPassword, newPassword });
        return res.data;
      },
      () => mockDb.changePassword(userId, currentPassword, newPassword)
    );
  }
};
