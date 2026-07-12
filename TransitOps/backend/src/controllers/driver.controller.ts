import { Response, NextFunction } from 'express';
import prisma from '../config/database.js';
import { AppError } from '../utils/errors.js';
import { AuthenticatedRequest } from '../types.js';
import { DriverStatus } from '@prisma/client';

export const getAllDrivers = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { status, search } = req.query;

    const whereClause: any = {};

    if (status) {
      whereClause.status = status as DriverStatus;
    }

    if (search) {
      whereClause.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { licenseNumber: { contains: search as string, mode: 'insensitive' } },
        { contactNumber: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    const drivers = await prisma.driver.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({
      status: 'success',
      results: drivers.length,
      data: { drivers }
    });
  } catch (err) {
    next(err);
  }
};

export const getDriver = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const driver = await prisma.driver.findUnique({
      where: { id }
    });

    if (!driver) {
      return next(new AppError('No driver found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: { driver }
    });
  } catch (err) {
    next(err);
  }
};

export const createDriver = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { name, licenseNumber, licenseCategory, licenseExpiry, contactNumber, safetyScore, status } = req.body;

    if (!name || !licenseNumber || !licenseCategory || !licenseExpiry || !contactNumber) {
      return next(new AppError('Please provide all required driver fields', 400));
    }

    // Check unique license number
    const existingDriver = await prisma.driver.findUnique({
      where: { licenseNumber }
    });

    if (existingDriver) {
      return next(new AppError('License number already exists', 400));
    }

    const driver = await prisma.driver.create({
      data: {
        name,
        licenseNumber,
        licenseCategory,
        licenseExpiry: new Date(licenseExpiry),
        contactNumber,
        safetyScore: safetyScore !== undefined ? parseFloat(safetyScore) : 100.0,
        status: status || DriverStatus.AVAILABLE
      }
    });

    res.status(201).json({
      status: 'success',
      data: { driver }
    });
  } catch (err) {
    next(err);
  }
};

export const updateDriver = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name, licenseNumber, licenseCategory, licenseExpiry, contactNumber, safetyScore, status } = req.body;

    // Check if driver exists
    const driver = await prisma.driver.findUnique({
      where: { id }
    });

    if (!driver) {
      return next(new AppError('No driver found with that ID', 404));
    }

    // Check unique license number if changed
    if (licenseNumber && licenseNumber !== driver.licenseNumber) {
      const existingDriver = await prisma.driver.findUnique({
        where: { licenseNumber }
      });

      if (existingDriver) {
        return next(new AppError('License number already exists', 400));
      }
    }

    const updatedDriver = await prisma.driver.update({
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
  } catch (err) {
    next(err);
  }
};

export const deleteDriver = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    // Check if driver exists
    const driver = await prisma.driver.findUnique({
      where: { id }
    });

    if (!driver) {
      return next(new AppError('No driver found with that ID', 404));
    }

    // Delete related records
    await prisma.trip.deleteMany({ where: { driverId: id } });

    await prisma.driver.delete({
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
