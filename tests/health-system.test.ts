import { describe, it, expect } from 'vitest';
import { db } from '../src/lib/db';

describe('Smart Health & Supply System — Verification & Logistics Suite', () => {
  it('seeds 12 healthcare facilities across public health tiers and districts', () => {
    const facilities = db.prepare('SELECT * FROM supply_facilities').all() as any[];
    expect(facilities.length).toBeGreaterThanOrEqual(12);

    const tiers = new Set(facilities.map((f) => f.tier));
    expect(tiers.has('DH')).toBe(true);
    expect(tiers.has('CHC')).toBe(true);
    expect(tiers.has('PHC')).toBe(true);

    const districts = new Set(facilities.map((f) => f.district));
    expect(districts.has('Central Delhi')).toBe(true);
    expect(districts.has('South Delhi')).toBe(true);
    expect(districts.has('Lucknow')).toBe(true);
    expect(districts.has('Patna')).toBe(true);
    expect(districts.has('Bengaluru')).toBe(true);
  });

  it('correctly calculates days of supply and flags critical stockout thresholds (<7 days)', () => {
    const criticalItems = db.prepare(`
      SELECT * FROM supply_inventory
      WHERE stock_status = 'CRITICAL'
    `).all() as any[];

    expect(criticalItems.length).toBeGreaterThan(0);
    for (const item of criticalItems) {
      expect(item.days_of_supply).toBeLessThan(7.0);
      const calculatedDays = item.current_stock / item.daily_consumption_rate;
      expect(Math.abs(item.days_of_supply - calculatedDays)).toBeLessThan(0.1);
    }
  });

  it('correctly identifies surplus stock pockets (>45 days) available for redistribution', () => {
    const surplusItems = db.prepare(`
      SELECT * FROM supply_inventory
      WHERE stock_status = 'SURPLUS'
    `).all() as any[];

    expect(surplusItems.length).toBeGreaterThan(0);
    for (const item of surplusItems) {
      expect(item.days_of_supply).toBeGreaterThan(45.0);
    }
  });

  it('generates demand forecasts with realistic 30-day deficit projections', () => {
    const forecasts = db.prepare('SELECT * FROM supply_forecasts').all() as any[];
    expect(forecasts.length).toBeGreaterThan(0);

    for (const fc of forecasts) {
      expect(fc.projected_demand).toBeGreaterThan(fc.current_stock);
      expect(fc.projected_deficit).toBeLessThan(0);
      expect(fc.predicted_stockout_date).toBeTruthy();
      expect(fc.surge_factor_reason).toBeTruthy();
    }
  });

  it('validates cross-district redistribution pairing (Surplus facility -> Deficit facility)', () => {
    const redistributions = db.prepare(`
      SELECT 
        r.*,
        si_source.days_of_supply as source_days,
        si_target.days_of_supply as target_days
      FROM supply_redistributions r
      LEFT JOIN supply_inventory si_source 
        ON r.source_facility_id = si_source.facility_id AND r.medicine_name = si_source.medicine_name
      LEFT JOIN supply_inventory si_target 
        ON r.target_facility_id = si_target.facility_id AND r.medicine_name = si_target.medicine_name
    `).all() as any[];

    expect(redistributions.length).toBeGreaterThan(0);
    for (const r of redistributions) {
      expect(r.transfer_units).toBeGreaterThan(0);
      expect(r.distance_km).toBeGreaterThan(0);
      expect(r.est_transit_hours).toBeGreaterThan(0);
      expect(r.rationale).toBeTruthy();

      // If inventory was matched, ensure source was better stocked than target
      if (r.source_days !== null && r.target_days !== null) {
        expect(r.source_days).toBeGreaterThan(r.target_days);
      }
    }
  });

  it('supports prototype simulated status transitions (PROPOSED -> APPROVED -> IN_TRANSIT)', () => {
    // Pick an existing order
    const order = db.prepare('SELECT id, status FROM supply_redistributions LIMIT 1').get() as any;
    expect(order).toBeTruthy();

    // Simulate approval transition
    db.prepare('UPDATE supply_redistributions SET status = ? WHERE id = ?').run('APPROVED', order.id);
    const updated1 = db.prepare('SELECT status FROM supply_redistributions WHERE id = ?').get(order.id) as any;
    expect(updated1.status).toBe('APPROVED');

    // Simulate dispatch transition
    db.prepare('UPDATE supply_redistributions SET status = ? WHERE id = ?').run('IN_TRANSIT', order.id);
    const updated2 = db.prepare('SELECT status FROM supply_redistributions WHERE id = ?').get(order.id) as any;
    expect(updated2.status).toBe('IN_TRANSIT');

    // Restore to PROPOSED
    db.prepare('UPDATE supply_redistributions SET status = ? WHERE id = ?').run('PROPOSED', order.id);
  });
});
