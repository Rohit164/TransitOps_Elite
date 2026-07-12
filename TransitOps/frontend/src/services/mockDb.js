// LocalStorage-based Mock Database for TransitOps ERP
// Seed data matching the requirements of the Express/PostgreSQL backend.

const SEED_USERS = [
  { id: "u1", name: "Alice Fleet", email: "fleet_manager@transitops.com", role: "FLEET_MANAGER", password: "password123" },
  { id: "u2", name: "Bob Driver", email: "driver@transitops.com", role: "DRIVER", password: "password123" },
  { id: "u3", name: "Charlie Safety", email: "safety_officer@transitops.com", role: "SAFETY_OFFICER", password: "password123" },
  { id: "u4", name: "Diana Finance", email: "financial_analyst@transitops.com", role: "FINANCIAL_ANALYST", password: "password123" }
];

const SEED_VEHICLES = [
  { id: "v1", registrationNumber: "TX-901-AB", name: "Volvo FH16 Heavy", type: "TRUCK", maxLoadCapacity: 25000, acquisitionCost: 145000, currentOdometer: 125400, status: "AVAILABLE" },
  { id: "v2", registrationNumber: "TX-405-CD", name: "Scania R500 Carrier", type: "TRUCK", maxLoadCapacity: 20000, acquisitionCost: 120000, currentOdometer: 98120, status: "AVAILABLE" },
  { id: "v3", registrationNumber: "TX-112-EF", name: "Mercedes Sprinter Cargo", type: "VAN", maxLoadCapacity: 3500, acquisitionCost: 45000, currentOdometer: 42100, status: "IN_SHOP" },
  { id: "v4", registrationNumber: "TX-883-GH", name: "DAF XF Hauler", type: "TRUCK", maxLoadCapacity: 22000, acquisitionCost: 130000, currentOdometer: 154800, status: "ON_TRIP" }
];

const SEED_DRIVERS = [
  { id: "d1", name: "John Doe", licenseNumber: "DL-908123A", licenseCategory: "Class A", licenseExpiry: "2027-12-15", contactNumber: "+1-555-0192", safetyScore: 92, status: "AVAILABLE" },
  { id: "d2", name: "Jane Smith", licenseNumber: "DL-112244B", licenseCategory: "Class A", licenseExpiry: "2028-04-10", contactNumber: "+1-555-0143", safetyScore: 96, status: "AVAILABLE" },
  { id: "d3", name: "Robert Johnson", licenseNumber: "DL-884422C", licenseCategory: "Class B", licenseExpiry: "2025-05-20", contactNumber: "+1-555-0155", safetyScore: 78, status: "AVAILABLE" }, // Expired license (current date is July 2026)
  { id: "d4", name: "Michael Williams", licenseNumber: "DL-773311D", licenseCategory: "Class A", licenseExpiry: "2027-09-30", contactNumber: "+1-555-0188", safetyScore: 89, status: "ON_TRIP" }
];

const SEED_TRIPS = [
  { id: "t1", source: "Dallas, TX", destination: "Houston, TX", vehicleId: "v4", driverId: "d4", cargoWeight: 18500, plannedDistance: 385, status: "DISPATCHED", fuelUsed: 0, finalOdometer: 0, dispatchDate: "2026-07-10T08:00:00.000Z", completionDate: null },
  { id: "t2", source: "Chicago, IL", destination: "Indianapolis, IN", vehicleId: "v1", driverId: "d1", cargoWeight: 22000, plannedDistance: 290, status: "COMPLETED", fuelUsed: 95, finalOdometer: 125400, dispatchDate: "2026-07-08T09:00:00.000Z", completionDate: "2026-07-08T15:30:00.000Z" }
];

const SEED_MAINTENANCE = [
  { id: "m1", vehicleId: "v3", description: "Brake pads replacement and engine oil service", entryDate: "2026-07-11T10:00:00.000Z", status: "IN_SHOP", serviceCost: 0, completionDate: null },
  { id: "m2", vehicleId: "v2", description: "Tire rotation and alignments", entryDate: "2026-06-15T08:00:00.000Z", status: "COMPLETED", serviceCost: 450.00, completionDate: "2026-06-16T16:00:00.000Z" }
];

