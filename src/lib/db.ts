import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = process.env.VERCEL === '1'
  ? '/tmp/prancare.db'
  : process.env.DATABASE_URL
    ? process.env.DATABASE_URL.replace('file:', '')
    : path.join(process.cwd(), 'dev.db');

const dbDir = path.dirname(path.resolve(dbPath));
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export const db = new Database(dbPath);

// Initialize schema on load
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
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(scan_id) REFERENCES scans(id)
  );

  CREATE TABLE IF NOT EXISTS family_members (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    relation TEXT NOT NULL,
    avatar TEXT,
    next_dose_time TEXT NOT NULL,
    medicine_name TEXT NOT NULL,
    status TEXT NOT NULL, -- taken | missed | pending
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

  -- ── Smart Health & Supply Chain Schema ──────────────────────────────────────
  CREATE TABLE IF NOT EXISTS supply_facilities (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    district TEXT NOT NULL,
    state TEXT NOT NULL,
    tier TEXT NOT NULL, -- 'DH' | 'CHC' | 'PHC'
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    contact_person TEXT,
    phone TEXT
  );

  CREATE TABLE IF NOT EXISTS supply_inventory (
    id TEXT PRIMARY KEY,
    facility_id TEXT NOT NULL,
    medicine_name TEXT NOT NULL,
    category TEXT NOT NULL,
    batch_number TEXT NOT NULL,
    current_stock INTEGER NOT NULL,
    daily_consumption_rate INTEGER NOT NULL,
    days_of_supply REAL NOT NULL,
    stock_status TEXT NOT NULL, -- 'CRITICAL' | 'WARNING' | 'ADEQUATE' | 'SURPLUS'
    expiry_date TEXT NOT NULL,
    last_audited_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(facility_id) REFERENCES supply_facilities(id)
  );

  CREATE TABLE IF NOT EXISTS supply_forecasts (
    id TEXT PRIMARY KEY,
    facility_id TEXT NOT NULL,
    medicine_name TEXT NOT NULL,
    period_label TEXT NOT NULL,
    projected_demand INTEGER NOT NULL,
    current_stock INTEGER NOT NULL,
    projected_deficit INTEGER NOT NULL,
    predicted_stockout_date TEXT,
    surge_factor_reason TEXT,
    FOREIGN KEY(facility_id) REFERENCES supply_facilities(id)
  );

  CREATE TABLE IF NOT EXISTS supply_redistributions (
    id TEXT PRIMARY KEY,
    medicine_name TEXT NOT NULL,
    source_facility_id TEXT NOT NULL,
    target_facility_id TEXT NOT NULL,
    transfer_units INTEGER NOT NULL,
    urgency TEXT NOT NULL, -- 'CRITICAL' | 'MODERATE'
    status TEXT NOT NULL DEFAULT 'PROPOSED', -- 'PROPOSED' | 'APPROVED' | 'IN_TRANSIT' | 'COMPLETED'
    rationale TEXT NOT NULL,
    distance_km REAL NOT NULL,
    est_transit_hours REAL NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(source_facility_id) REFERENCES supply_facilities(id),
    FOREIGN KEY(target_facility_id) REFERENCES supply_facilities(id)
  );
`);

// ── Inline demo seed ────────────────────────────────────────────────────────
// Runs only when family_members AND aggregate_events are both empty.
// This handles Vercel cold-starts where /tmp/prancare.db is brand-new.
// Local dev.db is already seeded → COUNT > 0 → returns immediately.
// Uses INSERT OR IGNORE so repeated calls are safe.
function seedDemoDataIfEmpty(): void {
  const familyCount = (
    db.prepare('SELECT COUNT(*) as c FROM family_members').get() as { c: number }
  ).c;
  const eventsCount = (
    db.prepare('SELECT COUNT(*) as c FROM aggregate_events').get() as { c: number }
  ).c;
  if (familyCount > 0 && eventsCount > 0) return;

  // ── Family members ──────────────────────────────────────────────────────
  const insertFamily = db.prepare(`
    INSERT OR IGNORE INTO family_members
      (id, name, relation, avatar, next_dose_time, medicine_name,
       status, stock_count, refill_status, alert_on_missed)
    VALUES
      (@id, @name, @relation, @avatar, @next_dose_time, @medicine_name,
       @status, @stock_count, @refill_status, @alert_on_missed)
  `);
  insertFamily.run({
    id: 'fam-dadi', name: 'Dadi', relation: 'Grandmother', avatar: '👵',
    next_dose_time: '8:00 AM', medicine_name: 'BP Medicine (Amlodipine 5mg)',
    status: 'taken', stock_count: 5, refill_status: 'ok', alert_on_missed: 1,
  });
  insertFamily.run({
    id: 'fam-dada', name: 'Dada', relation: 'Grandfather', avatar: '👴',
    next_dose_time: '2:00 PM', medicine_name: 'Diabetes Medicine (Metformin 500mg)',
    status: 'missed', stock_count: 5, refill_status: 'scheduled', alert_on_missed: 1,
  });

  // ── Reminders ───────────────────────────────────────────────────────────
  const insertReminder = db.prepare(`
    INSERT OR IGNORE INTO reminders
      (id, patient_name, medicine, dose, times_json, frequency, stock_count)
    VALUES
      (@id, @patient_name, @medicine, @dose, @times_json, @frequency, @stock_count)
  `);
  insertReminder.run({
    id: 'rem-1', patient_name: 'Dadi', medicine: 'Amlodipine',
    dose: '5 mg - 1 Tablet', times_json: '["08:00","20:00"]',
    frequency: 'Twice daily after meals', stock_count: 5,
  });
  insertReminder.run({
    id: 'rem-2', patient_name: 'Dada', medicine: 'Metformin',
    dose: '500 mg - 1 Tablet', times_json: '["14:00"]',
    frequency: 'Once daily after lunch', stock_count: 5,
  });

  // ── Synthetic aggregate events for Safety Map ───────────────────────────
  // 17 Indian cities × 20 fixed events = 340 rows, satisfying k-anonymity ≥ 5.
  // Statuses are deterministic (no Math.random) so the function is pure/idempotent.
  type CityBias = 'suspicious_hotspot' | 'needs_verification' | 'mixed' | 'verified';
  const cities: Array<{ cell: string; bias: CityBias }> = [
    { cell: 'IN-DL-CENTRAL',   bias: 'suspicious_hotspot' },
    { cell: 'IN-DL-NORTH',     bias: 'mixed' },
    { cell: 'IN-DL-SOUTH',     bias: 'verified' },
    { cell: 'IN-MH-MUMBAI',    bias: 'verified' },
    { cell: 'IN-MH-THANE',     bias: 'needs_verification' },
    { cell: 'IN-MH-PUNE',      bias: 'verified' },
    { cell: 'IN-KA-BLR-NORTH', bias: 'verified' },
    { cell: 'IN-KA-BLR-SOUTH', bias: 'verified' },
    { cell: 'IN-WB-KOLKATA',   bias: 'mixed' },
    { cell: 'IN-TN-CHENNAI',   bias: 'verified' },
    { cell: 'IN-TG-HYD',       bias: 'verified' },
    { cell: 'IN-GJ-AHM',       bias: 'verified' },
    { cell: 'IN-UP-LKO',       bias: 'suspicious_hotspot' },
    { cell: 'IN-UP-KAN',       bias: 'mixed' },
    { cell: 'IN-BR-PATNA',     bias: 'needs_verification' },
    { cell: 'IN-RJ-JAIPUR',    bias: 'verified' },
    { cell: 'IN-PB-CHD',       bias: 'verified' },
  ];

  const medicines = [
    { name: 'paracetamol',  mfr: 'demo_pharma' },
    { name: 'azithromycin', mfr: 'cipla_ltd' },
    { name: 'metformin',    mfr: 'sun_pharma' },
    { name: 'pantoprazole', mfr: 'alchem_labs' },
    { name: 'amoxicillin',  mfr: 'mismatch_pharma' },
    { name: 'atorvastatin', mfr: 'zydus_life' },
  ];

  // Deterministic status pattern per bias (repeating cycle of 20)
  // Each entry is [status, reason]
  const biasPatterns: Record<CityBias, Array<[string, string]>> = {
    suspicious_hotspot: [
      ['SUSPICIOUS',          'MFR_MISMATCH'],
      ['SUSPICIOUS',          'MFR_MISMATCH'],
      ['SUSPICIOUS',          'MFR_MISMATCH'],
      ['SUSPICIOUS',          'MFR_MISMATCH'],
      ['SUSPICIOUS',          'MFR_MISMATCH'],
      ['SUSPICIOUS',          'MFR_MISMATCH'],
      ['SUSPICIOUS',          'MFR_MISMATCH'],
      ['SUSPICIOUS',          'MFR_MISMATCH'],
      ['SUSPICIOUS',          'MFR_MISMATCH'],
      ['NEEDS_VERIFICATION',  'BATCH_UNVERIFIED'],
      ['NEEDS_VERIFICATION',  'BATCH_UNVERIFIED'],
      ['NEEDS_VERIFICATION',  'BATCH_UNVERIFIED'],
      ['NEEDS_VERIFICATION',  'BATCH_UNVERIFIED'],
      ['NEEDS_VERIFICATION',  'BATCH_UNVERIFIED'],
      ['VERIFIED',            'ALL_CHECKS_PASSED'],
      ['VERIFIED',            'ALL_CHECKS_PASSED'],
      ['VERIFIED',            'ALL_CHECKS_PASSED'],
      ['VERIFIED',            'ALL_CHECKS_PASSED'],
      ['VERIFIED',            'ALL_CHECKS_PASSED'],
      ['VERIFIED',            'ALL_CHECKS_PASSED'],
    ],
    needs_verification: [
      ['NEEDS_VERIFICATION',  'PRODUCT_NOT_IN_CATALOG'],
      ['NEEDS_VERIFICATION',  'PRODUCT_NOT_IN_CATALOG'],
      ['NEEDS_VERIFICATION',  'PRODUCT_NOT_IN_CATALOG'],
      ['NEEDS_VERIFICATION',  'PRODUCT_NOT_IN_CATALOG'],
      ['NEEDS_VERIFICATION',  'PRODUCT_NOT_IN_CATALOG'],
      ['NEEDS_VERIFICATION',  'PRODUCT_NOT_IN_CATALOG'],
      ['NEEDS_VERIFICATION',  'PRODUCT_NOT_IN_CATALOG'],
      ['NEEDS_VERIFICATION',  'PRODUCT_NOT_IN_CATALOG'],
      ['NEEDS_VERIFICATION',  'PRODUCT_NOT_IN_CATALOG'],
      ['NEEDS_VERIFICATION',  'PRODUCT_NOT_IN_CATALOG'],
      ['NEEDS_VERIFICATION',  'PRODUCT_NOT_IN_CATALOG'],
      ['SUSPICIOUS',          'SUSPICIOUS_OBSERVATION'],
      ['SUSPICIOUS',          'SUSPICIOUS_OBSERVATION'],
      ['SUSPICIOUS',          'SUSPICIOUS_OBSERVATION'],
      ['VERIFIED',            'ALL_CHECKS_PASSED'],
      ['VERIFIED',            'ALL_CHECKS_PASSED'],
      ['VERIFIED',            'ALL_CHECKS_PASSED'],
      ['VERIFIED',            'ALL_CHECKS_PASSED'],
      ['VERIFIED',            'ALL_CHECKS_PASSED'],
      ['VERIFIED',            'ALL_CHECKS_PASSED'],
    ],
    mixed: [
      ['SUSPICIOUS',          'RECALLED_BATCH'],
      ['SUSPICIOUS',          'RECALLED_BATCH'],
      ['SUSPICIOUS',          'RECALLED_BATCH'],
      ['SUSPICIOUS',          'RECALLED_BATCH'],
      ['SUSPICIOUS',          'RECALLED_BATCH'],
      ['NEEDS_VERIFICATION',  'BATCH_UNVERIFIED'],
      ['NEEDS_VERIFICATION',  'BATCH_UNVERIFIED'],
      ['NEEDS_VERIFICATION',  'BATCH_UNVERIFIED'],
      ['NEEDS_VERIFICATION',  'BATCH_UNVERIFIED'],
      ['NEEDS_VERIFICATION',  'BATCH_UNVERIFIED'],
      ['NEEDS_VERIFICATION',  'BATCH_UNVERIFIED'],
      ['VERIFIED',            'ALL_CHECKS_PASSED'],
      ['VERIFIED',            'ALL_CHECKS_PASSED'],
      ['VERIFIED',            'ALL_CHECKS_PASSED'],
      ['VERIFIED',            'ALL_CHECKS_PASSED'],
      ['VERIFIED',            'ALL_CHECKS_PASSED'],
      ['VERIFIED',            'ALL_CHECKS_PASSED'],
      ['VERIFIED',            'ALL_CHECKS_PASSED'],
      ['VERIFIED',            'ALL_CHECKS_PASSED'],
      ['VERIFIED',            'ALL_CHECKS_PASSED'],
    ],
    verified: [
      ['SUSPICIOUS',          'EXPIRED_PRODUCT'],
      ['SUSPICIOUS',          'EXPIRED_PRODUCT'],
      ['NEEDS_VERIFICATION',  'BATCH_UNVERIFIED'],
      ['NEEDS_VERIFICATION',  'BATCH_UNVERIFIED'],
      ['NEEDS_VERIFICATION',  'BATCH_UNVERIFIED'],
      ['VERIFIED',            'ALL_CHECKS_PASSED'],
      ['VERIFIED',            'ALL_CHECKS_PASSED'],
      ['VERIFIED',            'ALL_CHECKS_PASSED'],
      ['VERIFIED',            'ALL_CHECKS_PASSED'],
      ['VERIFIED',            'ALL_CHECKS_PASSED'],
      ['VERIFIED',            'ALL_CHECKS_PASSED'],
      ['VERIFIED',            'ALL_CHECKS_PASSED'],
      ['VERIFIED',            'ALL_CHECKS_PASSED'],
      ['VERIFIED',            'ALL_CHECKS_PASSED'],
      ['VERIFIED',            'ALL_CHECKS_PASSED'],
      ['VERIFIED',            'ALL_CHECKS_PASSED'],
      ['VERIFIED',            'ALL_CHECKS_PASSED'],
      ['VERIFIED',            'ALL_CHECKS_PASSED'],
      ['VERIFIED',            'ALL_CHECKS_PASSED'],
      ['VERIFIED',            'ALL_CHECKS_PASSED'],
    ],
  };

  const weeks = ['2026-W35', '2026-W36', '2026-W37'];

  const insertEvent = db.prepare(`
    INSERT OR IGNORE INTO aggregate_events
      (id, geo_cell, week, medicine_norm, manufacturer_norm, status, reason, is_synthetic)
    VALUES
      (@id, @geo_cell, @week, @medicine_norm, @manufacturer_norm, @status, @reason, 1)
  `);

  const seedEvents = db.transaction(() => {
    for (const city of cities) {
      const pattern = biasPatterns[city.bias];
      for (let i = 0; i < 20; i++) {
        const med   = medicines[i % medicines.length];
        const week  = weeks[i % weeks.length];
        const [status, reason] = pattern[i];
        insertEvent.run({
          id:                `evt-${city.cell}-${i}`,
          geo_cell:          city.cell,
          week,
          medicine_norm:     med.name,
          manufacturer_norm: med.mfr,
          status,
          reason,
        });
      }
    }
  });
  seedEvents();
}

seedDemoDataIfEmpty();

// ── Smart Health & Supply Chain Inline Seed ─────────────────────────────────
function seedSupplyDemoDataIfEmpty(): void {
  const facCount = (
    db.prepare('SELECT COUNT(*) as c FROM supply_facilities').get() as { c: number }
  ).c;
  if (facCount > 0) return;

  const insertFacility = db.prepare(`
    INSERT OR IGNORE INTO supply_facilities (id, name, district, state, tier, latitude, longitude, contact_person, phone)
    VALUES (@id, @name, @district, @state, @tier, @latitude, @longitude, @contact_person, @phone)
  `);

  const facilities = [
    { id: 'fac-dl-dh-01', name: 'Central District Hospital', district: 'Central Delhi', state: 'Delhi', tier: 'DH', latitude: 28.6415, longitude: 77.2185, contact_person: 'Dr. A. Sharma (Store In-charge)', phone: '+91-11-23214567' },
    { id: 'fac-dl-phc-02', name: 'Daryaganj Primary Health Centre', district: 'Central Delhi', state: 'Delhi', tier: 'PHC', latitude: 28.6448, longitude: 77.2405, contact_person: 'Dr. R. Verma (Medical Officer)', phone: '+91-11-23278901' },
    { id: 'fac-dl-chc-03', name: 'Paharganj Community Health Centre', district: 'Central Delhi', state: 'Delhi', tier: 'CHC', latitude: 28.6472, longitude: 77.2144, contact_person: 'Dr. M. Gupta', phone: '+91-11-23589012' },
    { id: 'fac-dl-dh-04', name: 'South Delhi District Hospital', district: 'South Delhi', state: 'Delhi', tier: 'DH', latitude: 28.5355, longitude: 77.2410, contact_person: 'Dr. K. Iyer (Chief Pharmacist)', phone: '+91-11-26894321' },
    { id: 'fac-dl-chc-05', name: 'Saket Community Health Centre', district: 'South Delhi', state: 'Delhi', tier: 'CHC', latitude: 28.5244, longitude: 77.2100, contact_person: 'Dr. P. Sen', phone: '+91-11-29567812' },
    { id: 'fac-up-dh-01', name: 'King George District Hospital', district: 'Lucknow', state: 'Uttar Pradesh', tier: 'DH', latitude: 26.8687, longitude: 80.9168, contact_person: 'Dr. S. Tripathi (Civil Surgeon)', phone: '+91-522-2257540' },
    { id: 'fac-up-chc-02', name: 'Hazratganj Community Health Centre', district: 'Lucknow', state: 'Uttar Pradesh', tier: 'CHC', latitude: 26.8524, longitude: 80.9448, contact_person: 'Dr. N. Siddiqui', phone: '+91-522-2213456' },
    { id: 'fac-up-phc-03', name: 'Alambagh Primary Health Centre', district: 'Lucknow', state: 'Uttar Pradesh', tier: 'PHC', latitude: 26.8123, longitude: 80.9012, contact_person: 'Dr. T. Rastogi', phone: '+91-522-2456789' },
    { id: 'fac-br-dh-01', name: 'Patna Medical College Hospital', district: 'Patna', state: 'Bihar', tier: 'DH', latitude: 25.6207, longitude: 85.1589, contact_person: 'Dr. B. Prasad (Superintendent)', phone: '+91-612-2300080' },
    { id: 'fac-br-chc-02', name: 'Kankarbagh Community Health Centre', district: 'Patna', state: 'Bihar', tier: 'CHC', latitude: 25.5941, longitude: 85.1482, contact_person: 'Dr. U. Yadav', phone: '+91-612-2356789' },
    { id: 'fac-ka-dh-01', name: 'Victoria District Hospital', district: 'Bengaluru', state: 'Karnataka', tier: 'DH', latitude: 12.9642, longitude: 77.5760, contact_person: 'Dr. H. Gowda (Medical Director)', phone: '+91-80-26701150' },
    { id: 'fac-ka-chc-02', name: 'Jayanagar Community Health Centre', district: 'Bengaluru', state: 'Karnataka', tier: 'CHC', latitude: 12.9250, longitude: 77.5938, contact_person: 'Dr. V. Rao', phone: '+91-80-26634567' },
  ];

  const insertInventory = db.prepare(`
    INSERT OR IGNORE INTO supply_inventory (
      id, facility_id, medicine_name, category, batch_number, current_stock,
      daily_consumption_rate, days_of_supply, stock_status, expiry_date
    ) VALUES (
      @id, @facility_id, @medicine_name, @category, @batch_number, @current_stock,
      @daily_consumption_rate, @days_of_supply, @stock_status, @expiry_date
    )
  `);

  const inventoryItems = [
    // ── Daryaganj PHC (Deficit / Critical focus for demo) ─────────────────────
    { id: 'inv-dl-phc-01', facility_id: 'fac-dl-phc-02', medicine_name: 'Amoxicillin 500mg', category: 'Broad-Spectrum Antibiotic', batch_number: 'AMX-2026-11', current_stock: 150, daily_consumption_rate: 50, days_of_supply: 3.0, stock_status: 'CRITICAL', expiry_date: '2027-02-28' },
    { id: 'inv-dl-phc-02', facility_id: 'fac-dl-phc-02', medicine_name: 'Paracetamol 500mg', category: 'Essential Antipyretic', batch_number: 'PCM-2026-88', current_stock: 400, daily_consumption_rate: 100, days_of_supply: 4.0, stock_status: 'CRITICAL', expiry_date: '2027-06-30' },
    { id: 'inv-dl-phc-03', facility_id: 'fac-dl-phc-02', medicine_name: 'ORS Packets (Oral Rehydration)', category: 'Emergency Rehydration', batch_number: 'ORS-2026-44', current_stock: 240, daily_consumption_rate: 30, days_of_supply: 8.0, stock_status: 'WARNING', expiry_date: '2027-12-31' },
    { id: 'inv-dl-phc-04', facility_id: 'fac-dl-phc-02', medicine_name: 'Metformin 500mg', category: 'Oral Hypoglycemic', batch_number: 'MET-2026-09', current_stock: 900, daily_consumption_rate: 30, days_of_supply: 30.0, stock_status: 'ADEQUATE', expiry_date: '2027-08-31' },

    // ── South Delhi DH (Surplus focus matching Daryaganj) ─────────────────────
    { id: 'inv-dl-dh4-01', facility_id: 'fac-dl-dh-04', medicine_name: 'Amoxicillin 500mg', category: 'Broad-Spectrum Antibiotic', batch_number: 'AMX-2026-03', current_stock: 9600, daily_consumption_rate: 140, days_of_supply: 68.6, stock_status: 'SURPLUS', expiry_date: '2026-12-15' },
    { id: 'inv-dl-dh4-02', facility_id: 'fac-dl-dh-04', medicine_name: 'Paracetamol 500mg', category: 'Essential Antipyretic', batch_number: 'PCM-2026-14', current_stock: 16500, daily_consumption_rate: 250, days_of_supply: 66.0, stock_status: 'SURPLUS', expiry_date: '2027-05-31' },
    { id: 'inv-dl-dh4-03', facility_id: 'fac-dl-dh-04', medicine_name: 'Azithromycin 500mg', category: 'Macrolide Antibiotic', batch_number: 'AZT-2026-72', current_stock: 3200, daily_consumption_rate: 80, days_of_supply: 40.0, stock_status: 'ADEQUATE', expiry_date: '2027-04-30' },
    { id: 'inv-dl-dh4-04', facility_id: 'fac-dl-dh-04', medicine_name: 'Insulin Regular 100IU', category: 'Cold-chain Biological', batch_number: 'INS-2026-55', current_stock: 850, daily_consumption_rate: 35, days_of_supply: 24.3, stock_status: 'ADEQUATE', expiry_date: '2027-03-31' },

    // ── Central District Hospital (Balanced) ──────────────────────────────────
    { id: 'inv-dl-dh1-01', facility_id: 'fac-dl-dh-01', medicine_name: 'Paracetamol 500mg', category: 'Essential Antipyretic', batch_number: 'PCM-2026-19', current_stock: 6200, daily_consumption_rate: 220, days_of_supply: 28.2, stock_status: 'ADEQUATE', expiry_date: '2027-09-30' },
    { id: 'inv-dl-dh1-02', facility_id: 'fac-dl-dh-01', medicine_name: 'Amoxicillin 500mg', category: 'Broad-Spectrum Antibiotic', batch_number: 'AMX-2026-45', current_stock: 3100, daily_consumption_rate: 110, days_of_supply: 28.2, stock_status: 'ADEQUATE', expiry_date: '2027-07-31' },
    { id: 'inv-dl-dh1-03', facility_id: 'fac-dl-dh-01', medicine_name: 'Amlodipine 5mg', category: 'Antihypertensive', batch_number: 'AML-2026-12', current_stock: 4800, daily_consumption_rate: 120, days_of_supply: 40.0, stock_status: 'ADEQUATE', expiry_date: '2027-11-30' },

    // ── Paharganj CHC (Central Delhi) ─────────────────────────────────────────
    { id: 'inv-dl-chc-01', facility_id: 'fac-dl-chc-03', medicine_name: 'Azithromycin 500mg', category: 'Macrolide Antibiotic', batch_number: 'AZT-2026-31', current_stock: 320, daily_consumption_rate: 35, days_of_supply: 9.1, stock_status: 'WARNING', expiry_date: '2027-03-31' },
    { id: 'inv-dl-chc-02', facility_id: 'fac-dl-chc-03', medicine_name: 'ORS Packets (Oral Rehydration)', category: 'Emergency Rehydration', batch_number: 'ORS-2026-92', current_stock: 1400, daily_consumption_rate: 45, days_of_supply: 31.1, stock_status: 'ADEQUATE', expiry_date: '2027-10-31' },

    // ── Lucknow Facilities (Hazratganj deficit vs KGMU surplus) ───────────────
    { id: 'inv-up-chc-01', facility_id: 'fac-up-chc-02', medicine_name: 'Azithromycin 500mg', category: 'Macrolide Antibiotic', batch_number: 'AZT-2026-89', current_stock: 175, daily_consumption_rate: 35, days_of_supply: 5.0, stock_status: 'CRITICAL', expiry_date: '2027-01-31' },
    { id: 'inv-up-chc-02', facility_id: 'fac-up-chc-02', medicine_name: 'Paracetamol 500mg', category: 'Essential Antipyretic', batch_number: 'PCM-2026-33', current_stock: 1800, daily_consumption_rate: 80, days_of_supply: 22.5, stock_status: 'ADEQUATE', expiry_date: '2027-08-31' },
    { id: 'inv-up-dh1-01', facility_id: 'fac-up-dh-01', medicine_name: 'Azithromycin 500mg', category: 'Macrolide Antibiotic', batch_number: 'AZT-2026-14', current_stock: 4200, daily_consumption_rate: 80, days_of_supply: 52.5, stock_status: 'SURPLUS', expiry_date: '2027-02-28' },
    { id: 'inv-up-phc-01', facility_id: 'fac-up-phc-03', medicine_name: 'ORS Packets (Oral Rehydration)', category: 'Emergency Rehydration', batch_number: 'ORS-2026-11', current_stock: 190, daily_consumption_rate: 30, days_of_supply: 6.3, stock_status: 'CRITICAL', expiry_date: '2027-04-30' },

    // ── Patna Facilities (Kankarbagh Insulin deficit vs PMCH) ─────────────────
    { id: 'inv-br-chc-01', facility_id: 'fac-br-chc-02', medicine_name: 'Insulin Regular 100IU', category: 'Cold-chain Biological', batch_number: 'INS-2026-08', current_stock: 45, daily_consumption_rate: 8, days_of_supply: 5.6, stock_status: 'CRITICAL', expiry_date: '2026-12-31' },
    { id: 'inv-br-chc-02', facility_id: 'fac-br-chc-02', medicine_name: 'Metformin 500mg', category: 'Oral Hypoglycemic', batch_number: 'MET-2026-64', current_stock: 650, daily_consumption_rate: 60, days_of_supply: 10.8, stock_status: 'WARNING', expiry_date: '2027-05-31' },
    { id: 'inv-br-dh1-01', facility_id: 'fac-br-dh-01', medicine_name: 'Insulin Regular 100IU', category: 'Cold-chain Biological', batch_number: 'INS-2026-90', current_stock: 620, daily_consumption_rate: 14, days_of_supply: 44.3, stock_status: 'ADEQUATE', expiry_date: '2027-06-30' },

    // ── Bengaluru Facilities (Jayanagar Amlodipine warning vs Victoria surplus)
    { id: 'inv-ka-chc-01', facility_id: 'fac-ka-chc-02', medicine_name: 'Amlodipine 5mg', category: 'Antihypertensive', batch_number: 'AML-2026-49', current_stock: 320, daily_consumption_rate: 45, days_of_supply: 7.1, stock_status: 'WARNING', expiry_date: '2027-05-31' },
    { id: 'inv-ka-dh1-01', facility_id: 'fac-ka-dh-01', medicine_name: 'Amlodipine 5mg', category: 'Antihypertensive', batch_number: 'AML-2026-10', current_stock: 7500, daily_consumption_rate: 120, days_of_supply: 62.5, stock_status: 'SURPLUS', expiry_date: '2027-01-31' },
    { id: 'inv-ka-dh1-02', facility_id: 'fac-ka-dh-01', medicine_name: 'Paracetamol 500mg', category: 'Essential Antipyretic', batch_number: 'PCM-2026-55', current_stock: 11200, daily_consumption_rate: 260, days_of_supply: 43.1, stock_status: 'ADEQUATE', expiry_date: '2027-10-31' },
  ];

  const insertForecast = db.prepare(`
    INSERT OR IGNORE INTO supply_forecasts (
      id, facility_id, medicine_name, period_label, projected_demand,
      current_stock, projected_deficit, predicted_stockout_date, surge_factor_reason
    ) VALUES (
      @id, @facility_id, @medicine_name, @period_label, @projected_demand,
      @current_stock, @projected_deficit, @predicted_stockout_date, @surge_factor_reason
    )
  `);

  const forecasts = [
    { id: 'fc-01', facility_id: 'fac-dl-phc-02', medicine_name: 'Amoxicillin 500mg', period_label: 'Next 30 Days', projected_demand: 1500, current_stock: 150, projected_deficit: -1350, predicted_stockout_date: 'Within 72 Hours', surge_factor_reason: 'Viral respiratory seasonal spike (+40% demand)' },
    { id: 'fc-02', facility_id: 'fac-dl-phc-02', medicine_name: 'Paracetamol 500mg', period_label: 'Next 30 Days', projected_demand: 3000, current_stock: 400, projected_deficit: -2600, predicted_stockout_date: 'Within 96 Hours', surge_factor_reason: 'Post-monsoon seasonal pyrexia surge' },
    { id: 'fc-03', facility_id: 'fac-up-chc-02', medicine_name: 'Azithromycin 500mg', period_label: 'Next 30 Days', projected_demand: 1050, current_stock: 175, projected_deficit: -875, predicted_stockout_date: '5 Days', surge_factor_reason: 'Acute bronchitis cluster reported in central ward' },
    { id: 'fc-04', facility_id: 'fac-br-chc-02', medicine_name: 'Insulin Regular 100IU', period_label: 'Next 30 Days', projected_demand: 240, current_stock: 45, projected_deficit: -195, predicted_stockout_date: '5 Days', surge_factor_reason: 'Delayed state medical corporation cold-chain dispatch' },
    { id: 'fc-05', facility_id: 'fac-up-phc-03', medicine_name: 'ORS Packets (Oral Rehydration)', period_label: 'Next 30 Days', projected_demand: 900, current_stock: 190, projected_deficit: -710, predicted_stockout_date: '6 Days', surge_factor_reason: 'Waterborne gastroenteritis cluster in riverbank colonies' },
    { id: 'fc-06', facility_id: 'fac-ka-chc-02', medicine_name: 'Amlodipine 5mg', period_label: 'Next 30 Days', projected_demand: 1350, current_stock: 320, projected_deficit: -1030, predicted_stockout_date: '7 Days', surge_factor_reason: 'Monthly NCD elderly refill cycle surge' },
  ];

  const insertRedist = db.prepare(`
    INSERT OR IGNORE INTO supply_redistributions (
      id, medicine_name, source_facility_id, target_facility_id, transfer_units,
      urgency, status, rationale, distance_km, est_transit_hours
    ) VALUES (
      @id, @medicine_name, @source_facility_id, @target_facility_id, @transfer_units,
      @urgency, @status, @rationale, @distance_km, @est_transit_hours
    )
  `);

  const redistributions = [
    {
      id: 'redist-01',
      medicine_name: 'Amoxicillin 500mg',
      source_facility_id: 'fac-dl-dh-04',
      target_facility_id: 'fac-dl-phc-02',
      transfer_units: 2500,
      urgency: 'CRITICAL',
      status: 'PROPOSED',
      rationale: 'Daryaganj PHC faces imminent stockout within 72h; South Delhi DH holds 68 days supply with an upcoming batch expiry in 4 months.',
      distance_km: 18.2,
      est_transit_hours: 1.2
    },
    {
      id: 'redist-02',
      medicine_name: 'Paracetamol 500mg',
      source_facility_id: 'fac-dl-dh-04',
      target_facility_id: 'fac-dl-phc-02',
      transfer_units: 3000,
      urgency: 'CRITICAL',
      status: 'PROPOSED',
      rationale: 'Rebalances viral fever surge buffer. Resolves PHC deficit while preserving 54 days reserve at South Delhi DH.',
      distance_km: 18.2,
      est_transit_hours: 1.2
    },
    {
      id: 'redist-03',
      medicine_name: 'Azithromycin 500mg',
      source_facility_id: 'fac-up-dh-01',
      target_facility_id: 'fac-up-chc-02',
      transfer_units: 1200,
      urgency: 'CRITICAL',
      status: 'PROPOSED',
      rationale: 'Rapid local district transfer to prevent antibiotic gap for acute outpatient clinic in Lucknow.',
      distance_km: 6.5,
      est_transit_hours: 0.6
    },
    {
      id: 'redist-04',
      medicine_name: 'Amlodipine 5mg',
      source_facility_id: 'fac-ka-dh-01',
      target_facility_id: 'fac-ka-chc-02',
      transfer_units: 1500,
      urgency: 'MODERATE',
      status: 'APPROVED',
      rationale: 'Routine non-communicable disease (NCD) quota rebalance before month-end refill cycle in Bengaluru.',
      distance_km: 8.4,
      est_transit_hours: 0.8
    }
  ];

  const seedAll = db.transaction(() => {
    for (const f of facilities) insertFacility.run(f);
    for (const item of inventoryItems) insertInventory.run(item);
    for (const fc of forecasts) insertForecast.run(fc);
    for (const r of redistributions) insertRedist.run(r);
  });
  seedAll();
}

seedSupplyDemoDataIfEmpty();

export default db;

