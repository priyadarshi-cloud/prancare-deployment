import { describe, it, expect } from 'vitest';
import {
  normalizeName,
  parseStrength,
  normalizeIngredient,
  normalizeManufacturer,
  parseDate,
  normalizeBatch,
  validateGS1CheckDigit
} from '../src/lib/normalize';

describe('Normalization Layer Unit Tests', () => {
  it('normalizes medicine and brand names correctly', () => {
    expect(normalizeName('Paracetamol Tablets IP 500mg')).toBe('paracetamol 500mg');
    expect(normalizeName('Crocin Advance Tab.')).toBe('crocin advance');
    expect(normalizeName('Amoxicillin Capsules 250 mg')).toBe('amoxicillin 250 mg');
  });

  it('parses strength amounts and units accurately', () => {
    expect(parseStrength('500mg')).toEqual({ amount: 500, unit: 'mg' });
    expect(parseStrength('500 mg')).toEqual({ amount: 500, unit: 'mg' });
    expect(parseStrength('0.5 g')).toEqual({ amount: 0.5, unit: 'g' });
    expect(parseStrength('10 mcg')).toEqual({ amount: 10, unit: 'mcg' });
    expect(parseStrength('250 IU')).toEqual({ amount: 250, unit: 'iu' });
  });

  it('maps active ingredient synonyms to standardized names', () => {
    expect(normalizeIngredient('acetaminophen')).toBe('paracetamol');
    expect(normalizeIngredient('Paracetamol')).toBe('paracetamol');
    expect(normalizeIngredient('acetylsalicylic acid')).toBe('aspirin');
    expect(normalizeIngredient('Ashwagandha')).toBe('withania_somnifera');
  });

  it('strips manufacturer legal suffixes and prefixes', () => {
    expect(normalizeManufacturer('Mfd. by Demo Pharma Laboratories Ltd.')).toBe('demo');
    expect(normalizeManufacturer('Manufactured by Cipla Healthcare Pvt. Ltd.')).toBe('cipla');
    expect(normalizeManufacturer('Sun Pharmaceuticals Ltd., Mumbai')).toBe('sun mumbai');
  });

  it('parses dates and computes expiry status accurately', () => {
    const validFuture = parseDate('05/2028');
    expect(validFuture).not.toBeNull();
    expect(validFuture?.month).toBe(5);
    expect(validFuture?.year).toBe(2028);
    expect(validFuture?.isExpired).toBe(false);

    const pastExpired = parseDate('12/2022');
    expect(pastExpired).not.toBeNull();
    expect(pastExpired?.isExpired).toBe(true);

    const monthNameFormat = parseDate('EXP MAR 2027');
    expect(monthNameFormat?.month).toBe(3);
    expect(monthNameFormat?.year).toBe(2027);
  });

  it('normalizes batch numbers and filters unreadable smudges', () => {
    expect(normalizeBatch('B.No. PC123456')).toBe('PC123456');
    expect(normalizeBatch('batch-9922 ')).toBe('BATCH-9922');
    expect(normalizeBatch('--- (UNREADABLE SMUDGE) ---')).toBeNull();
    expect(normalizeBatch('null')).toBeNull();
  });

  it('validates GS1 barcode Modulo-10 check digits correctly', () => {
    // Standard EAN-13 valid barcode: 890123456789 -> check digit is 0
    expect(validateGS1CheckDigit('8901234567890')).toBe(true);
    expect(validateGS1CheckDigit('8901234567895')).toBe(false);
    // Invalid length or chars
    expect(validateGS1CheckDigit('invalid')).toBe(false);
  });
});
