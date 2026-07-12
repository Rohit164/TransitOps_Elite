"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.completeTrip = exports.dispatchTrip = exports.createTrip = exports.getTrip = exports.getAllTrips = void 0;
const database_js_1 = __importDefault(require("../config/database.js"));
const errors_js_1 = require("../utils/errors.js");
const client_1 = require("@prisma/client");
const getAllTrips = async (req, res, next) => {
    try {
        const { status } = req.query;
        const whereClause = {};
        if (status) {
            whereClause.status = status;
        }
        const trips = await database_js_1.default.trip.findMany({
            where: whereClause,
            include: {
                vehicle: true,
                driver: true
            },
            orderBy: { createdAt: 'desc' }
        });
        res.status(200).json({
            status: 'success',
            results: trips.length,
            data: { trips }
        });
    }
    catch (err) {
        next(err);
    }
};
exports.getAllTrips = getAllTrips;
const getTrip = async (req, res, next) => {
    try {
        const { id } = req.params;
        const trip = await database_js_1.default.trip.findUnique({
            where: { id },
            include: {
                vehicle: true,
                driver: true
            }
        });
        if (!trip) {
            return next(new errors_js_1.AppError('No trip found with that ID', 404));
        }
        res.status(200).json({
            status: 'success',
            data: { trip }
        });
    }
    catch (err) {
        next(err);
    }
};
exports.getTrip = getTrip;
const createTrip = async (req, res, next) => {
    try {
        const { source, destination, vehicleId, driverId, cargoWeight, plannedDistance } = req.body;
        if (!source || !destination || !vehicleId || !driverId || cargoWeight === undefined || plannedDistance === undefined) {
            return next(new errors_js_1.AppError('Please provide all required trip fields', 400));
        }
        // Check if vehicle exists
        const vehicle = await database_js_1.default.vehicle.findUnique({ where: { id: vehicleId } });
        if (!vehicle) {
            return next(new errors_js_1.AppError('Vehicle not found', 404));
        }
        // Check if driver exists
        const driver = await database_js_1.default.driver.findUnique({ where: { id: driverId } });
        if (!driver) {
            return next(new errors_js_1.AppError('Driver not found', 404));
        }
        // Create trip in DRAFT status
        const trip = await database_js_1.default.trip.create({
            data: {
                source,
                destination,
                vehicleId,
                driverId,
                cargoWeight: parseFloat(cargoWeight),
                plannedDistance: parseFloat(plannedDistance),
                status: client_1.TripStatus.DRAFT
            },
            include: {
                vehicle: true,
                driver: true
            }
        });
        res.status(201).json({
            status: 'success',
            data: { trip }
        });
    }
    catch (err) {
        next(err);
    }
};
exports.createTrip = createTrip;
const dispatchTrip = async (req, res, next) => {
    try {
        const { id } = req.params;
        // Find the trip
        const trip = await database_js_1.default.trip.findUnique({
            where: { id },
            include: {
                vehicle: true,
                driver: true
            }
        });
        if (!trip) {
            return next(new errors_js_1.AppError('No trip found with that ID', 404));
        }
        if (trip.status !== client_1.TripStatus.DRAFT) {
            return next(new errors_js_1.AppError(`Only DRAFT trips can be dispatched. This trip is currently ${trip.status}`, 400));
        }
        const { vehicle, driver, cargoWeight } = trip;
        // 1. Validate Vehicle Status
        if (vehicle.status !== client_1.VehicleStatus.AVAILABLE) {
            return next(new errors_js_1.AppError(`Vehicle is not available. Current status: ${vehicle.status}`, 400));
        }
        // 2. Validate Driver Status
        if (driver.status !== client_1.DriverStatus.AVAILABLE) {
            return next(new errors_js_1.AppError(`Driver is not available. Current status: ${driver.status}`, 400));
        }
        // 3. Validate Driver License Expiration
        const now = new Date();
        if (new Date(driver.licenseExpiry) < now) {
            return next(new errors_js_1.AppError('Driver license has expired. Dispatch blocked.', 400));
        }
        // 4. Validate Vehicle Load Capacity vs Cargo Weight
        if (cargoWeight > vehicle.maxLoadCapacity) {
            return next(new errors_js_1.AppError(`Cargo weight (${cargoWeight} kg) exceeds vehicle max load capacity (${vehicle.maxLoadCapacity} kg). Dispatch blocked.`, 400));
        }
        // Update statuses inside a database transaction to ensure atomicity
        const [updatedTrip, updatedVehicle, updatedDriver] = await database_js_1.default.$transaction([
            database_js_1.default.trip.update({
                where: { id },
                data: {
                    status: client_1.TripStatus.DISPATCHED,
                    dispatchDate: new Date()
                },
                include: {
                    vehicle: true,
                    driver: true
                }
            }),
            database_js_1.default.vehicle.update({
                where: { id: vehicle.id },
                data: { status: client_1.VehicleStatus.ON_TRIP }
            }),
            database_js_1.default.driver.update({
                where: { id: driver.id },
                data: { status: client_1.DriverStatus.ON_TRIP }
            })
        ]);
        res.status(200).json({
            status: 'success',
            message: 'Trip successfully dispatched!',
            data: {
                trip: updatedTrip
            }
        });
    }
    catch (err) {
        next(err);
    }
};
exports.dispatchTrip = dispatchTrip;
const completeTrip = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { finalOdometer, fuelUsed } = req.body;
        if (finalOdometer === undefined || fuelUsed === undefined) {
            return next(new errors_js_1.AppError('Please provide finalOdometer and fuelUsed', 400));
        }
        const trip = await database_js_1.default.trip.findUnique({
            where: { id },
            include: {
                vehicle: true,
                driver: true
            }
        });
        if (!trip) {
            return next(new errors_js_1.AppError('No trip found with that ID', 404));
        }
        if (trip.status !== client_1.TripStatus.DISPATCHED) {
            return next(new errors_js_1.AppError(`Only DISPATCHED trips can be completed. This trip is currently ${trip.status}`, 400));
        }
        const parsedOdometer = parseFloat(finalOdometer);
        const parsedFuel = parseFloat(fuelUsed);
        // Validate odometer value
        if (parsedOdometer < trip.vehicle.currentOdometer) {
            return next(new errors_js_1.AppError(`Final odometer (${parsedOdometer}) cannot be less than the vehicle's starting odometer (${trip.vehicle.currentOdometer})`, 400));
        }
        // Standard rate of 100 per litre for auto expense generation
        const fuelCostPerLitre = 100.0;
        const fuelExpenseAmount = parsedFuel * fuelCostPerLitre;
        // Run updates in a transaction
        const [updatedTrip] = await database_js_1.default.$transaction([
            database_js_1.default.trip.update({
                where: { id },
                data: {
                    status: client_1.TripStatus.COMPLETED,
                    finalOdometer: parsedOdometer,
                    fuelUsed: parsedFuel,
                    completionDate: new Date()
                },
                include: {
                    vehicle: true,
                    driver: true
                }
            }),
            database_js_1.default.vehicle.update({
                where: { id: trip.vehicleId },
                data: {
                    status: client_1.VehicleStatus.AVAILABLE,
                    currentOdometer: parsedOdometer
                }
            }),
            database_js_1.default.driver.update({
                where: { id: trip.driverId },
                data: { status: client_1.DriverStatus.AVAILABLE }
            }),
            database_js_1.default.expense.create({
                data: {
                    vehicleId: trip.vehicleId,
                    type: client_1.ExpenseType.FUEL,
                    amount: fuelExpenseAmount,
                    litres: parsedFuel,
                    date: new Date(),
                    description: `Automated fuel entry from completed Trip (Trip ID: ${id.substring(0, 8)})`
                }
            })
        ]);
        res.status(200).json({
            status: 'success',
            message: 'Trip completed successfully! Vehicle and driver are now available.',
            data: {
                trip: updatedTrip
            }
        });
    }
    catch (err) {
        next(err);
    }
};
exports.completeTrip = completeTrip;
