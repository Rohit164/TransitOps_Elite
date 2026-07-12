import { Response, NextFunction } from 'express';
import prisma from '../config/database.js';
import { AppError } from '../utils/errors.js';
import { AuthenticatedRequest } from '../types.js';
import { TripStatus, VehicleStatus, DriverStatus, ExpenseType } from '@prisma/client';

export const getAllTrips = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { status } = req.query;

    const whereClause: any = {};
    if (status) {
      whereClause.status = status as TripStatus;
    }

    const trips = await prisma.trip.findMany({
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
  } catch (err) {
    next(err);
  }
};

export const getTrip = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const trip = await prisma.trip.findUnique({
      where: { id },
      include: {
        vehicle: true,
        driver: true
      }
    });

    if (!trip) {
      return next(new AppError('No trip found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: { trip }
    });
  } catch (err) {
    next(err);
  }
};

export const createTrip = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { source, destination, vehicleId, driverId, cargoWeight, plannedDistance } = req.body;

    if (!source || !destination || !vehicleId || !driverId || cargoWeight === undefined || plannedDistance === undefined) {
      return next(new AppError('Please provide all required trip fields', 400));
    }

    // Check if vehicle exists
    const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!vehicle) {
      return next(new AppError('Vehicle not found', 404));
    }

    // Check if driver exists
    const driver = await prisma.driver.findUnique({ where: { id: driverId } });
    if (!driver) {
      return next(new AppError('Driver not found', 404));
    }

    // Create trip in DRAFT status
    const trip = await prisma.trip.create({
      data: {
        source,
        destination,
        vehicleId,
        driverId,
        cargoWeight: parseFloat(cargoWeight),
        plannedDistance: parseFloat(plannedDistance),
        status: TripStatus.DRAFT
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
  } catch (err) {
    next(err);
  }
};

export const dispatchTrip = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    // Find the trip
    const trip = await prisma.trip.findUnique({
      where: { id },
      include: {
        vehicle: true,
        driver: true
      }
    });

    if (!trip) {
      return next(new AppError('No trip found with that ID', 404));
    }

    if (trip.status !== TripStatus.DRAFT) {
      return next(new AppError(`Only DRAFT trips can be dispatched. This trip is currently ${trip.status}`, 400));
    }

    const { vehicle, driver, cargoWeight } = trip;

    // 1. Validate Vehicle Status
    if (vehicle.status !== VehicleStatus.AVAILABLE) {
      return next(new AppError(`Vehicle is not available. Current status: ${vehicle.status}`, 400));
    }

    // 2. Validate Driver Status
    if (driver.status !== DriverStatus.AVAILABLE) {
      return next(new AppError(`Driver is not available. Current status: ${driver.status}`, 400));
    }

    // 3. Validate Driver License Expiration
    const now = new Date();
    if (new Date(driver.licenseExpiry) < now) {
      return next(new AppError('Driver license has expired. Dispatch blocked.', 400));
    }

    // 4. Validate Vehicle Load Capacity vs Cargo Weight
    if (cargoWeight > vehicle.maxLoadCapacity) {
      return next(
        new AppError(
          `Cargo weight (${cargoWeight} kg) exceeds vehicle max load capacity (${vehicle.maxLoadCapacity} kg). Dispatch blocked.`,
          400
        )
      );
    }

    // Update statuses inside a database transaction to ensure atomicity
    const [updatedTrip, updatedVehicle, updatedDriver] = await prisma.$transaction([
      prisma.trip.update({
        where: { id },
        data: {
          status: TripStatus.DISPATCHED,
          dispatchDate: new Date()
        },
        include: {
          vehicle: true,
          driver: true
        }
      }),
      prisma.vehicle.update({
        where: { id: vehicle.id },
        data: { status: VehicleStatus.ON_TRIP }
      }),
      prisma.driver.update({
        where: { id: driver.id },
        data: { status: DriverStatus.ON_TRIP }
      })
    ]);

    res.status(200).json({
      status: 'success',
      message: 'Trip successfully dispatched!',
      data: {
        trip: updatedTrip
      }
    });
  } catch (err) {
    next(err);
  }
};

export const completeTrip = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { finalOdometer, fuelUsed } = req.body;

    if (finalOdometer === undefined || fuelUsed === undefined) {
      return next(new AppError('Please provide finalOdometer and fuelUsed', 400));
    }

    const trip = await prisma.trip.findUnique({
      where: { id },
      include: {
        vehicle: true,
        driver: true
      }
    });

    if (!trip) {
      return next(new AppError('No trip found with that ID', 404));
    }

    if (trip.status !== TripStatus.DISPATCHED) {
      return next(new AppError(`Only DISPATCHED trips can be completed. This trip is currently ${trip.status}`, 400));
    }

    const parsedOdometer = parseFloat(finalOdometer);
    const parsedFuel = parseFloat(fuelUsed);

    // Validate odometer value
    if (parsedOdometer < trip.vehicle.currentOdometer) {
      return next(
        new AppError(
          `Final odometer (${parsedOdometer}) cannot be less than the vehicle's starting odometer (${trip.vehicle.currentOdometer})`,
          400
        )
      );
    }

    // Standard rate of 100 per litre for auto expense generation
    const fuelCostPerLitre = 100.0;
    const fuelExpenseAmount = parsedFuel * fuelCostPerLitre;

    // Run updates in a transaction
    const [updatedTrip] = await prisma.$transaction([
      prisma.trip.update({
        where: { id },
        data: {
          status: TripStatus.COMPLETED,
          finalOdometer: parsedOdometer,
          fuelUsed: parsedFuel,
          completionDate: new Date()
        },
        include: {
          vehicle: true,
          driver: true
        }
      }),
      prisma.vehicle.update({
        where: { id: trip.vehicleId },
        data: {
          status: VehicleStatus.AVAILABLE,
          currentOdometer: parsedOdometer
        }
      }),
      prisma.driver.update({
        where: { id: trip.driverId },
        data: { status: DriverStatus.AVAILABLE }
      }),
      prisma.expense.create({
        data: {
          vehicleId: trip.vehicleId,
          type: ExpenseType.FUEL,
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
  } catch (err) {
    next(err);
  }
};
