import { Response, NextFunction } from 'express';
import prisma from '../config/database.js';
import { AppError } from '../utils/errors.js';
import { AuthenticatedRequest } from '../types.js';
import { VehicleStatus } from '@prisma/client';

export const getAllVehicles = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { status, search } = req.query;

    const whereClause: any = {};

    if (status) {
      whereClause.status = status as VehicleStatus;
    }

    if (search) {
      whereClause.OR = [
        { registrationNumber: { contains: search as string, mode: 'insensitive' } },
        { name: { contains: search as string, mode: 'insensitive' } },
        { type: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    const vehicles = await prisma.vehicle.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({
      status: 'success',
      results: vehicles.length,
      data: { vehicles }
    });
  } catch (err) {
    next(err);
  }
};

export const getVehicle = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const vehicle = await prisma.vehicle.findUnique({
      where: { id }
    });

    if (!vehicle) {
      return next(new AppError('No vehicle found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: { vehicle }
    });
  } catch (err) {
    next(err);
  }
};

export const createVehicle = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { registrationNumber, name, type, maxLoadCapacity, acquisitionCost, currentOdometer, status } = req.body;

    if (!registrationNumber || !name || !type || maxLoadCapacity === undefined || acquisitionCost === undefined || currentOdometer === undefined) {
      return next(new AppError('Please provide all required vehicle fields', 400));
    }

    // Check unique registration number
    const existingVehicle = await prisma.vehicle.findUnique({
      where: { registrationNumber }
    });

    if (existingVehicle) {
      return next(new AppError('Registration number already exists', 400));
    }

    const vehicle = await prisma.vehicle.create({
      data: {
        registrationNumber,
        name,
        type,
        maxLoadCapacity: parseFloat(maxLoadCapacity),
        acquisitionCost: parseFloat(acquisitionCost),
        currentOdometer: parseFloat(currentOdometer),
        status: status || VehicleStatus.AVAILABLE
      }
    });

    res.status(201).json({
      status: 'success',
      data: { vehicle }
    });
  } catch (err) {
    next(err);
  }
};

export const updateVehicle = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { registrationNumber, name, type, maxLoadCapacity, acquisitionCost, currentOdometer, status } = req.body;

    // Check if vehicle exists
    const vehicle = await prisma.vehicle.findUnique({
      where: { id }
    });

    if (!vehicle) {
      return next(new AppError('No vehicle found with that ID', 404));
    }

    // Check unique registration number if changed
    if (registrationNumber && registrationNumber !== vehicle.registrationNumber) {
      const existingVehicle = await prisma.vehicle.findUnique({
        where: { registrationNumber }
      });

      if (existingVehicle) {
        return next(new AppError('Registration number already exists', 400));
      }
    }

    const updatedVehicle = await prisma.vehicle.update({
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
  } catch (err) {
    next(err);
  }
};

export const deleteVehicle = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    // Check if vehicle exists
    const vehicle = await prisma.vehicle.findUnique({
      where: { id }
    });

    if (!vehicle) {
      return next(new AppError('No vehicle found with that ID', 404));
    }

    // Delete related records first to avoid foreign key constraints (or cascade)
    // Prisma will error on cascade if not configured. We will delete manually or let it delete since we don't have constraints set to CASCADE in DB.
    // Let's delete related expenses, maintenanceRecords, trips first.
    await prisma.expense.deleteMany({ where: { vehicleId: id } });
    await prisma.maintenanceRecord.deleteMany({ where: { vehicleId: id } });
    await prisma.trip.deleteMany({ where: { vehicleId: id } });

    await prisma.vehicle.delete({
      where: { id }
    });

    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (err) {
    next(err);
  }
};
