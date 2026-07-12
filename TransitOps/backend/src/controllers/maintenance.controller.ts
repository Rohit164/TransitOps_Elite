import { Response, NextFunction } from 'express';
import prisma from '../config/database.js';
import { AppError } from '../utils/errors.js';
import { AuthenticatedRequest } from '../types.js';
import { VehicleStatus, ExpenseType } from '@prisma/client';

export const getAllMaintenance = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const records = await prisma.maintenanceRecord.findMany({
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
  } catch (err) {
    next(err);
  }
};

export const createMaintenance = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { vehicleId, description } = req.body;

    if (!vehicleId || !description) {
      return next(new AppError('Please provide vehicleId and description', 400));
    }

    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId }
    });

    if (!vehicle) {
      return next(new AppError('Vehicle not found', 404));
    }

    if (vehicle.status !== VehicleStatus.AVAILABLE) {
      return next(new AppError(`Vehicle is currently ${vehicle.status} and cannot enter maintenance.`, 400));
    }

    // Run transaction: Create maintenance record and set vehicle status to IN_SHOP
    const [record] = await prisma.$transaction([
      prisma.maintenanceRecord.create({
        data: {
          vehicleId,
          description,
          status: 'IN_PROGRESS'
        },
        include: {
          vehicle: true
        }
      }),
      prisma.vehicle.update({
        where: { id: vehicleId },
        data: {
          status: VehicleStatus.IN_SHOP
        }
      })
    ]);

    res.status(201).json({
      status: 'success',
      data: { record }
    });
  } catch (err) {
    next(err);
  }
};

export const completeMaintenance = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { cost } = req.body;

    if (cost === undefined) {
      return next(new AppError('Please provide the maintenance cost', 400));
    }

    const parsedCost = parseFloat(cost);

    const record = await prisma.maintenanceRecord.findUnique({
      where: { id },
      include: { vehicle: true }
    });

    if (!record) {
      return next(new AppError('Maintenance record not found', 404));
    }

    if (record.status === 'COMPLETED') {
      return next(new AppError('This maintenance record is already marked as completed', 400));
    }

    // Run transaction:
    // 1. Update maintenance record to COMPLETED, record end date and cost
    // 2. Set vehicle status back to AVAILABLE
    // 3. Create a repair/maintenance expense record for the vehicle
    const [updatedRecord] = await prisma.$transaction([
      prisma.maintenanceRecord.update({
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
      prisma.vehicle.update({
        where: { id: record.vehicleId },
        data: {
          status: VehicleStatus.AVAILABLE
        }
      }),
      prisma.expense.create({
        data: {
          vehicleId: record.vehicleId,
          type: ExpenseType.MAINTENANCE,
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
  } catch (err) {
    next(err);
  }
};
