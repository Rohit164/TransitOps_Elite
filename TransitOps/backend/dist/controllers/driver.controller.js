"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteDriver = exports.updateDriver = exports.createDriver = exports.getDriver = exports.getAllDrivers = void 0;
const database_js_1 = __importDefault(require("../config/database.js"));
const errors_js_1 = require("../utils/errors.js");
const client_1 = require("@prisma/client");
const getAllDrivers = async (req, res, next) => {
    try {
        const { status, search } = req.query;
        const whereClause = {};
        if (status) {
            whereClause.status = status;
        }
        if (search) {
            whereClause.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { licenseNumber: { contains: search, mode: 'insensitive' } },
                { contactNumber: { contains: search, mode: 'insensitive' } }
            ];
        }
        const drivers = await database_js_1.default.driver.findMany({
            where: whereClause,
            orderBy: { createdAt: 'desc' }
        });
        res.status(200).json({
            status: 'success',
            results: drivers.length,
            data: { drivers }
        });
    }
    catch (err) {
        next(err);
    }
};
exports.getAllDrivers = getAllDrivers;
const getDriver = async (req, res, next) => {
    try {
        const { id } = req.params;
        const driver = await database_js_1.default.driver.findUnique({
            where: { id }
        });
        if (!driver) {
            return next(new errors_js_1.AppError('No driver found with that ID', 404));
        }
        res.status(200).json({
            status: 'success',
            data: { driver }
        });
    }
    catch (err) {
        next(err);
    }
};
exports.getDriver = getDriver;
const createDriver = async (req, res, next) => {
    try {
        const { name, licenseNumber, licenseCategory, licenseExpiry, contactNumber, safetyScore, status } = req.body;
        if (!name || !licenseNumber || !licenseCategory || !licenseExpiry || !contactNumber) {
            return next(new errors_js_1.AppError('Please provide all required driver fields', 400));
        }
        // Check unique license number
        const existingDriver = await database_js_1.default.driver.findUnique({
            where: { licenseNumber }
        });
        if (existingDriver) {
            return next(new errors_js_1.AppError('License number already exists', 400));
        }
        const driver = await database_js_1.default.driver.create({
            data: {
                name,
                licenseNumber,
                licenseCategory,
                licenseExpiry: new Date(licenseExpiry),
                contactNumber,
                safetyScore: safetyScore !== undefined ? parseFloat(safetyScore) : 100.0,
                status: status || client_1.DriverStatus.AVAILABLE
            }
        });
        res.status(201).json({
            status: 'success',
            data: { driver }
        });
    }
    catch (err) {
        next(err);
    }
};
exports.createDriver = createDriver;
const updateDriver = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, licenseNumber, licenseCategory, licenseExpiry, contactNumber, safetyScore, status } = req.body;
        // Check if driver exists
        const driver = await database_js_1.default.driver.findUnique({
            where: { id }
        });
        if (!driver) {
            return next(new errors_js_1.AppError('No driver found with that ID', 404));
        }
        // Check unique license number if changed
        if (licenseNumber && licenseNumber !== driver.licenseNumber) {
            const existingDriver = await database_js_1.default.driver.findUnique({
                where: { licenseNumber }
            });
            if (existingDriver) {
                return next(new errors_js_1.AppError('License number already exists', 400));
            }
        }
        const updatedDriver = await database_js_1.default.driver.update({
            where: { id },
            data: {
                name,
                licenseNumber,
                licenseCategory,
                licenseExpiry: licenseExpiry ? new Date(licenseExpiry) : undefined,
                contactNumber,
                safetyScore: safetyScore !== undefined ? parseFloat(safetyScore) : undefined,
                status: status || undefined
            }
        });
        res.status(200).json({
            status: 'success',
            data: { driver: updatedDriver }
        });
    }
    catch (err) {
        next(err);
    }
};
exports.updateDriver = updateDriver;
const deleteDriver = async (req, res, next) => {
    try {
        const { id } = req.params;
        // Check if driver exists
        const driver = await database_js_1.default.driver.findUnique({
            where: { id }
        });
        if (!driver) {
            return next(new errors_js_1.AppError('No driver found with that ID', 404));
        }
        // Delete related records
        await database_js_1.default.trip.deleteMany({ where: { driverId: id } });
        await database_js_1.default.driver.delete({
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
exports.deleteDriver = deleteDriver;
