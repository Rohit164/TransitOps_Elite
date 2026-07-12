"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportCSV = exports.getReports = exports.getDashboardKPIs = void 0;
const database_js_1 = __importDefault(require("../config/database.js"));
const client_1 = require("@prisma/client");
const getDashboardKPIs = async (req, res, next) => {
    try {
        // 1. Active Vehicles (On Trip)
        const activeVehicles = await database_js_1.default.vehicle.count({ where: { status: client_1.VehicleStatus.ON_TRIP } });
        // 2. Available Vehicles
        const availableVehicles = await database_js_1.default.vehicle.count({ where: { status: client_1.VehicleStatus.AVAILABLE } });
        // 3. Vehicles in Maintenance (In Shop)
        const inMaintenance = await database_js_1.default.vehicle.count({ where: { status: client_1.VehicleStatus.IN_SHOP } });
        // 4. Retired Vehicles
        const retiredVehicles = await database_js_1.default.vehicle.count({ where: { status: client_1.VehicleStatus.RETIRED } });
        // 5. Active Trips (Dispatched)
        const activeTrips = await database_js_1.default.trip.count({ where: { status: client_1.TripStatus.DISPATCHED } });
        // 6. Pending Trips (Draft)
        const pendingTrips = await database_js_1.default.trip.count({ where: { status: client_1.TripStatus.DRAFT } });
        // 7. Completed Trips
        const completedTrips = await database_js_1.default.trip.count({ where: { status: client_1.TripStatus.COMPLETED } });
        // 8. Drivers On Duty (On Trip)
        const driversOnDuty = await database_js_1.default.driver.count({ where: { status: client_1.DriverStatus.ON_TRIP } });
        // 9. Drivers Available
        const driversAvailable = await database_js_1.default.driver.count({ where: { status: client_1.DriverStatus.AVAILABLE } });
        // 10. Fleet Utilization Rate
        const totalActiveAndAvailable = activeVehicles + availableVehicles + inMaintenance;
        const fleetUtilization = totalActiveAndAvailable > 0 ? (activeVehicles / totalActiveAndAvailable) * 100 : 0;
        res.status(200).json({
            status: 'success',
            data: {
                activeVehicles,
                availableVehicles,
                inMaintenance,
                retiredVehicles,
                activeTrips,
                pendingTrips,
                completedTrips,
                driversOnDuty,
                driversAvailable,
                fleetUtilization: parseFloat(fleetUtilization.toFixed(2))
            }
        });
    }
    catch (err) {
        next(err);
    }
};
exports.getDashboardKPIs = getDashboardKPIs;
const getReports = async (req, res, next) => {
    try {
        // 1. Fleet Utilization
        const activeVehicles = await database_js_1.default.vehicle.count({ where: { status: client_1.VehicleStatus.ON_TRIP } });
        const totalVehicles = await database_js_1.default.vehicle.count({ where: { NOT: { status: client_1.VehicleStatus.RETIRED } } });
        const utilizationRate = totalVehicles > 0 ? (activeVehicles / totalVehicles) * 100 : 0;
        // 2. Fuel Efficiency (km per litre)
        const completedTrips = await database_js_1.default.trip.findMany({
            where: { status: client_1.TripStatus.COMPLETED }
        });
        const totalDistance = completedTrips.reduce((sum, t) => sum + t.plannedDistance, 0);
        const totalFuel = completedTrips.reduce((sum, t) => sum + (t.fuelUsed || 0), 0);
        const averageFuelEfficiency = totalFuel > 0 ? totalDistance / totalFuel : 0;
        // 3. Operational Costs (Sum of all expenses)
        const expensesSum = await database_js_1.default.expense.aggregate({
            _sum: { amount: true }
        });
        const totalOperationalCost = expensesSum._sum.amount || 0;
        // 4. Vehicle ROI
        // Assuming mock revenue rate of 75 per km completed
        const vehicles = await database_js_1.default.vehicle.findMany({
            include: {
                trips: { where: { status: client_1.TripStatus.COMPLETED } },
                expenses: true
            }
        });
        const vehicleROI = vehicles.map((v) => {
            const distanceTravelled = v.trips.reduce((sum, t) => sum + t.plannedDistance, 0);
            const estimatedRevenue = distanceTravelled * 75.0; // Mock revenue per km
            const totalExpenses = v.expenses.reduce((sum, e) => sum + e.amount, 0);
            const netProfit = estimatedRevenue - totalExpenses;
            // ROI = Net Profit / Acquisition Cost * 100 (for life of vehicle)
            const roiPercentage = v.acquisitionCost > 0 ? (netProfit / v.acquisitionCost) * 100 : 0;
            return {
                vehicleId: v.id,
                registrationNumber: v.registrationNumber,
                name: v.name,
                totalDistance: distanceTravelled,
                estimatedRevenue,
                totalExpenses,
                netProfit,
                roiPercentage: parseFloat(roiPercentage.toFixed(2))
            };
        });
        // 5. Top Cost Vehicles (sorted by expenses)
        const topCostVehicles = [...vehicleROI]
            .sort((a, b) => b.totalExpenses - a.totalExpenses)
            .slice(0, 5);
        // 6. Monthly Usage (Mock distribution for charts)
        const monthlyUsage = [
            { month: 'Jan', distance: 1200 },
            { month: 'Feb', distance: 1800 },
            { month: 'Mar', distance: 2200 },
            { month: 'Apr', distance: 2900 },
            { month: 'May', distance: 3400 },
            { month: 'Jun', distance: totalDistance || 4000 }
        ];
        res.status(200).json({
            status: 'success',
            data: {
                fleetUtilization: parseFloat(utilizationRate.toFixed(2)),
                fuelEfficiency: parseFloat(averageFuelEfficiency.toFixed(2)),
                totalOperationalCost,
                vehicleROI,
                topCostVehicles,
                monthlyUsage
            }
        });
    }
    catch (err) {
        next(err);
    }
};
exports.getReports = getReports;
const exportCSV = async (req, res, next) => {
    try {
        const reportType = req.query.type; // 'vehicles' or 'trips' or 'expenses'
        let csvContent = '';
        if (reportType === 'trips') {
            const trips = await database_js_1.default.trip.findMany({
                include: { vehicle: true, driver: true },
                orderBy: { createdAt: 'desc' }
            });
            csvContent = 'Trip ID,Source,Destination,Vehicle Reg,Driver Name,Cargo Weight(kg),Planned Dist(km),Odometer,Status,Date\n';
            trips.forEach((t) => {
                csvContent += `"${t.id}","${t.source}","${t.destination}","${t.vehicle.registrationNumber}","${t.driver.name}",${t.cargoWeight},${t.plannedDistance},${t.finalOdometer || ''},"${t.status}","${t.createdAt.toISOString()}"\n`;
            });
        }
        else if (reportType === 'expenses') {
            const expenses = await database_js_1.default.expense.findMany({
                include: { vehicle: true },
                orderBy: { date: 'desc' }
            });
            csvContent = 'Expense ID,Vehicle Reg,Type,Amount(INR),Litres,Date,Description\n';
            expenses.forEach((e) => {
                csvContent += `"${e.id}","${e.vehicle.registrationNumber}","${e.type}",${e.amount},${e.litres || ''},"${e.date.toISOString()}","${e.description || ''}"\n`;
            });
        }
        else {
            // Default to vehicles report
            const vehicles = await database_js_1.default.vehicle.findMany({
                include: {
                    expenses: true,
                    trips: { where: { status: client_1.TripStatus.COMPLETED } }
                }
            });
            csvContent = 'Vehicle ID,Registration Number,Name,Type,Max Load(kg),Odometer(km),Status,Total Expense(INR),Trips Completed\n';
            vehicles.forEach((v) => {
                const totalExpenses = v.expenses.reduce((sum, e) => sum + e.amount, 0);
                csvContent += `"${v.id}","${v.registrationNumber}","${v.name}","${v.type}",${v.maxLoadCapacity},${v.currentOdometer},"${v.status}",${totalExpenses},${v.trips.length}\n`;
            });
        }
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=transitops-${reportType || 'vehicles'}-report.csv`);
        res.status(200).send(csvContent);
    }
    catch (err) {
        next(err);
    }
};
exports.exportCSV = exportCSV;
