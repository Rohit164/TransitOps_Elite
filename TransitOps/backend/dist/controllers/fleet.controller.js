"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteVehicle = exports.updateVehicle = exports.createVehicle = exports.getVehicle = exports.getAllVehicles = void 0;
const database_js_1 = __importDefault(require("../config/database.js"));
const errors_js_1 = require("../utils/errors.js");
const client_1 = require("@prisma/client");
const getAllVehicles = async (req, res, next) => {
    try {
        const { status, search } = req.query;
        const whereClause = {};
        if (status) {
            whereClause.status = status;
        }
        if (search) {
            whereClause.OR = [
                { registrationNumber: { contains: search, mode: 'insensitive' } },
                { name: { contains: search, mode: 'insensitive' } },
                { type: { contains: search, mode: 'insensitive' } }
            ];
        }
        const vehicles = await database_js_1.default.vehicle.findMany({
            where: whereClause,
            orderBy: { createdAt: 'desc' }
        });
        res.status(200).json({
            status: 'success',
            results: vehicles.length,
            data: { vehicles }
        });
    }
    catch (err) {
        next(err);
    }
};
exports.getAllVehicles = getAllVehicles;
const getVehicle = async (req, res, next) => {
    try {
        const { id } = req.params;
        const vehicle = await database_js_1.default.vehicle.findUnique({
            where: { id }
        });
        if (!vehicle) {
            return next(new errors_js_1.AppError('No vehicle found with that ID', 404));
        }
        res.status(200).json({
            status: 'success',
            data: { vehicle }
        });
    }
    catch (err) {
        next(err);
    }
};
exports.getVehicle = getVehicle;
const createVehicle = async (req, res, next) => {
    try {
        const { registrationNumber, name, type, maxLoadCapacity, acquisitionCost, currentOdometer, status } = req.body;
        if (!registrationNumber || !name || !type || maxLoadCapacity === undefined || acquisitionCost === undefined || currentOdometer === undefined) {
            return next(new errors_js_1.AppError('Please provide all required vehicle fields', 400));
        }
        // Check unique registration number
        const existingVehicle = await database_js_1.default.vehicle.findUnique({
            where: { registrationNumber }
        });
        if (existingVehicle) {
            return next(new errors_js_1.AppError('Registration number already exists', 400));
        }
        const vehicle = await database_js_1.default.vehicle.create({
            data: {
                registrationNumber,
                name,
                type,
                maxLoadCapacity: parseFloat(maxLoadCapacity),
                acquisitionCost: parseFloat(acquisitionCost),
                currentOdometer: parseFloat(currentOdometer),
                status: status || client_1.VehicleStatus.AVAILABLE
            }
        });
        res.status(201).json({
            status: 'success',
            data: { vehicle }
        });
    }
    catch (err) {
        next(err);
    }
};
exports.createVehicle = createVehicle;
const updateVehicle = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { registrationNumber, name, type, maxLoadCapacity, acquisitionCost, currentOdometer, status } = req.body;
        // Check if vehicle exists
        const vehicle = await database_js_1.default.vehicle.findUnique({
            where: { id }
        });
        if (!vehicle) {
            return next(new errors_js_1.AppError('No vehicle found with that ID', 404));
        }
        // Check unique registration number if changed
        if (registrationNumber && registrationNumber !== vehicle.registrationNumber) {
            const existingVehicle = await database_js_1.default.vehicle.findUnique({
                where: { registrationNumber }
            });
            if (existingVehicle) {
                return next(new errors_js_1.AppError('Registration number already exists', 400));
            }
        }
        const updatedVehicle = await database_js_1.default.vehicle.update({
            where: { id },
            data: {
                registrationNumber,
                name,
                type,
                maxLoadCapacity: maxLoadCapacity !== undefined ? parseFloat(maxLoadCapacity) : undefined,
                acquisitionCost: acquisitionCost !== undefined ? parseFloat(acquisitionCost) : undefined,
                currentOdometer: currentOdometer !== undefined ? parseFloat(currentOdometer) : undefined,
                status: status || undefined
            }
        });
        res.status(200).json({
            status: 'success',
            data: { vehicle: updatedVehicle }
        });
    }
    catch (err) {
        next(err);
    }
};
exports.updateVehicle = updateVehicle;
const deleteVehicle = async (req, res, next) => {
    try {
        const { id } = req.params;
        // Check if vehicle exists
        const vehicle = await database_js_1.default.vehicle.findUnique({
            where: { id }
        });
        if (!vehicle) {
            return next(new errors_js_1.AppError('No vehicle found with that ID', 404));
        }
        // Delete related records first to avoid foreign key constraints (or cascade)
        // Prisma will error on cascade if not configured. We will delete manually or let it delete since we don't have constraints set to CASCADE in DB.
        // Let's delete related expenses, maintenanceRecords, trips first.
        await database_js_1.default.expense.deleteMany({ where: { vehicleId: id } });
        await database_js_1.default.maintenanceRecord.deleteMany({ where: { vehicleId: id } });
        await database_js_1.default.trip.deleteMany({ where: { vehicleId: id } });
        await database_js_1.default.vehicle.delete({
            where: { id }
        });
        res.status(204).json({
            status: 'success',
            data: null
        });
    }
    catch (err) {
        next(err);
    }
};
exports.deleteVehicle = deleteVehicle;
