"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOperationalCosts = exports.createExpense = exports.getAllExpenses = void 0;
const database_js_1 = __importDefault(require("../config/database.js"));
const errors_js_1 = require("../utils/errors.js");
const client_1 = require("@prisma/client");
const getAllExpenses = async (req, res, next) => {
    try {
        const { vehicleId, type } = req.query;
        const whereClause = {};
        if (vehicleId) {
            whereClause.vehicleId = vehicleId;
        }
        if (type) {
            whereClause.type = type;
        }
        const expenses = await database_js_1.default.expense.findMany({
            where: whereClause,
            include: {
                vehicle: true
            },
            orderBy: { date: 'desc' }
        });
        res.status(200).json({
            status: 'success',
            results: expenses.length,
            data: { expenses }
        });
    }
    catch (err) {
        next(err);
    }
};
exports.getAllExpenses = getAllExpenses;
const createExpense = async (req, res, next) => {
    try {
        const { vehicleId, type, amount, litres, date, description } = req.body;
        if (!vehicleId || !type || amount === undefined) {
            return next(new errors_js_1.AppError('Please provide vehicleId, type, and amount', 400));
        }
        // Validate fuel requires litres
        if (type === client_1.ExpenseType.FUEL && litres === undefined) {
            return next(new errors_js_1.AppError('Litres field is required for FUEL type expenses', 400));
        }
        // Verify vehicle exists
        const vehicle = await database_js_1.default.vehicle.findUnique({
            where: { id: vehicleId }
        });
        if (!vehicle) {
            return next(new errors_js_1.AppError('Vehicle not found', 404));
        }
        const expense = await database_js_1.default.expense.create({
            data: {
                vehicleId,
                type: type,
                amount: parseFloat(amount),
                litres: litres !== undefined ? parseFloat(litres) : null,
                date: date ? new Date(date) : new Date(),
                description
            },
            include: {
                vehicle: true
            }
        });
        res.status(201).json({
            status: 'success',
            data: { expense }
        });
    }
    catch (err) {
        next(err);
    }
};
exports.createExpense = createExpense;
const getOperationalCosts = async (req, res, next) => {
    try {
        // 1. Total operational cost (sum of all expenses)
        const totalOpsAggregate = await database_js_1.default.expense.aggregate({
            _sum: { amount: true }
        });
        const totalOperationalCost = totalOpsAggregate._sum.amount || 0;
        // 2. Total fuel cost
        const totalFuelAggregate = await database_js_1.default.expense.aggregate({
            where: { type: client_1.ExpenseType.FUEL },
            _sum: { amount: true }
        });
        const totalFuelCost = totalFuelAggregate._sum.amount || 0;
        // 3. Cost per vehicle breakdown
        const vehiclesWithExpenses = await database_js_1.default.vehicle.findMany({
            include: {
                expenses: true
            }
        });
        const costPerVehicle = vehiclesWithExpenses.map((v) => {
            const totalAmount = v.expenses.reduce((sum, exp) => sum + exp.amount, 0);
            const fuelAmount = v.expenses
                .filter((exp) => exp.type === client_1.ExpenseType.FUEL)
                .reduce((sum, exp) => sum + exp.amount, 0);
            return {
                vehicleId: v.id,
                registrationNumber: v.registrationNumber,
                name: v.name,
                totalCost: totalAmount,
                fuelCost: fuelAmount,
                otherCost: totalAmount - fuelAmount
            };
        });
        res.status(200).json({
            status: 'success',
            data: {
                totalOperationalCost,
                totalFuelCost,
                costPerVehicle
            }
        });
    }
    catch (err) {
        next(err);
    }
};
exports.getOperationalCosts = getOperationalCosts;
