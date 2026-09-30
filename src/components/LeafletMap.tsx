'use client';

import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { CellAggregate } from '@/lib/geo';

interface LeafletMapProps {
  cells: CellAggregate[];
}

export default function LeafletMap({ cells }: LeafletMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize Leaflet map centered on India
    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current).setView([22.5, 78.9], 4.5);

      // OpenStreetMap free tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18,
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Clear existing circle markers
    map.eachLayer((layer) => {
      if (layer instanceof L.CircleMarker) {
        map.removeLayer(layer);
      }
    });

    // Add aggregate circle markers for each cell
    cells.forEach((cell) => {
      // Color determined by suspicious share
      let fillColor = '#10B981'; // Green
      let strokeColor = '#059669';

      if (cell.suspiciousShare > 0.3) {
        fillColor = '#EF4444'; // Red
        strokeColor = '#DC2626';
      } else if (cell.suspiciousShare > 0.15) {
        fillColor = '#F59E0B'; // Amber
        strokeColor = '#D97706';
      }

      // Radius scaled slightly with total report volume
      const radius = Math.min(24, Math.max(10, Math.sqrt(cell.total) * 4));

      const circle = L.circleMarker([cell.lat, cell.lng], {
        radius,
        fillColor,
        color: strokeColor,
        weight: 2,
        opacity: 0.9,
        fillOpacity: 0.65,
      }).addTo(map);

      const popupContent = `
        <div style="font-family: system-ui, sans-serif; min-width: 160px; font-size: 12px; line-height: 1.4;">
          <strong style="font-size: 13px; color: #0A363B; display: block; margin-bottom: 4px;">
            ${cell.name}
          </strong>
          <div style="color: #475569; margin-bottom: 6px;">
            Total Reports: <strong>${cell.total}</strong>
          </div>
          <div style="display: flex; gap: 8px; font-size: 11px;">
            <span style="color: #166534;">Verified: ${cell.verified}</span>
            <span style="color: #991B1B;">Suspicious: ${cell.suspicious}</span>
          </div>
          <div style="margin-top: 6px; font-size: 10px; color: #64748b; font-style: italic;">
            k-anonymity (k=5) certified
          </div>
        </div>
      `;

      circle.bindPopup(popupContent);
    });
  }, [cells]);

  return (
    <div
      ref={mapContainerRef}
      className="w-full h-80 rounded-xl overflow-hidden"
      style={{ zIndex: 1 }}
    />
  );
}
