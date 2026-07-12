const BASE_URL = 'http://localhost:3000';

async function logResponse(res) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function runTests() {
  console.log('=== STARTING INTEGRATION TESTS FOR TRANSITOPS BACKEND ===\n');

  // Test 1: Health check
  console.log('Test 1: Health check...');
  const healthRes = await fetch(`${BASE_URL}/`);
  const healthData = await logResponse(healthRes);
  if (healthRes.status === 200 && healthData.status === 'success') {
    console.log('✅ Health check passed!\n');
  } else {
    console.error('❌ Health check failed!', healthData);
    process.exit(1);
  }

  // Test 2: Login as different roles
  console.log('Test 2: Authenticating users...');
  
  // Manager
  const managerLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'manager@transitops.com', password: 'manager123' })
  });
  const managerData = await logResponse(managerLoginRes);
  const managerToken = managerData.token;
  console.log(`- Fleet Manager logged in. Token length: ${managerToken.length}`);

  // Dispatcher
  const dispatcherLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'dispatcher@transitops.com', password: 'dispatcher123' })
  });
  const dispatcherData = await logResponse(dispatcherLoginRes);
  const dispatcherToken = dispatcherData.token;
  console.log(`- Dispatcher logged in. Token length: ${dispatcherToken.length}`);

  // Safety Officer
  const safetyLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'safety@transitops.com', password: 'safety123' })
  });
  const safetyData = await logResponse(safetyLoginRes);
  const safetyToken = safetyData.token;
  console.log(`- Safety Officer logged in. Token length: ${safetyToken.length}`);

  // Financial Analyst
  const financeLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'finance@transitops.com', password: 'finance123' })
  });
  const financeData = await logResponse(financeLoginRes);
  const financeToken = financeData.token;
  console.log(`- Financial Analyst logged in. Token length: ${financeToken.length}`);
  console.log('✅ Authentication tests passed!\n');


  // Test 3: RBAC Restrictions Verification
  console.log('Test 3: Testing RBAC Restrictions...');
  
  // Safety Officer should NOT be able to view Fleet registry (Blocked according to matrix)
  const fleetSafetyRes = await fetch(`${BASE_URL}/api/fleet`, {
    headers: { 'Authorization': `Bearer ${safetyToken}` }
  });
  const fleetSafetyData = await logResponse(fleetSafetyRes);
  if (fleetSafetyRes.status === 403) {
    console.log('✅ Safety Officer correctly blocked from viewing fleet registry (403 Forbidden).');
  } else {
    console.error('❌ Safety Officer was NOT blocked from fleet registry!', fleetSafetyRes.status);
    process.exit(1);
  }

  // Fleet Manager SHOULD be able to view Fleet registry
  const fleetManagerRes = await fetch(`${BASE_URL}/api/fleet`, {
    headers: { 'Authorization': `Bearer ${managerToken}` }
  });
  const fleetManagerData = await logResponse(fleetManagerRes);
  if (fleetManagerRes.status === 200) {
    console.log('✅ Fleet Manager successfully viewed fleet registry.');
  } else {
    console.error('❌ Fleet Manager failed to view fleet registry!', fleetManagerData);
    process.exit(1);
  }
  console.log('✅ RBAC restrictions verified!\n');


  // Extract specific vehicle and driver IDs for testing validations
  const vehicles = fleetManagerData.data.vehicles;
  const tTata = vehicles.find(v => v.registrationNumber === 'MH-12-AB-1234'); // Tata Prima (Cap: 16000)
  const mBolero = vehicles.find(v => v.registrationNumber === 'MH-12-CD-5678'); // Bolero (Cap: 1500)
  const vDost = vehicles.find(v => v.registrationNumber === 'MH-12-EF-9012'); // In Shop (Maintenance)

  // Get drivers
  const driversRes = await fetch(`${BASE_URL}/api/drivers`, {
    headers: { 'Authorization': `Bearer ${managerToken}` }
  });
  const driversData = await logResponse(driversRes);
  const drivers = driversData.data.drivers;
  const dJohn = drivers.find(d => d.name === 'John Doe'); // Available
  const dBob = drivers.find(d => d.name.includes('Bob Johnson')); // Expired License
  const dAlice = drivers.find(d => d.name.includes('Alice Williams')); // Suspended


  // Test 4: Business Validations - Overweight Capacity
  console.log('Test 4: Creating a trip that exceeds vehicle load capacity...');
  
  // Create trip on Bolero (Cap 1500) but cargo weight is 2000
  const tripOverweightRes = await fetch(`${BASE_URL}/api/trips`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${dispatcherToken}`
    },
    body: JSON.stringify({
      source: 'Mumbai Warehouse',
      destination: 'Thane',
      vehicleId: mBolero.id,
      driverId: dJohn.id,
      cargoWeight: 2000.0, // Overweight!
      plannedDistance: 45.0
    })
  });
  const tripOverweightData = await logResponse(tripOverweightRes);
  const overweightTripId = tripOverweightData.data.trip.id;
  console.log(`- Draft Trip created with overweight cargo (ID: ${overweightTripId})`);

  // Try to dispatch it - should fail
  const dispatchOverweightRes = await fetch(`${BASE_URL}/api/trips/${overweightTripId}/dispatch`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${dispatcherToken}` }
  });
  const dispatchOverweightData = await logResponse(dispatchOverweightRes);
  if (dispatchOverweightRes.status === 400 && dispatchOverweightData.message.includes('exceeds vehicle max load capacity')) {
    console.log('✅ Overweight dispatch correctly blocked by system validation with error message:');
    console.log(`   "${dispatchOverweightData.message}"`);
  } else {
    console.error('❌ Overweight dispatch was NOT blocked!', dispatchOverweightRes.status, dispatchOverweightData);
    process.exit(1);
  }
  console.log('');


  // Test 5: Business Validations - Expired License
  console.log('Test 5: Dispatching trip with driver having expired license...');
  
  // Create trip on Tata with Bob Johnson (expired license)
  const tripExpiredLicenseRes = await fetch(`${BASE_URL}/api/trips`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${dispatcherToken}`
    },
    body: JSON.stringify({
      source: 'Mumbai Port',
      destination: 'Nashik',
      vehicleId: tTata.id,
      driverId: dBob.id,
      cargoWeight: 5000.0,
      plannedDistance: 170.0
    })
  });
  const tripExpiredLicenseData = await logResponse(tripExpiredLicenseRes);
  const expiredLicenseTripId = tripExpiredLicenseData.data.trip.id;

  // Try to dispatch
  const dispatchExpiredRes = await fetch(`${BASE_URL}/api/trips/${expiredLicenseTripId}/dispatch`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${dispatcherToken}` }
  });
  const dispatchExpiredData = await logResponse(dispatchExpiredRes);
  if (dispatchExpiredRes.status === 400 && dispatchExpiredData.message.includes('license has expired')) {
    console.log('✅ Expired license dispatch correctly blocked by system validation with error message:');
    console.log(`   "${dispatchExpiredData.message}"`);
  } else {
    console.error('❌ Expired license dispatch was NOT blocked!', dispatchExpiredRes.status, dispatchExpiredData);
    process.exit(1);
  }
  console.log('');


  // Test 6: Successful Trip Dispatch Lifecycle
  console.log('Test 6: Executing a successful Trip Dispatch workflow...');
  
  // Create valid trip
  const tripValidRes = await fetch(`${BASE_URL}/api/trips`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${dispatcherToken}`
    },
    body: JSON.stringify({
      source: 'Mumbai Port',
      destination: 'Pune Depot',
      vehicleId: mBolero.id,
      driverId: dJohn.id,
      cargoWeight: 1200.0, // Valid (Capacity 1500)
      plannedDistance: 150.0
    })
  });
  const tripValidData = await logResponse(tripValidRes);
  const validTripId = tripValidData.data.trip.id;
  console.log(`- Draft Trip created (ID: ${validTripId})`);

  // Dispatch it
  const dispatchValidRes = await fetch(`${BASE_URL}/api/trips/${validTripId}/dispatch`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${dispatcherToken}` }
  });
  const dispatchValidData = await logResponse(dispatchValidRes);
  if (dispatchValidRes.status === 200) {
    console.log('✅ Trip successfully dispatched! Status is now DISPATCHED.');
  } else {
    console.error('❌ Valid trip dispatch failed!', dispatchValidData);
    process.exit(1);
  }

  // Verify Vehicle & Driver status is updated to ON_TRIP
  const verifyVehicleRes = await fetch(`${BASE_URL}/api/fleet/${mBolero.id}`, {
    headers: { 'Authorization': `Bearer ${managerToken}` }
  });
  const verifyVehicle = (await logResponse(verifyVehicleRes)).data.vehicle;
  
  const verifyDriverRes = await fetch(`${BASE_URL}/api/drivers/${dJohn.id}`, {
    headers: { 'Authorization': `Bearer ${managerToken}` }
  });
  const verifyDriver = (await logResponse(verifyDriverRes)).data.driver;

  if (verifyVehicle.status === 'ON_TRIP' && verifyDriver.status === 'ON_TRIP') {
    console.log('✅ Vehicle and Driver status successfully updated to ON_TRIP.');
  } else {
    console.error('❌ Status update failed!', verifyVehicle.status, verifyDriver.status);
    process.exit(1);
  }
  console.log('');


  // Test 7: Trip Completion
  console.log('Test 7: Completing the Trip...');
  
  const completeTripRes = await fetch(`${BASE_URL}/api/trips/${validTripId}/complete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${dispatcherToken}`
    },
    body: JSON.stringify({
      finalOdometer: 45160.0, // start was 45000 (past completed trip modified it. Bolero starts at 45000 in database)
      fuelUsed: 18.0
    })
  });
  const completeTripData = await logResponse(completeTripRes);
  if (completeTripRes.status === 200) {
    console.log('✅ Trip marked completed successfully!');
  } else {
    console.error('❌ Trip completion failed!', completeTripData);
    process.exit(1);
  }

  // Verify vehicle and driver status is back to AVAILABLE, and vehicle odometer is updated
  const verifyPostVehicleRes = await fetch(`${BASE_URL}/api/fleet/${mBolero.id}`, {
    headers: { 'Authorization': `Bearer ${managerToken}` }
  });
  const verifyPostVehicle = (await logResponse(verifyPostVehicleRes)).data.vehicle;

  const verifyPostDriverRes = await fetch(`${BASE_URL}/api/drivers/${dJohn.id}`, {
    headers: { 'Authorization': `Bearer ${managerToken}` }
  });
  const verifyPostDriver = (await logResponse(verifyPostDriverRes)).data.driver;

  if (verifyPostVehicle.status === 'AVAILABLE' && verifyPostDriver.status === 'AVAILABLE' && verifyPostVehicle.currentOdometer === 45160.0) {
    console.log('✅ Vehicle and Driver status returned to AVAILABLE. Vehicle currentOdometer updated to 45160.');
  } else {
    console.error('❌ Post-trip checks failed!', verifyPostVehicle, verifyPostDriver);
    process.exit(1);
  }

  // Verify automated fuel expense creation
  const expensesRes = await fetch(`${BASE_URL}/api/expenses?vehicleId=${mBolero.id}&type=FUEL`, {
    headers: { 'Authorization': `Bearer ${managerToken}` }
  });
  const expensesData = await logResponse(expensesRes);
  const autoFuelExpense = expensesData.data.expenses.find(e => e.description.includes('Automated fuel entry'));
  if (autoFuelExpense && autoFuelExpense.amount === 1800.0) { // 18L * 100
    console.log(`✅ Automated Fuel Expense verified! Recorded amount: INR ${autoFuelExpense.amount} for ${autoFuelExpense.litres} Litres.`);
  } else {
    console.error('❌ Automated fuel expense check failed!', expensesData);
    process.exit(1);
  }
  console.log('');


  // Test 8: Maintenance Log transitions
  console.log('Test 8: Testing Maintenance service transitions...');
  
  // Tata Prima (MH-12-AB-1234) is currently AVAILABLE. Put it in maintenance
  const maintRes = await fetch(`${BASE_URL}/api/maintenance`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${managerToken}`
    },
    body: JSON.stringify({
      vehicleId: tTata.id,
      description: 'Scheduled engine tuning and oil change'
    })
  });
  const maintData = await logResponse(maintRes);
  const maintRecordId = maintData.data.record.id;
  console.log(`- Logged maintenance record (ID: ${maintRecordId})`);

  // Verify vehicle status is now IN_SHOP
  const verifyMaintVehicleRes = await fetch(`${BASE_URL}/api/fleet/${tTata.id}`, {
    headers: { 'Authorization': `Bearer ${managerToken}` }
  });
  const verifyMaintVehicle = (await logResponse(verifyMaintVehicleRes)).data.vehicle;
  if (verifyMaintVehicle.status === 'IN_SHOP') {
    console.log('✅ Vehicle status correctly updated to IN_SHOP.');
  } else {
    console.error('❌ Maintenance vehicle status not updated!', verifyMaintVehicle.status);
    process.exit(1);
  }

  // Attempt to dispatch a new trip on this maintenance vehicle (Should fail!)
  const tripMaintVehicleRes = await fetch(`${BASE_URL}/api/trips`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${dispatcherToken}`
    },
    body: JSON.stringify({
      source: 'Mumbai Port',
      destination: 'Vashi Depot',
      vehicleId: tTata.id,
      driverId: dJohn.id,
      cargoWeight: 3000.0,
      plannedDistance: 20.0
    })
  });
  const tripMaintVehicleData = await logResponse(tripMaintVehicleRes);
  const maintVehicleTripId = tripMaintVehicleData.data.trip.id;

  const dispatchMaintRes = await fetch(`${BASE_URL}/api/trips/${maintVehicleTripId}/dispatch`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${dispatcherToken}` }
  });
  const dispatchMaintData = await logResponse(dispatchMaintRes);
  if (dispatchMaintRes.status === 400 && dispatchMaintData.message.includes('Vehicle is not available')) {
    console.log('✅ Dispatch blocked on maintenance vehicle with expected message:');
    console.log(`   "${dispatchMaintData.message}"`);
  } else {
    console.error('❌ Dispatch on maintenance vehicle was NOT blocked!', dispatchMaintRes.status, dispatchMaintData);
    process.exit(1);
  }

  // Complete the maintenance
  const completeMaintRes = await fetch(`${BASE_URL}/api/maintenance/${maintRecordId}/complete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${managerToken}`
    },
    body: JSON.stringify({
      cost: 4500.0
    })
  });
  const completeMaintData = await logResponse(completeMaintRes);
  if (completeMaintRes.status === 200) {
    console.log('✅ Maintenance marked completed!');
  } else {
    console.error('❌ Maintenance completion failed!', completeMaintData);
    process.exit(1);
  }

  // Verify vehicle is back to AVAILABLE and maintenance expense generated
  const verifyPostMaintVehicleRes = await fetch(`${BASE_URL}/api/fleet/${tTata.id}`, {
    headers: { 'Authorization': `Bearer ${managerToken}` }
  });
  const verifyPostMaintVehicle = (await logResponse(verifyPostMaintVehicleRes)).data.vehicle;
  if (verifyPostMaintVehicle.status === 'AVAILABLE') {
    console.log('✅ Vehicle status restored to AVAILABLE.');
  } else {
    console.error('❌ Post-maintenance status check failed!', verifyPostMaintVehicle.status);
    process.exit(1);
  }

  const maintExpensesRes = await fetch(`${BASE_URL}/api/expenses?vehicleId=${tTata.id}&type=MAINTENANCE`, {
    headers: { 'Authorization': `Bearer ${managerToken}` }
  });
  const maintExpensesData = await logResponse(maintExpensesRes);
  const autoMaintExpense = maintExpensesData.data.expenses.find(e => e.description.includes('Maintenance expense'));
  if (autoMaintExpense && autoMaintExpense.amount === 4500.0) {
    console.log(`✅ Automated Maintenance Expense verified! Recorded amount: INR ${autoMaintExpense.amount}.`);
  } else {
    console.error('❌ Automated maintenance expense check failed!', maintExpensesData);
    process.exit(1);
  }
  console.log('');


  // Test 9: Analytics & Reporting Aggregation
  console.log('Test 9: Testing Analytics KPI calculations...');
  const kpisRes = await fetch(`${BASE_URL}/api/analytics/kpis`, {
    headers: { 'Authorization': `Bearer ${managerToken}` }
  });
  const kpisData = (await logResponse(kpisRes)).data;
  console.log('- Dashboard counts retrieved successfully:');
  console.log(`  * Available Vehicles: ${kpisData.availableVehicles}`);
  console.log(`  * Active Vehicles (On Trip): ${kpisData.activeVehicles}`);
  console.log(`  * In Maintenance (In Shop): ${kpisData.inMaintenance}`);
  console.log(`  * Drivers On Duty: ${kpisData.driversOnDuty}`);
  console.log(`  * Fleet Utilization Rate: ${kpisData.fleetUtilization}%`);

  const reportsRes = await fetch(`${BASE_URL}/api/analytics/reports`, {
    headers: { 'Authorization': `Bearer ${managerToken}` }
  });
  const reportsData = (await logResponse(reportsRes)).data;
  console.log('- Analytics reports calculated successfully:');
  console.log(`  * Average Fuel Efficiency: ${reportsData.fuelEfficiency} km/l`);
  console.log(`  * Total Operational Expenses: INR ${reportsData.totalOperationalCost}`);
  
  console.log('\n=== ALL END-TO-END WORKFLOW INTEGRATION TESTS PASSED SUCCESSFULLY! ===');
}

runTests().catch((err) => {
  console.error('Test run failed with error:', err);
  process.exit(1);
});
