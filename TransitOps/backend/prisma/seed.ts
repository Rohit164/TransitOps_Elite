import { PrismaClient, Role, VehicleStatus, DriverStatus, ExpenseType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing database...');
  await prisma.expense.deleteMany({});
  await prisma.maintenanceRecord.deleteMany({});
  await prisma.trip.deleteMany({});
  await prisma.driver.deleteMany({});
  await prisma.vehicle.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('Seeding roles and users...');
  
  // Hashed passwords
  const managerPassword = await bcrypt.hash('manager123', 10);
  const dispatcherPassword = await bcrypt.hash('dispatcher123', 10);
  const safetyPassword = await bcrypt.hash('safety123', 10);
  const financePassword = await bcrypt.hash('finance123', 10);

  const userManager = await prisma.user.create({
    data: {
      email: 'manager@transitops.com',
      password: managerPassword,
      name: 'Michael Scott (Fleet Manager)',
      role: Role.FLEET_MANAGER
    }
  });

  const userDispatcher = await prisma.user.create({
    data: {
      email: 'dispatcher@transitops.com',
      password: dispatcherPassword,
      name: 'Pam Beesly (Dispatcher)',
      role: Role.DISPATCHER
    }
  });

  const userSafety = await prisma.user.create({
    data: {
      email: 'safety@transitops.com',
      password: safetyPassword,
      name: 'Dwight Schrute (Safety Officer)',
      role: Role.SAFETY_OFFICER
    }
  });

  const userFinance = await prisma.user.create({
    data: {
      email: 'finance@transitops.com',
      password: financePassword,
      name: 'Oscar Martinez (Financial Analyst)',
      role: Role.FINANCIAL_ANALYST
    }
  });

  console.log('Seeding vehicles...');
  
  // Available Truck
  const vehicle1 = await prisma.vehicle.create({
    data: {
      registrationNumber: 'MH-12-AB-1234',
      name: 'Tata Prima 2825.K',
      type: 'Heavy Truck',
      maxLoadCapacity: 16000.0, // 16 tons
      acquisitionCost: 4500000.0,
      currentOdometer: 12500.0,
      status: VehicleStatus.AVAILABLE
    }
  });

  // Available Pickup
  const vehicle2 = await prisma.vehicle.create({
    data: {
      registrationNumber: 'MH-12-CD-5678',
      name: 'Mahindra Bolero Pik-Up',
      type: 'Pickup',
      maxLoadCapacity: 1500.0, // 1.5 tons
      acquisitionCost: 900000.0,
      currentOdometer: 45000.0,
      status: VehicleStatus.AVAILABLE
    }
  });

  // Vehicle in Shop (Maintenance)
  const vehicle3 = await prisma.vehicle.create({
    data: {
      registrationNumber: 'MH-12-EF-9012',
      name: 'Ashok Leyland Dost',
      type: 'Mini Van',
      maxLoadCapacity: 1250.0,
      acquisitionCost: 750000.0,
      currentOdometer: 82000.0,
      status: VehicleStatus.IN_SHOP
    }
  });

  // Retired Vehicle
  const vehicle4 = await prisma.vehicle.create({
    data: {
      registrationNumber: 'MH-12-GH-3456',
      name: 'Eicher Pro 2049',
      type: 'Medium Truck',
      maxLoadCapacity: 3500.0,
      acquisitionCost: 1400000.0,
      currentOdometer: 198000.0,
      status: VehicleStatus.RETIRED
    }
  });

  console.log('Seeding drivers...');

  // Driver 1: Available
  const nextYear = new Date();
  nextYear.setFullYear(nextYear.getFullYear() + 1);

  const driver1 = await prisma.driver.create({
    data: {
      name: 'John Doe',
      licenseNumber: 'DL-1234567890',
      licenseCategory: 'Heavy Goods',
      licenseExpiry: nextYear,
      contactNumber: '9876543210',
      safetyScore: 92.5,
      status: DriverStatus.AVAILABLE
    }
  });

  // Driver 2: Available (Light)
  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 1);

  const driver2 = await prisma.driver.create({
    data: {
      name: 'Jane Smith',
      licenseNumber: 'DL-0987654321',
      licenseCategory: 'Light Commercial',
      licenseExpiry: nextMonth,
      contactNumber: '8765432109',
      safetyScore: 88.0,
      status: DriverStatus.AVAILABLE
    }
  });

  // Driver 3: Expired License (Cannot be assigned)
  const lastYear = new Date();
  lastYear.setFullYear(lastYear.getFullYear() - 1);

  const driver3 = await prisma.driver.create({
    data: {
      name: 'Bob Johnson (Expired License)',
      licenseNumber: 'DL-5555555555',
      licenseCategory: 'Heavy Goods',
      licenseExpiry: lastYear,
      contactNumber: '7654321098',
      safetyScore: 75.0,
      status: DriverStatus.AVAILABLE
    }
  });

  // Driver 4: Suspended (Cannot be assigned)
  const driver4 = await prisma.driver.create({
    data: {
      name: 'Alice Williams (Suspended)',
      licenseNumber: 'DL-4444444444',
      licenseCategory: 'Medium Goods',
      licenseExpiry: nextYear,
      contactNumber: '6543210987',
      safetyScore: 95.0,
      status: DriverStatus.SUSPENDED
    }
  });

  console.log('Seeding trips...');

  // Past completed trip
  const tripPast = await prisma.trip.create({
    data: {
      source: 'Mumbai',
      destination: 'Pune',
      vehicleId: vehicle2.id,
      driverId: driver2.id,
      cargoWeight: 1000.0,
      plannedDistance: 150.0,
      finalOdometer: 45150.0,
      fuelUsed: 15.0,
      status: 'COMPLETED',
      dispatchDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
      completionDate: new Date(Date.now() - 20 * 60 * 60 * 1000)
    }
  });

  console.log('Seeding maintenance records...');
  
  // Ongoing maintenance for Vehicle 3
  await prisma.maintenanceRecord.create({
    data: {
      vehicleId: vehicle3.id,
      description: 'Engine overhaul & brake replacement',
      startDate: new Date(Date.now() - 48 * 60 * 60 * 1000),
      status: 'IN_PROGRESS'
    }
  });

  console.log('Seeding expenses...');

  // Record fuel expense for the past trip
  await prisma.expense.create({
    data: {
      vehicleId: vehicle2.id,
      type: ExpenseType.FUEL,
      amount: 1500.0, // 15 liters * 100 per liter
      litres: 15.0,
      date: new Date(Date.now() - 22 * 60 * 60 * 1000),
      description: 'Refuel at Mumbai highway'
    }
  });

  // Record toll expense
  await prisma.expense.create({
    data: {
      vehicleId: vehicle2.id,
      type: ExpenseType.TOLL,
      amount: 320.0,
      date: new Date(Date.now() - 21 * 60 * 60 * 1000),
      description: 'Mumbai-Pune Expressway Toll'
    }
  });

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
