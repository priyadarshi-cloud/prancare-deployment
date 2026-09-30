const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '..', 'dev.db');
const db = new Database(dbPath);

console.log('Seeding PranCare database at', dbPath);

// Create tables if not exist
db.exec(`
  CREATE TABLE IF NOT EXISTS scans (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    image_refs TEXT NOT NULL,
    medicine_name TEXT,
    brand_name TEXT,
    active_ingredients TEXT,
    manufacturer TEXT,
    batch_number TEXT,
    manufacturing_date TEXT,
    expiry_date TEXT,
    barcode TEXT,
    extraction_raw TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS verifications (
    id TEXT PRIMARY KEY,
    scan_id TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL,
    primary_reason TEXT NOT NULL,
    confidence TEXT NOT NULL,
    checks_json TEXT NOT NULL,
    sources_json TEXT NOT NULL,
    is_demo INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS family_members (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    relation TEXT NOT NULL,
    avatar TEXT,
    next_dose_time TEXT NOT NULL,
    medicine_name TEXT NOT NULL,
    status TEXT NOT NULL,
    stock_count INTEGER NOT NULL DEFAULT 10,
    refill_status TEXT NOT NULL DEFAULT 'ok',
    alert_on_missed INTEGER NOT NULL DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS reminders (
    id TEXT PRIMARY KEY,
    patient_name TEXT NOT NULL,
    medicine TEXT NOT NULL,
    dose TEXT NOT NULL,
    times_json TEXT NOT NULL,
    frequency TEXT NOT NULL,
    stock_count INTEGER NOT NULL DEFAULT 10,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS aggregate_events (
    id TEXT PRIMARY KEY,
    geo_cell TEXT NOT NULL,
    week TEXT NOT NULL,
    medicine_norm TEXT NOT NULL,
    manufacturer_norm TEXT NOT NULL,
    status TEXT NOT NULL,
    reason TEXT NOT NULL,
    is_synthetic INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Clear old seeds
db.prepare('DELETE FROM family_members').run();
db.prepare('DELETE FROM reminders').run();
db.prepare('DELETE FROM aggregate_events WHERE is_synthetic = 1').run();

// Seed Family Members matching Mockup
const insertFamily = db.prepare(`
  INSERT INTO family_members (id, name, relation, avatar, next_dose_time, medicine_name, status, stock_count, refill_status, alert_on_missed)
  VALUES (@id, @name, @relation, @avatar, @next_dose_time, @medicine_name, @status, @stock_count, @refill_status, @alert_on_missed)
`);

insertFamily.run({
  id: 'fam-dadi',
  name: 'Dadi',
  relation: 'Grandmother',
  avatar: '👵',
  next_dose_time: '8:00 AM',
  medicine_name: 'BP Medicine (Amlodipine 5mg)',
  status: 'taken',
  stock_count: 5,
  refill_status: 'ok',
  alert_on_missed: 1
});

insertFamily.run({
  id: 'fam-dada',
  name: 'Dada',
  relation: 'Grandfather',
  avatar: '👴',
  next_dose_time: '2:00 PM',
  medicine_name: 'Diabetes Medicine (Metformin 500mg)',
  status: 'missed',
  stock_count: 5,
  refill_status: 'scheduled',
  alert_on_missed: 1
});

// Seed Reminders
const insertReminder = db.prepare(`
  INSERT INTO reminders (id, patient_name, medicine, dose, times_json, frequency, stock_count)
  VALUES (@id, @patient_name, @medicine, @dose, @times_json, @frequency, @stock_count)
`);

insertReminder.run({
  id: 'rem-1',
  patient_name: 'Dadi',
  medicine: 'Amlodipine',
  dose: '5 mg - 1 Tablet',
  times_json: JSON.stringify(['08:00', '20:00']),
  frequency: 'Twice daily after meals',
  stock_count: 5
});

insertReminder.run({
  id: 'rem-2',
  patient_name: 'Dada',
  medicine: 'Metformin',
  dose: '500 mg - 1 Tablet',
  times_json: JSON.stringify(['14:00']),
  frequency: 'Once daily after lunch',
  stock_count: 5
});

// Seed synthetic India-wide aggregate scan events for Medicine Safety Map
// Cities & coarse cells across India
const cities = [
  { cell: 'IN-DL-CENTRAL', name: 'Central Delhi', state: 'Delhi', lat: 28.6139, lng: 77.2090, bias: 'suspicious_hotspot' },
  { cell: 'IN-DL-NORTH', name: 'North Delhi', state: 'Delhi', lat: 28.7041, lng: 77.1025, bias: 'mixed' },
  { cell: 'IN-DL-SOUTH', name: 'South Delhi', state: 'Delhi', lat: 28.4817, lng: 77.1873, bias: 'verified' },
  { cell: 'IN-MH-MUMBAI', name: 'Mumbai City', state: 'Maharashtra', lat: 18.9220, lng: 72.8347, bias: 'verified' },
  { cell: 'IN-MH-THANE', name: 'Thane', state: 'Maharashtra', lat: 19.2183, lng: 72.9781, bias: 'needs_verification' },
  { cell: 'IN-MH-PUNE', name: 'Pune', state: 'Maharashtra', lat: 18.5204, lng: 73.8567, bias: 'verified' },
  { cell: 'IN-KA-BLR-NORTH', name: 'Bengaluru North', state: 'Karnataka', lat: 13.0358, lng: 77.5970, bias: 'verified' },
  { cell: 'IN-KA-BLR-SOUTH', name: 'Bengaluru South', state: 'Karnataka', lat: 12.9250, lng: 77.5898, bias: 'verified' },
  { cell: 'IN-WB-KOLKATA', name: 'Kolkata', state: 'West Bengal', lat: 22.5726, lng: 88.3639, bias: 'mixed' },
  { cell: 'IN-TN-CHENNAI', name: 'Chennai Central', state: 'Tamil Nadu', lat: 13.0827, lng: 80.2707, bias: 'verified' },
  { cell: 'IN-TG-HYD', name: 'Hyderabad', state: 'Telangana', lat: 17.3850, lng: 78.4867, bias: 'verified' },
  { cell: 'IN-GJ-AHM', name: 'Ahmedabad', state: 'Gujarat', lat: 23.0225, lng: 72.5714, bias: 'verified' },
  { cell: 'IN-UP-LKO', name: 'Lucknow', state: 'Uttar Pradesh', lat: 26.8467, lng: 80.9462, bias: 'suspicious_hotspot' },
  { cell: 'IN-UP-KAN', name: 'Kanpur', state: 'Uttar Pradesh', lat: 26.4499, lng: 80.3319, bias: 'mixed' },
  { cell: 'IN-BR-PATNA', name: 'Patna', state: 'Bihar', lat: 25.5941, lng: 85.1376, bias: 'needs_verification' },
  { cell: 'IN-RJ-JAIPUR', name: 'Jaipur', state: 'Rajasthan', lat: 26.9124, lng: 75.7873, bias: 'verified' },
  { cell: 'IN-PB-CHD', name: 'Chandigarh', state: 'Punjab/Haryana', lat: 30.7333, lng: 76.7794, bias: 'verified' }
];

const medicines = [
  { name: 'paracetamol', mfr: 'demo_pharma' },
  { name: 'azithromycin', mfr: 'cipla_ltd' },
  { name: 'metformin', mfr: 'sun_pharma' },
  { name: 'pantoprazole', mfr: 'alchem_labs' },
  { name: 'amoxicillin', mfr: 'mismatch_pharma' },
  { name: 'atorvastatin', mfr: 'zydus_life' }
];

const insertEvent = db.prepare(`
  INSERT INTO aggregate_events (id, geo_cell, week, medicine_norm, manufacturer_norm, status, reason, is_synthetic)
  VALUES (@id, @geo_cell, @week, @medicine_norm, @manufacturer_norm, @status, @reason, 1)
`);

let totalEvents = 0;
const weeks = ['2026-W35', '2026-W36', '2026-W37'];

db.transaction(() => {
  for (const city of cities) {
    // Generate between 15 and 35 events per cell to satisfy k-anonymity (>= 5)
    const count = Math.floor(Math.random() * 20) + 15;
    for (let i = 0; i < count; i++) {
      const med = medicines[Math.floor(Math.random() * medicines.length)];
      const week = weeks[Math.floor(Math.random() * weeks.length)];
      let status = 'VERIFIED';
      let reason = 'ALL_CHECKS_PASSED';

      const rand = Math.random();
      if (city.bias === 'suspicious_hotspot') {
        if (rand < 0.45) {
          status = 'SUSPICIOUS';
          reason = 'MFR_MISMATCH';
        } else if (rand < 0.70) {
          status = 'NEEDS_VERIFICATION';
          reason = 'BATCH_UNVERIFIED';
        }
      } else if (city.bias === 'needs_verification') {
        if (rand < 0.55) {
          status = 'NEEDS_VERIFICATION';
          reason = 'PRODUCT_NOT_IN_CATALOG';
        } else if (rand < 0.70) {
          status = 'SUSPICIOUS';
          reason = 'SUSPICIOUS_OBSERVATION';
        }
      } else if (city.bias === 'mixed') {
        if (rand < 0.25) {
          status = 'SUSPICIOUS';
          reason = 'RECALLED_BATCH';
        } else if (rand < 0.55) {
          status = 'NEEDS_VERIFICATION';
          reason = 'BATCH_UNVERIFIED';
        }
      } else {
        // Mostly verified
        if (rand < 0.10) {
          status = 'SUSPICIOUS';
          reason = 'EXPIRED_PRODUCT';
        } else if (rand < 0.25) {
          status = 'NEEDS_VERIFICATION';
          reason = 'BATCH_UNVERIFIED';
        }
      }

      insertEvent.run({
        id: `evt-${city.cell}-${week}-${i}`,
        geo_cell: city.cell,
        week: week,
        medicine_norm: med.name,
        manufacturer_norm: med.mfr,
        status: status,
        reason: reason
      });
      totalEvents++;
    }
  }
})();

console.log(`Database seeded successfully! Generated ${totalEvents} aggregate events across ${cities.length} Indian regions.`);
