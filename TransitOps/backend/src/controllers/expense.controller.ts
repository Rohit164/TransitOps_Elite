import { Response, NextFunction } from 'express';
import prisma from '../config/database.js';
import { AppError } from '../utils/errors.js';
import { AuthenticatedRequest } from '../types.js';
import { ExpenseType } from '@prisma/client';

export const getAllExpenses = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { vehicleId, type } = req.query;

    const whereClause: any = {};

    if (vehicleId) {
      whereClause.vehicleId = vehicleId as string;
    }

    if (type) {
      whereClause.type = type as ExpenseType;
    }

    const expenses = await prisma.expense.findMany({
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
  } catch (err) {
    next(err);
  }
};

export const createExpense = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { vehicleId, type, amount, litres, date, description } = req.body;

    if (!vehicleId || !type || amount === undefined) {
      return next(new AppError('Please provide vehicleId, type, and amount', 400));
    }

    // Validate fuel requires litres
    if (type === ExpenseType.FUEL && litres === undefined) {
      return next(new AppError('Litres field is required for FUEL type expenses', 400));
    }

    // Verify vehicle exists
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId }
    });

    if (!vehicle) {
      return next(new AppError('Vehicle not found', 404));
    }

    const expense = await prisma.expense.create({
      data: {
        vehicleId,
        type: type as ExpenseType,
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
  } catch (err) {
    next(err);
  }
};

export const getOperationalCosts = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    // 1. Total operational cost (sum of all expenses)
    const totalOpsAggregate = await prisma.expense.aggregate({
      _sum: { amount: true }
    });
    const totalOperationalCost = totalOpsAggregate._sum.amount || 0;

    // 2. Total fuel cost
    const totalFuelAggregate = await prisma.expense.aggregate({
      where: { type: ExpenseType.FUEL },
      _sum: { amount: true }
    });
    const totalFuelCost = totalFuelAggregate._sum.amount || 0;

    // 3. Cost per vehicle breakdown
    const vehiclesWithExpenses = await prisma.vehicle.findMany({
      include: {
        expenses: true
      }
    });

    const costPerVehicle = vehiclesWithExpenses.map((v) => {
      const totalAmount = v.expenses.reduce((sum, exp) => sum + exp.amount, 0);
      const fuelAmount = v.expenses
        .filter((exp) => exp.type === ExpenseType.FUEL)
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
  } catch (err) {
    next(err);
  }
};