const SEED_EXPENSES = [
  { id: "e1", vehicleId: "v1", type: "FUEL", amount: 285.50, litres: 95, date: "2026-07-08", description: "Fuel refill for Chicago-Indianapolis trip" },
  { id: "e2", vehicleId: "v2", type: "REPAIR", amount: 450.00, litres: 0, date: "2026-06-16", description: "Tire rotation and alignment service cost" },
  { id: "e3", vehicleId: "v1", type: "TOLL", amount: 45.00, litres: 0, date: "2026-07-08", description: "I-65 Toll charges" }
];

// Helper to load/save mock DB from LocalStorage
const getStorageItem = (key, seedData) => {
  const data = localStorage.getItem(`transitops_${key}`);
  if (!data) {
    localStorage.setItem(`transitops_${key}`, JSON.stringify(seedData));
    return seedData;
  }
  return JSON.parse(data);
};

const setStorageItem = (key, data) => {
  localStorage.setItem(`transitops_${key}`, JSON.stringify(data));
};

export const mockDb = {
  // --- AUTHENTICATION ---
  login: (email, password) => {
    const users = getStorageItem("users", SEED_USERS);
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user || user.password !== password) {
      throw new Error("Invalid email or password");
    }
    // Return mock token and user data
    return {
      token: `mock-jwt-token-for-${user.id}-${user.role}`,
      data: {
        user: { id: user.id, email: user.email, name: user.name, role: user.role }
      }
    };
  },

  signup: (name, email, password, role) => {
    const users = getStorageItem("users", SEED_USERS);
    const exists = users.some(u => u.email.toLowerCase() === email.toLowerCase());
    if (exists) {
      throw new Error("Email address already registered");
    }
    const newUser = {
      id: "u_" + Date.now(),
      name,
      email,
      role,
      password
    };
    users.push(newUser);
    setStorageItem("users", users);
    return {
      token: `mock-jwt-token-for-${newUser.id}-${newUser.role}`,
      data: {
        user: { id: newUser.id, email: newUser.email, name: newUser.name, role: newUser.role }
      }
    };
  },

  // --- VEHICLES (FLEET) ---
  getVehicles: (status, search) => {
    let list = getStorageItem("vehicles", SEED_VEHICLES);
    if (status) {
      list = list.filter(v => v.status === status);
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(v => v.registrationNumber.toLowerCase().includes(q) || v.name.toLowerCase().includes(q));
    }
    return list;
  },

  createVehicle: (vehicleData) => {
    const list = getStorageItem("vehicles", SEED_VEHICLES);
    const exists = list.some(v => v.registrationNumber.toLowerCase() === vehicleData.registrationNumber.toLowerCase());
    if (exists) {
      throw new Error(`Vehicle with registration number ${vehicleData.registrationNumber} already exists`);
    }
    const newVehicle = {
      id: "v_" + Date.now(),
      ...vehicleData,
      maxLoadCapacity: Number(vehicleData.maxLoadCapacity),
      acquisitionCost: Number(vehicleData.acquisitionCost),
      currentOdometer: Number(vehicleData.currentOdometer),
      status: vehicleData.status || "AVAILABLE"
    };
    list.push(newVehicle);
    setStorageItem("vehicles", list);
    return newVehicle;
  },

  updateVehicle: (id, vehicleData) => {
    const list = getStorageItem("vehicles", SEED_VEHICLES);
    const idx = list.findIndex(v => v.id === id);
    if (idx === -1) throw new Error("Vehicle not found");

    const updated = {
      ...list[idx],
      ...vehicleData,
      maxLoadCapacity: Number(vehicleData.maxLoadCapacity),
      acquisitionCost: Number(vehicleData.acquisitionCost),
      currentOdometer: Number(vehicleData.currentOdometer)
    };
    list[idx] = updated;
    setStorageItem("vehicles", list);
    return updated;
  },

  deleteVehicle: (id) => {
    const list = getStorageItem("vehicles", SEED_VEHICLES);
    const filtered = list.filter(v => v.id !== id);
    setStorageItem("vehicles", filtered);
    return { success: true };
  },

  // --- DRIVERS ---
  getDrivers: (status, search) => {
    let list = getStorageItem("drivers", SEED_DRIVERS);
    if (status) {
      list = list.filter(d => d.status === status);
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(d => d.name.toLowerCase().includes(q) || d.licenseNumber.toLowerCase().includes(q));
    }
    return list;
  },

  createDriver: (driverData) => {
    const list = getStorageItem("drivers", SEED_DRIVERS);
    const newDriver = {
      id: "d_" + Date.now(),
      ...driverData,
      safetyScore: Number(driverData.safetyScore || 100),
      status: driverData.status || "AVAILABLE"
    };
    list.push(newDriver);
    setStorageItem("drivers", list);
    return newDriver;
  },

  updateDriver: (id, driverData) => {
    const list = getStorageItem("drivers", SEED_DRIVERS);
    const idx = list.findIndex(d => d.id === id);
    if (idx === -1) throw new Error("Driver not found");

    const updated = {
      ...list[idx],
      ...driverData,
      safetyScore: Number(driverData.safetyScore)
    };
    list[idx] = updated;
    setStorageItem("drivers", list);
    return updated;
  },

  // --- TRIPS ---
  getTrips: () => {
    return getStorageItem("trips", SEED_TRIPS);
  },

  dispatchTrip: (tripId) => {
    const trips = getStorageItem("trips", SEED_TRIPS);
    const idx = trips.findIndex(t => t.id === tripId);
    if (idx === -1) throw new Error("Trip not found");
    const trip = trips[idx];

    // Backend Validations Mocked
    const vehicles = getStorageItem("vehicles", SEED_VEHICLES);
    const vehicle = vehicles.find(v => v.id === trip.vehicleId);
    if (!vehicle) throw new Error("Vehicle associated with this trip does not exist");
    
    const drivers = getStorageItem("drivers", SEED_DRIVERS);
    const driver = drivers.find(d => d.id === trip.driverId);
    if (!driver) throw new Error("Driver associated with this trip does not exist");

    // Check cargo capacity
    if (trip.cargoWeight > vehicle.maxLoadCapacity) {
      throw new Error(`Cargo weight (${trip.cargoWeight} kg) exceeds maximum load capacity (${vehicle.maxLoadCapacity} kg) of ${vehicle.name}`);
    }

    // Check driver license expiry
    const today = new Date();
    const expiry = new Date(driver.licenseExpiry);
    if (expiry < today) {
      throw new Error(`Driver license has expired on ${driver.licenseExpiry}. Cannot dispatch.`);
    }

    // Ensure they are available
    if (vehicle.status !== "AVAILABLE") {
      throw new Error(`Vehicle ${vehicle.registrationNumber} is not AVAILABLE (currently ${vehicle.status})`);
    }
    if (driver.status !== "AVAILABLE") {
      throw new Error(`Driver ${driver.name} is not AVAILABLE (currently ${driver.status})`);
    }

    // Transition statuses
    vehicle.status = "ON_TRIP";
    driver.status = "ON_TRIP";
    trip.status = "DISPATCHED";
    trip.dispatchDate = new Date().toISOString();

    // Persist
    const vIdx = vehicles.findIndex(v => v.id === vehicle.id);
    vehicles[vIdx] = vehicle;
    setStorageItem("vehicles", vehicles);

    const dIdx = drivers.findIndex(d => d.id === driver.id);
    drivers[dIdx] = driver;
    setStorageItem("drivers", drivers);

    trips[idx] = trip;
    setStorageItem("trips", trips);

    return trip;
  },

  createTrip: (tripData) => {
    const trips = getStorageItem("trips", SEED_TRIPS);
    const newTrip = {
      id: "t_" + Date.now(),
      source: tripData.source,
      destination: tripData.destination,
      vehicleId: tripData.vehicleId,
      driverId: tripData.driverId,
      cargoWeight: Number(tripData.cargoWeight),
      plannedDistance: Number(tripData.plannedDistance),
      status: "PENDING",
      fuelUsed: 0,
      finalOdometer: 0,
      dispatchDate: null,
      completionDate: null
    };
    trips.push(newTrip);
    setStorageItem("trips", trips);
    return newTrip;
  },

  completeTrip: (id, completeData) => {
    const trips = getStorageItem("trips", SEED_TRIPS);
    const idx = trips.findIndex(t => t.id === id);
    if (idx === -1) throw new Error("Trip not found");
    const trip = trips[idx];

    if (trip.status !== "DISPATCHED") {
      throw new Error("Trip is not in DISPATCHED status, cannot complete");
    }

    const finalOdo = Number(completeData.finalOdometer);
    const fuelUsed = Number(completeData.fuelUsed);

    const vehicles = getStorageItem("vehicles", SEED_VEHICLES);
    const vehicle = vehicles.find(v => v.id === trip.vehicleId);
    if (vehicle && finalOdo < vehicle.currentOdometer) {
      throw new Error(`Final odometer (${finalOdo}) cannot be less than vehicle's current odometer (${vehicle.currentOdometer})`);
    }

    const drivers = getStorageItem("drivers", SEED_DRIVERS);
    const driver = drivers.find(d => d.id === trip.driverId);

    // Update statuses back to available
    if (vehicle) {
      vehicle.status = "AVAILABLE";
      vehicle.currentOdometer = finalOdo;
      const vIdx = vehicles.findIndex(v => v.id === vehicle.id);
      vehicles[vIdx] = vehicle;
      setStorageItem("vehicles", vehicles);
    }

    if (driver) {
      driver.status = "AVAILABLE";
      const dIdx = drivers.findIndex(d => d.id === driver.id);
      drivers[dIdx] = driver;
      setStorageItem("drivers", drivers);
    }

    // Complete trip
    trip.status = "COMPLETED";
    trip.finalOdometer = finalOdo;
    trip.fuelUsed = fuelUsed;
    trip.completionDate = new Date().toISOString();
    trips[idx] = trip;
    setStorageItem("trips", trips);

    // Log fuel expense if it's fuel
    if (fuelUsed > 0) {
      const expenses = getStorageItem("expenses", SEED_EXPENSES);
      const fuelCost = fuelUsed * 3.00; // Mock $3 per litre
      expenses.push({
        id: "e_" + Date.now(),
        vehicleId: trip.vehicleId,
        type: "FUEL",
        amount: fuelCost,
        litres: fuelUsed,
        date: new Date().toISOString().split("T")[0],
        description: `Fuel used for Trip ${trip.source} -> ${trip.destination}`
      });
      setStorageItem("expenses", expenses);
    }

    return trip;
  },

  // --- MAINTENANCE ---
  getMaintenance: () => {
    return getStorageItem("maintenance", SEED_MAINTENANCE);
  },

  createMaintenance: (maintData) => {
    const list = getStorageItem("maintenance", SEED_MAINTENANCE);
    const vehicles = getStorageItem("vehicles", SEED_VEHICLES);
    const vehicle = vehicles.find(v => v.id === maintData.vehicleId);

    if (!vehicle) throw new Error("Vehicle not found");
    if (vehicle.status !== "AVAILABLE") {
      throw new Error(`Vehicle ${vehicle.registrationNumber} is not AVAILABLE (currently ${vehicle.status})`);
    }

    // Transition vehicle to IN_SHOP
    vehicle.status = "IN_SHOP";
    const vIdx = vehicles.findIndex(v => v.id === vehicle.id);
    vehicles[vIdx] = vehicle;
    setStorageItem("vehicles", vehicles);

    const newMaint = {
      id: "m_" + Date.now(),
      vehicleId: maintData.vehicleId,
      description: maintData.description,
      entryDate: new Date().toISOString(),
      status: "IN_SHOP",
      serviceCost: 0,
      completionDate: null
    };

    list.push(newMaint);
    setStorageItem("maintenance", list);
    return newMaint;
  },

  completeMaintenance: (id, completeData) => {
    const list = getStorageItem("maintenance", SEED_MAINTENANCE);
    const idx = list.findIndex(m => m.id === id);
    if (idx === -1) throw new Error("Maintenance entry not found");
    const maint = list[idx];

    if (maint.status !== "IN_SHOP") {
      throw new Error("Maintenance is already completed");
    }

    const cost = Number(completeData.serviceCost);

    // Return vehicle to AVAILABLE
    const vehicles = getStorageItem("vehicles", SEED_VEHICLES);
    const vehicle = vehicles.find(v => v.id === maint.vehicleId);
    if (vehicle) {
      vehicle.status = "AVAILABLE";
      const vIdx = vehicles.findIndex(v => v.id === vehicle.id);
      vehicles[vIdx] = vehicle;
      setStorageItem("vehicles", vehicles);
    }

    maint.status = "COMPLETED";
    maint.serviceCost = cost;
    maint.completionDate = new Date().toISOString();
    list[idx] = maint;
    setStorageItem("maintenance", list);

    // Log repair expense
    const expenses = getStorageItem("expenses", SEED_EXPENSES);
    expenses.push({
      id: "e_" + Date.now(),
      vehicleId: maint.vehicleId,
      type: "REPAIR",
      amount: cost,
      litres: 0,
      date: new Date().toISOString().split("T")[0],
      description: `Completed Maintenance: ${maint.description}`
    });
    setStorageItem("expenses", expenses);

    return maint;
  },

  // --- EXPENSES ---
  getExpenses: () => {
    return getStorageItem("expenses", SEED_EXPENSES);
  },

  getExpenseStats: () => {
    const expenses = getStorageItem("expenses", SEED_EXPENSES);
    const vehicles = getStorageItem("vehicles", SEED_VEHICLES);

    let totalOperationalCost = 0;
    let totalFuelCost = 0;
    const costPerVehicleMap = {};

    vehicles.forEach(v => {
      costPerVehicleMap[v.id] = {
        vehicleId: v.id,
        name: v.name,
        registrationNumber: v.registrationNumber,
        cost: 0
      };
    });

    expenses.forEach(e => {
      const amount = Number(e.amount);
      totalOperationalCost += amount;
      if (e.type === "FUEL") {
        totalFuelCost += amount;
      }
      if (costPerVehicleMap[e.vehicleId]) {
        costPerVehicleMap[e.vehicleId].cost += amount;
      } else {
        costPerVehicleMap[e.vehicleId] = {
          vehicleId: e.vehicleId,
          name: "Unknown Vehicle",
          registrationNumber: "N/A",
          cost: amount
        };
      }
    });

    return {
      totalOperationalCost,
      totalFuelCost,
      costPerVehicle: Object.values(costPerVehicleMap)
    };
  },

  createExpense: (expenseData) => {
    const list = getStorageItem("expenses", SEED_EXPENSES);
    const newExpense = {
      id: "e_" + Date.now(),
      vehicleId: expenseData.vehicleId,
      type: expenseData.type,
      amount: Number(expenseData.amount),
      litres: expenseData.type === "FUEL" ? Number(expenseData.litres || 0) : 0,
      date: expenseData.date || new Date().toISOString().split("T")[0],
      description: expenseData.description
    };
    list.push(newExpense);
    setStorageItem("expenses", list);
    return newExpense;
  },

  // --- ANALYTICS ---
  getKpis: () => {
    const vehicles = getStorageItem("vehicles", SEED_VEHICLES);
    const drivers = getStorageItem("drivers", SEED_DRIVERS);
    const trips = getStorageItem("trips", SEED_TRIPS);

    const activeVehicles = vehicles.filter(v => v.status === "ON_TRIP").length;
    const availableVehicles = vehicles.filter(v => v.status === "AVAILABLE").length;
    const inMaintenance = vehicles.filter(v => v.status === "IN_SHOP").length;

    const activeTrips = trips.filter(t => t.status === "DISPATCHED").length;
    const pendingTrips = trips.filter(t => t.status === "PENDING").length;

    const driversOnDuty = drivers.filter(d => d.status === "ON_TRIP").length;
    
    // Utilization rate = (vehicles on trip / total vehicles) * 100
    const totalVehicles = vehicles.length;
    const fleetUtilization = totalVehicles > 0 ? Math.round((activeVehicles / totalVehicles) * 100) : 0;

    return {
      activeVehicles,
      availableVehicles,
      inMaintenance,
      activeTrips,
      pendingTrips,
      driversOnDuty,
      fleetUtilization
    };
  },

  getReports: () => {
    const trips = getStorageItem("trips", SEED_TRIPS);
    const expenses = getStorageItem("expenses", SEED_EXPENSES);
    const vehicles = getStorageItem("vehicles", SEED_VEHICLES);

    // Calculate Fuel Efficiency KPI (Avg km / Litre)
    const completedTrips = trips.filter(t => t.status === "COMPLETED" && t.fuelUsed > 0);
    const totalKm = completedTrips.reduce((acc, t) => acc + t.plannedDistance, 0);
    const totalLitres = completedTrips.reduce((acc, t) => acc + t.fuelUsed, 0);
    const fuelEfficiency = totalLitres > 0 ? (totalKm / totalLitres).toFixed(2) : "0.00";

    // Monthly Usage Chart (mocked from trips dates)
    // Group completed trips by Month (Jan, Feb, Mar, etc.)
    const monthlyUsage = [
      { name: "Jan", distance: 1200 },
      { name: "Feb", distance: 1850 },
      { name: "Mar", distance: 2400 },
      { name: "Apr", distance: 1900 },
      { name: "May", distance: 3100 },
      { name: "Jun", distance: 2800 },
      { name: "Jul", distance: totalKm + 385 } // Include current trips
    ];

    // Top Cost Vehicles Bar Chart
    const costPerVehicleMap = {};
    vehicles.forEach(v => {
      costPerVehicleMap[v.id] = { name: v.registrationNumber, amount: 0 };
    });
    expenses.forEach(e => {
      if (costPerVehicleMap[e.vehicleId]) {
        costPerVehicleMap[e.vehicleId].amount += Number(e.amount);
      }
    });
    const topCostVehicles = Object.values(costPerVehicleMap)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    // ROI per vehicle metrics table
    // ROI = (TripRevenue - OperationalCost) / AcquisitionCost
    // Let's assume trip revenue is $2.5 per planned km
    const vehicleROIList = vehicles.map(v => {
      const vTrips = trips.filter(t => t.vehicleId === v.id && t.status === "COMPLETED");
      const revenue = vTrips.reduce((acc, t) => acc + (t.plannedDistance * 2.5), 0);
      const cost = expenses.filter(e => e.vehicleId === v.id).reduce((acc, e) => acc + Number(e.amount), 0);
      const profit = revenue - cost;
      const roi = v.acquisitionCost > 0 ? ((profit / v.acquisitionCost) * 100).toFixed(1) : "0.0";
      
      return {
        vehicleId: v.id,
        name: v.name,
        registrationNumber: v.registrationNumber,
        revenue: Number(revenue.toFixed(2)),
        cost: Number(cost.toFixed(2)),
        profit: Number(profit.toFixed(2)),
        roi: Number(roi)
      };
    });

    return {
      fuelEfficiency,
      monthlyUsage,
      topCostVehicles,
      vehicleROI: vehicleROIList
    };
  },

  // --- SETTINGS (USERS MANAGEMENT) ---
  getUsers: () => {
    const list = getStorageItem("users", SEED_USERS);
    // return without password
    return list.map(u => ({ id: u.id, name: u.name, email: u.email, role: u.role }));
  },

  createUser: (userData) => {
    const list = getStorageItem("users", SEED_USERS);
    const exists = list.some(u => u.email.toLowerCase() === userData.email.toLowerCase());
    if (exists) {
      throw new Error(`User with email ${userData.email} already exists`);
    }
    const newUser = {
      id: "u_" + Date.now(),
      name: userData.name,
      email: userData.email,
      role: userData.role,
      password: userData.password || "password123"
    };
    list.push(newUser);
    setStorageItem("users", list);
    return { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role };
  },

  updateUserRole: (id, role) => {
    const list = getStorageItem("users", SEED_USERS);
    const idx = list.findIndex(u => u.id === id);
    if (idx === -1) throw new Error("User not found");
    list[idx].role = role;
    setStorageItem("users", list);
    return { id: list[idx].id, name: list[idx].name, email: list[idx].email, role: list[idx].role };
  },

  changePassword: (userId, currentPassword, newPassword) => {
    const list = getStorageItem("users", SEED_USERS);
    const idx = list.findIndex(u => u.id === userId);
    if (idx === -1) throw new Error("User not found");
    if (list[idx].password !== currentPassword) {
      throw new Error("Current password is incorrect");
    }
    list[idx].password = newPassword;
    setStorageItem("users", list);
    return { success: true };
  }
};
