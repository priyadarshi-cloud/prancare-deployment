export interface CellAggregate {
  geoCell: string;
  total: number;
  verified: number;
  needsVerification: number;
  suspicious: number;
  suspiciousShare: number;
  lat: number;
  lng: number;
  name: string;
}

export const KNOWN_CELL_CENTROIDS: Record<string, { lat: number; lng: number; name: string }> = {
  'IN-DL-CENTRAL': { lat: 28.6139, lng: 77.2090, name: 'Central Delhi' },
  'IN-DL-NORTH': { lat: 28.7041, lng: 77.1025, name: 'North Delhi' },
  'IN-DL-SOUTH': { lat: 28.4817, lng: 77.1873, name: 'South Delhi' },
  'IN-MH-MUMBAI': { lat: 18.9220, lng: 72.8347, name: 'Mumbai City' },
  'IN-MH-THANE': { lat: 19.2183, lng: 72.9781, name: 'Thane' },
  'IN-MH-PUNE': { lat: 18.5204, lng: 73.8567, name: 'Pune' },
  'IN-KA-BLR-NORTH': { lat: 13.0358, lng: 77.5970, name: 'Bengaluru North' },
  'IN-KA-BLR-SOUTH': { lat: 12.9250, lng: 77.5898, name: 'Bengaluru South' },
  'IN-WB-KOLKATA': { lat: 22.5726, lng: 88.3639, name: 'Kolkata' },
  'IN-TN-CHENNAI': { lat: 13.0827, lng: 80.2707, name: 'Chennai Central' },
  'IN-TG-HYD': { lat: 17.3850, lng: 78.4867, name: 'Hyderabad' },
  'IN-GJ-AHM': { lat: 23.0225, lng: 72.5714, name: 'Ahmedabad' },
  'IN-UP-LKO': { lat: 26.8467, lng: 80.9462, name: 'Lucknow' },
  'IN-UP-KAN': { lat: 26.4499, lng: 80.3319, name: 'Kanpur' },
  'IN-BR-PATNA': { lat: 25.5941, lng: 85.1376, name: 'Patna' },
  'IN-RJ-JAIPUR': { lat: 26.9124, lng: 75.7873, name: 'Jaipur' },
  'IN-PB-CHD': { lat: 30.7333, lng: 76.7794, name: 'Chandigarh' }
};

export function snapToCoarseCell(lat: number, lng: number): string {
  // Find nearest known region within ~35 km
  for (const [cellId, centroid] of Object.entries(KNOWN_CELL_CENTROIDS)) {
    const dLat = Math.abs(lat - centroid.lat);
    const dLng = Math.abs(lng - centroid.lng);
    if (dLat < 0.35 && dLng < 0.35) {
      return cellId;
    }
  }
  // Coarse grid bucket (snap to 0.5 degree grid ~50 km)
  const roundedLat = (Math.floor(lat * 2) / 2).toFixed(1);
  const roundedLng = (Math.floor(lng * 2) / 2).toFixed(1);
  return `IN-GRID-${roundedLat}-${roundedLng}`;
}

export function filterAggregateCellsByKAnonymity(
  events: Array<{ geo_cell: string; status: string }>,
  minK: number = 5
): Map<string, CellAggregate> {
  const cellCounts = new Map<string, { total: number; verified: number; needs: number; suspicious: number }>();

  for (const ev of events) {
    if (!cellCounts.has(ev.geo_cell)) {
      cellCounts.set(ev.geo_cell, { total: 0, verified: 0, needs: 0, suspicious: 0 });
    }
    const stat = cellCounts.get(ev.geo_cell)!;
    stat.total++;
    if (ev.status === 'VERIFIED') stat.verified++;
    else if (ev.status === 'NEEDS_VERIFICATION') stat.needs++;
    else if (ev.status === 'SUSPICIOUS') stat.suspicious++;
  }

  const result = new Map<string, CellAggregate>();

  for (const [cellId, counts] of Array.from(cellCounts.entries())) {
    // k-anonymity gate
    if (counts.total < minK) {
      continue; // Suppress cell if fewer than k observations exist
    }

    const centroid = KNOWN_CELL_CENTROIDS[cellId] || {
      lat: 22.0,
      lng: 78.0,
      name: `Region ${cellId.replace('IN-GRID-', '')}`
    };

    const suspiciousShare = counts.total > 0 ? counts.suspicious / counts.total : 0;

    result.set(cellId, {
      geoCell: cellId,
      total: counts.total,
      verified: counts.verified,
      needsVerification: counts.needs,
      suspicious: counts.suspicious,
      suspiciousShare: Math.round(suspiciousShare * 100) / 100,
      lat: centroid.lat,
      lng: centroid.lng,
      name: centroid.name
    });
  }

  return result;
}
