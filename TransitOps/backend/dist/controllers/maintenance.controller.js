"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.completeMaintenance = exports.createMaintenance = exports.getAllMaintenance = void 0;
const database_js_1 = __importDefault(require("../config/database.js"));
const errors_js_1 = require("../utils/errors.js");
const client_1 = require("@prisma/client");
const getAllMaintenance = async (req, res, next) => {
    try {
        const records = await database_js_1.default.maintenanceRecord.findMany({
            include: {
                vehicle: true
            },
            orderBy: { createdAt: 'desc' }
        });
        res.status(200).json({
            status: 'success',
            results: records.length,
            data: { records }
        });
    }
    catch (err) {
        next(err);
    }
};
exports.getAllMaintenance = getAllMaintenance;
const createMaintenance = async (req, res, next) => {
    try {
        const { vehicleId, description } = req.body;
        if (!vehicleId || !description) {
            return next(new errors_js_1.AppError('Please provide vehicleId and description', 400));
        }
        const vehicle = await database_js_1.default.vehicle.findUnique({
            where: { id: vehicleId }
        });
        if (!vehicle) {
            return next(new errors_js_1.AppError('Vehicle not found', 404));
        }
        if (vehicle.status !== client_1.VehicleStatus.AVAILABLE) {
            return next(new errors_js_1.AppError(`Vehicle is currently ${vehicle.status} and cannot enter maintenance.`, 400));
        }
        // Run transaction: Create maintenance record and set vehicle status to IN_SHOP
        const [record] = await database_js_1.default.$transaction([
            database_js_1.default.maintenanceRecord.create({
                data: {
                    vehicleId,
                    description,
                    status: 'IN_PROGRESS'
                },
                include: {
                    vehicle: true
                }
            }),
            database_js_1.default.vehicle.update({
                where: { id: vehicleId },
                data: {
                    status: client_1.VehicleStatus.IN_SHOP
                }
            })
        ]);
        res.status(201).json({
            status: 'success',
            data: { record }
        });
    }
    catch (err) {
        next(err);
    }
};
exports.createMaintenance = createMaintenance;
const completeMaintenance = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { cost } = req.body;
        if (cost === undefined) {
            return next(new errors_js_1.AppError('Please provide the maintenance cost', 400));
        }
        const parsedCost = parseFloat(cost);
        const record = await database_js_1.default.maintenanceRecord.findUnique({
            where: { id },
            include: { vehicle: true }
        });
        if (!record) {
            return next(new errors_js_1.AppError('Maintenance record not found', 404));
        }
        if (record.status === 'COMPLETED') {
            return next(new errors_js_1.AppError('This maintenance record is already marked as completed', 400));
        }
        // Run transaction:
        // 1. Update maintenance record to COMPLETED, record end date and cost
        // 2. Set vehicle status back to AVAILABLE
        // 3. Create a repair/maintenance expense record for the vehicle
        const [updatedRecord] = await database_js_1.default.$transaction([
            database_js_1.default.maintenanceRecord.update({
                where: { id },
                data: {
                    status: 'COMPLETED',
                    endDate: new Date(),
                    cost: parsedCost
                },
                include: {
                    vehicle: true
                }
            }),
            database_js_1.default.vehicle.update({
                where: { id: record.vehicleId },
                data: {
                    status: client_1.VehicleStatus.AVAILABLE
                }
            }),
            database_js_1.default.expense.create({
                data: {
                    vehicleId: record.vehicleId,
                    type: client_1.ExpenseType.MAINTENANCE,
                    amount: parsedCost,
                    date: new Date(),
                    description: `Maintenance expense from complete service record (ID: ${id.substring(0, 8)})`
                }
            })
        ]);
        res.status(200).json({
            status: 'success',
            message: 'Maintenance completed! Vehicle is now AVAILABLE.',
            data: {
                record: updatedRecord
            }
        });
    }
    catch (err) {
        next(err);
    }
};
exports.completeMaintenance = completeMaintenance;
