import { describe, it, expect } from 'vitest';
import { filterAggregateCellsByKAnonymity, snapToCoarseCell } from '../src/lib/geo';

describe('Privacy & k-Anonymity Tests (Medicine Safety Map)', () => {
  it('snaps precise GPS coordinates to coarse geographic cells without persisting raw coords', () => {
    // New Delhi Connaught Place
    const cell1 = snapToCoarseCell(28.6315, 77.2167);
    expect(cell1).toBe('IN-DL-CENTRAL');

    // Mumbai Nariman Point
    const cell2 = snapToCoarseCell(18.9256, 72.8242);
    expect(cell2).toBe('IN-MH-MUMBAI');

    // Unknown/Out-of-range maps to regional grid
    const cellOther = snapToCoarseCell(25.0, 80.0);
    expect(cellOther).toMatch(/^IN-GRID-/);
  });

  it('strictly filters out cells with fewer than k (5) scans to protect user privacy', () => {
    const rawEvents = [
      // Cell A: 6 events (passes k=5)
      { id: '1', geo_cell: 'CELL_A', status: 'VERIFIED' },
      { id: '2', geo_cell: 'CELL_A', status: 'VERIFIED' },
      { id: '3', geo_cell: 'CELL_A', status: 'NEEDS_VERIFICATION' },
      { id: '4', geo_cell: 'CELL_A', status: 'VERIFIED' },
      { id: '5', geo_cell: 'CELL_A', status: 'VERIFIED' },
      { id: '6', geo_cell: 'CELL_A', status: 'SUSPICIOUS' },

      // Cell B: only 2 events (FAILS k=5 -> must be hidden)
      { id: '7', geo_cell: 'CELL_B', status: 'SUSPICIOUS' },
      { id: '8', geo_cell: 'CELL_B', status: 'VERIFIED' }
    ];

    const aggregated = filterAggregateCellsByKAnonymity(rawEvents, 5);

    expect(aggregated.has('CELL_A')).toBe(true);
    expect(aggregated.get('CELL_A')?.total).toBe(6);

    // CELL_B must NOT be displayed because count < 5
    expect(aggregated.has('CELL_B')).toBe(false);
  });

  it('guarantees no personal identifier or raw coordinates exist in aggregate response', () => {
    const sampleEvents = [
      { id: '1', geo_cell: 'CELL_A', status: 'VERIFIED' },
      { id: '2', geo_cell: 'CELL_A', status: 'VERIFIED' },
      { id: '3', geo_cell: 'CELL_A', status: 'VERIFIED' },
      { id: '4', geo_cell: 'CELL_A', status: 'VERIFIED' },
      { id: '5', geo_cell: 'CELL_A', status: 'VERIFIED' }
    ];

    const aggregated = filterAggregateCellsByKAnonymity(sampleEvents, 5);
    const cellA = aggregated.get('CELL_A');

    const json = JSON.stringify(cellA);
    expect(json).not.toContain('user_id');
    expect(json).not.toContain('user');
    expect(json).not.toContain('latitude');
    expect(json).not.toContain('longitude');
    expect(json).not.toContain('phone');
    expect(json).not.toContain('patient_name');
    expect(json).not.toContain('user_name');
  });
});
