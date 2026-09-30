import { GeminiExtraction, NormalizedExtraction } from '../types';

export const INGREDIENT_SYNONYMS: Record<string, string> = {
  acetaminophen: 'paracetamol',
  paracetamol: 'paracetamol',
  apap: 'paracetamol',
  amoxicillin: 'amoxicillin',
  amoxycillin: 'amoxicillin',
  aspirin: 'aspirin',
  acetylsalicylic_acid: 'aspirin',
  metformin: 'metformin',
  metformin_hydrochloride: 'metformin',
  amlodipine: 'amlodipine',
  amlodipine_besylate: 'amlodipine',
  atorvastatin: 'atorvastatin',
  atorvastatin_calcium: 'atorvastatin',
  pantoprazole: 'pantoprazole',
  pantoprazole_sodium: 'pantoprazole',
  azithromycin: 'azithromycin',
  ashwagandha: 'withania_somnifera',
  withania_somnifera: 'withania_somnifera',
};

export function normalizeName(name: string | null | undefined): string | null {
  if (!name || typeof name !== 'string') return null;
  let clean = name.toLowerCase().trim();
  // Strip dosage suffixes
  clean = clean.replace(/\b(tablets?|capsules?|injections?|syrup|suspension|drops?|gel|cream|tab|cap|inj|ip|bp|usp)\b/gi, '');
  // Strip punctuation & extra whitespace
  clean = clean.replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
  return clean || null;
}

export function parseStrength(raw: string): { amount: number; unit: string } | null {
  if (!raw) return null;
  const match = raw.match(/([\d.]+)\s*(mg|mcg|µg|g|ml|iu|%)/i);
  if (!match) return null;
  return {
    amount: parseFloat(match[1]),
    unit: match[2].toLowerCase() === 'µg' ? 'mcg' : match[2].toLowerCase()
  };
}

export function normalizeIngredient(raw: string): string {
  const norm = normalizeName(raw) || '';
  const key = norm.replace(/\s+/g, '_');
  return INGREDIENT_SYNONYMS[key] || norm;
}

export function normalizeManufacturer(mfr: string | null | undefined): string | null {
  if (!mfr || typeof mfr !== 'string') return null;
  let clean = mfr.toLowerCase().trim();
  // Remove prefixes
  clean = clean.replace(/^(mfd\.?\s*by|mkt\.?\s*by|manufactured\s+by|marketed\s+by|packed\s+by)[:\s-]*/i, '');
  // Remove standard corporate legal suffixes
  clean = clean.replace(/\b(pvt\.?|ltd\.?|limited|laboratories|labs?|pharma|pharmaceuticals?|healthcare|life\s*sciences?|inc\.?|llc)\b/gi, '');
  // Strip locations like "new delhi", "solan", etc. or addresses
  clean = clean.replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
  return clean || null;
}

export function parseDate(rawDate: string | null | undefined): { month: number; year: number; raw: string; isExpired: boolean } | null {
  if (!rawDate || typeof rawDate !== 'string') return null;
  const raw = rawDate.trim();
  let clean = raw.replace(/^(exp\.?|mfg\.?|expiry|mfd|date)[:\s-]*/i, '').trim();

  const monthNames: Record<string, number> = {
    jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
    jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12
  };

  let month = 0;
  let year = 0;

  // Format: MM/YYYY or MM-YYYY or MM/YY
  let match = clean.match(/^(\d{1,2})[\/\-](\d{2,4})$/);
  if (match) {
    month = parseInt(match[1], 10);
    year = parseInt(match[2], 10);
    if (year < 100) year += 2000;
  } else {
    // Format: MMM YYYY or MMM-YYYY
    match = clean.match(/^([a-z]{3})[\s\/\-](\d{2,4})$/i);
    if (match) {
      month = monthNames[match[1].toLowerCase()] || 0;
      year = parseInt(match[2], 10);
      if (year < 100) year += 2000;
    }
  }

  if (month < 1 || month > 12 || year < 1990 || year > 2050) {
    return null;
  }

  // Treat expiry as end of printed month
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-indexed

  let isExpired = false;
  if (year < currentYear) {
    isExpired = true;
  } else if (year === currentYear && month < currentMonth) {
    isExpired = true;
  }

  return { month, year, raw, isExpired };
}

export function normalizeBatch(batch: string | null | undefined): string | null {
  if (!batch || typeof batch !== 'string') return null;
  // If it's explicitly an unreadable indicator, return null
  if (/^(none|n\/a|null|---|\?|unreadable|smudge)/i.test(batch.trim())) {
    return null;
  }
  const clean = batch.toUpperCase().replace(/\s+/g, '').replace(/^B\.?NO\.?[:\s-]*/i, '').trim();
  return clean || null;
}

export function validateGS1CheckDigit(barcode: string): boolean {
  if (!barcode || !/^\d{8,14}$/.test(barcode)) return false;
  const digits = barcode.split('').map(Number);
  const checkDigit = digits.pop()!;
  const reversed = digits.reverse();

  let sum = 0;
  for (let i = 0; i < reversed.length; i++) {
    sum += reversed[i] * (i % 2 === 0 ? 3 : 1);
  }
  const calculated = (10 - (sum % 10)) % 10;
  return calculated === checkDigit;
}

export function normalizeExtraction(extraction: GeminiExtraction): NormalizedExtraction {
  const medicineName = normalizeName(extraction.medicine_name.value);
  const brandName = normalizeName(extraction.brand_name.value);
  const manufacturer = normalizeManufacturer(extraction.manufacturer.value);
  const rawManufacturer = extraction.manufacturer.value;

  const activeIngredients = (extraction.active_ingredients || []).map((ing) => {
    const strengthParsed = parseStrength(ing.strength || '');
    return {
      name: normalizeIngredient(ing.name),
      strengthAmount: strengthParsed?.amount,
      strengthUnit: strengthParsed?.unit,
      raw: `${ing.name} ${ing.strength || ''}`.trim()
    };
  });

  const mfg = parseDate(extraction.manufacturing_date.value);
  const exp = parseDate(extraction.expiry_date.value);
  const batchNumber = normalizeBatch(extraction.batch_number.value);
  const barcode = extraction.barcode_or_qr.value;

  // Calculate overall extraction confidence
  const confs = [
    extraction.medicine_name.confidence,
    extraction.manufacturer.confidence,
    extraction.batch_number.confidence,
    extraction.expiry_date.confidence
  ].filter((c) => typeof c === 'number' && c > 0);

  const overallConfidence = confs.length > 0 ? confs.reduce((a, b) => a + b, 0) / confs.length : 0.5;

  return {
    medicineName,
    brandName,
    activeIngredients,
    dosageForm: extraction.dosage_form.value,
    manufacturer,
    rawManufacturer,
    mfgDate: mfg ? { month: mfg.month, year: mfg.year, raw: mfg.raw } : null,
    expDate: exp,
    batchNumber,
    licenceNumber: extraction.licence_number.value,
    barcode,
    overallConfidence,
    qualityIssues: extraction.image_quality.issues || []
  };
}
