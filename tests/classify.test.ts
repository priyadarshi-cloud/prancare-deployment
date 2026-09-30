import { describe, it, expect } from 'vitest';
import { classifyExtraction } from '../src/lib/classify';
import { normalizeExtraction } from '../src/lib/normalize';
import { GeminiExtraction } from '../src/types';

describe('Verification Engine Classification Tests', () => {
  it('Scenario 1: Matches catalog and valid dates produces VERIFIED (with batch caveat)', async () => {
    const rawExtraction: GeminiExtraction = {
      medicine_name: { value: 'Paracetamol Tablets IP 500 mg', confidence: 0.95 },
      brand_name: { value: 'DemoPar 500', confidence: 0.9 },
      active_ingredients: [{ name: 'Paracetamol', strength: '500 mg', confidence: 0.95 }],
      dosage_form: { value: 'Tablet', confidence: 0.9 },
      manufacturer: { value: 'Demo Pharma Laboratories Ltd.', confidence: 0.95 },
      marketed_by: { value: null, confidence: 0.0 },
      manufacturing_date: { value: '03/2026', confidence: 0.9 },
      expiry_date: { value: '02/2028', confidence: 0.95 },
      batch_number: { value: 'PC123456', confidence: 0.9 },
      licence_number: { value: 'DL-2024-9988', confidence: 0.85 },
      barcode_or_qr: { value: '8901234567890', type: 'EAN-13', confidence: 0.9 },
      mrp: { value: '₹35.00', confidence: 0.9 },
      warnings_printed: ['Keep out of reach of children'],
      packaging_observations: [],
      image_quality: { overall: 'good', issues: [] },
      fields_not_visible: []
    };

    const normalized = normalizeExtraction(rawExtraction);
    const result = await classifyExtraction(rawExtraction, normalized, 'scan-test-1');

    expect(result.status).toBe('VERIFIED');
    expect(result.primaryReason).toBe('ALL_CHECKS_PASSED');
    expect(result.confidence).toBe('HIGH');
    expect(result.verified.length).toBeGreaterThanOrEqual(2);
    // Mandatory caveat check on batch
    const batchCheck = result.checks.find((c) => c.id === 'C5');
    expect(batchCheck?.detail?.toLowerCase()).toContain('caveat');
  });

  it('Scenario 2: Unreadable manufacturer and missing batch produces NEEDS_VERIFICATION', async () => {
    const rawExtraction: GeminiExtraction = {
      medicine_name: { value: 'Demo Medicine 250 mg', confidence: 0.7 },
      brand_name: { value: null, confidence: 0.0 },
      active_ingredients: [],
      dosage_form: { value: 'Capsule', confidence: 0.8 },
      manufacturer: { value: null, confidence: 0.0 },
      marketed_by: { value: null, confidence: 0.0 },
      manufacturing_date: { value: '01/2026', confidence: 0.8 },
      expiry_date: { value: '12/2027', confidence: 0.8 },
      batch_number: { value: '--- (UNREADABLE SMUDGE) ---', confidence: 0.1 },
      licence_number: { value: null, confidence: 0.0 },
      barcode_or_qr: { value: null, type: null, confidence: 0.0 },
      mrp: { value: null, confidence: 0.0 },
      warnings_printed: [],
      packaging_observations: [{ observation: 'Text smudged on back', severity: 'note' }],
      image_quality: { overall: 'fair', issues: ['Mild blur near batch code'] },
      fields_not_visible: ['batch_number', 'manufacturer']
    };

    const normalized = normalizeExtraction(rawExtraction);
    const result = await classifyExtraction(rawExtraction, normalized, 'scan-test-2');

    expect(result.status).toBe('NEEDS_VERIFICATION');
    expect(result.threeQuestions.whatShouldYouDo).toContain('pharmacist');
    // Ensure it does not falsely claim counterfeit
    expect(result.threeQuestions.whatDidWeVerify).not.toContain('fake');
    expect(result.threeQuestions.whatDidWeVerify).not.toContain('counterfeit');
  });

  it('Scenario 3: Batch on CDSCO recall list produces SUSPICIOUS with cited source', async () => {
    const rawExtraction: GeminiExtraction = {
      medicine_name: { value: 'Amoxicillin Capsules 500 mg', confidence: 0.9 },
      brand_name: { value: 'Amoxil', confidence: 0.85 },
      active_ingredients: [{ name: 'Amoxicillin', strength: '500 mg', confidence: 0.9 }],
      dosage_form: { value: 'Capsule', confidence: 0.9 },
      manufacturer: { value: 'Mismatch Pharma Trading Co.', confidence: 0.85 },
      marketed_by: { value: null, confidence: 0.0 },
      manufacturing_date: { value: '05/2025', confidence: 0.9 },
      expiry_date: { value: '04/2027', confidence: 0.9 },
      batch_number: { value: 'RC998877', confidence: 0.95 },
      licence_number: { value: 'HP-9922', confidence: 0.8 },
      barcode_or_qr: { value: null, type: null, confidence: 0.0 },
      mrp: { value: null, confidence: 0.0 },
      warnings_printed: [],
      packaging_observations: [],
      image_quality: { overall: 'good', issues: [] },
      fields_not_visible: []
    };

    const normalized = normalizeExtraction(rawExtraction);
    const result = await classifyExtraction(rawExtraction, normalized, 'scan-test-3');

    expect(result.status).toBe('SUSPICIOUS');
    expect(result.primaryReason).toBe('RECALLED_BATCH');
    const recallCheck = result.checks.find((c) => c.id === 'C5');
    expect(recallCheck?.outcome).toBe('recalled');
    expect(recallCheck?.detail).toContain('CDSCO');
    expect(result.threeQuestions.whatShouldYouDo).toContain('Do not consume');
  });

  it('Scenario 4: Expired product triggers SUSPICIOUS with Expired reason', async () => {
    const rawExtraction: GeminiExtraction = {
      medicine_name: { value: 'Atorvastatin Tablets 10 mg', confidence: 0.9 },
      brand_name: { value: 'Atorva', confidence: 0.9 },
      active_ingredients: [{ name: 'Atorvastatin', strength: '10 mg', confidence: 0.9 }],
      dosage_form: { value: 'Tablet', confidence: 0.9 },
      manufacturer: { value: 'Zydus Life Care', confidence: 0.9 },
      marketed_by: { value: null, confidence: 0.0 },
      manufacturing_date: { value: '01/2022', confidence: 0.9 },
      expiry_date: { value: '12/2023', confidence: 0.9 }, // Expired!
      batch_number: { value: 'AT445566', confidence: 0.9 },
      licence_number: { value: 'GJ-2021-1122', confidence: 0.85 },
      barcode_or_qr: { value: null, type: null, confidence: 0.0 },
      mrp: { value: null, confidence: 0.0 },
      warnings_printed: [],
      packaging_observations: [],
      image_quality: { overall: 'good', issues: [] },
      fields_not_visible: []
    };

    const normalized = normalizeExtraction(rawExtraction);
    const result = await classifyExtraction(rawExtraction, normalized, 'scan-test-4');

    expect(result.status).toBe('SUSPICIOUS');
    expect(result.primaryReason).toBe('EXPIRED_PRODUCT');
    expect(result.threeQuestions.whatDidWeFind).toContain('Expired');
  });

  it('Safety Rule: Output never asserts medicine is genuine or fake', async () => {
    const rawExtraction: GeminiExtraction = {
      medicine_name: { value: 'Paracetamol Tablets IP 500 mg', confidence: 0.95 },
      brand_name: { value: 'DemoPar 500', confidence: 0.9 },
      active_ingredients: [{ name: 'Paracetamol', strength: '500 mg', confidence: 0.95 }],
      dosage_form: { value: 'Tablet', confidence: 0.9 },
      manufacturer: { value: 'Demo Pharma Laboratories Ltd.', confidence: 0.95 },
      marketed_by: { value: null, confidence: 0.0 },
      manufacturing_date: { value: '03/2026', confidence: 0.9 },
      expiry_date: { value: '02/2028', confidence: 0.95 },
      batch_number: { value: 'PC123456', confidence: 0.9 },
      licence_number: { value: 'DL-2024-9988', confidence: 0.85 },
      barcode_or_qr: { value: '8901234567890', type: 'EAN-13', confidence: 0.9 },
      mrp: { value: '₹35.00', confidence: 0.9 },
      warnings_printed: [],
      packaging_observations: [],
      image_quality: { overall: 'good', issues: [] },
      fields_not_visible: []
    };

    const normalized = normalizeExtraction(rawExtraction);
    const result = await classifyExtraction(rawExtraction, normalized, 'scan-safety');

    const jsonStr = JSON.stringify(result).toLowerCase();
    expect(jsonStr).not.toContain('"genuine"');
    expect(jsonStr).not.toContain('"fake"');
    expect(jsonStr).not.toContain('"counterfeit"');
  });
});
