'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useApp } from '@/components/AppContext';
import { ShieldCheck, AlertTriangle, AlertOctagon, Info, MapPin, Sparkles } from 'lucide-react';
import { CellAggregate } from '@/lib/geo';

// Dynamically import Leaflet map component to prevent SSR 'window is not defined'
const LeafletMapContainer = dynamic(() => import('@/components/LeafletMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-80 rounded-2xl bg-teal-50 flex flex-col items-center justify-center text-xs text-slate-500 font-semibold border border-teal-200">
      <div className="w-8 h-8 border-3 border-pran-teal border-t-transparent rounded-full animate-spin mb-2"></div>
      Loading interactive safety map...
    </div>
  )
});

export default function MapPage() {
  const { t } = useApp();
  const [cells, setCells] = useState<CellAggregate[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/map')
      .then((res) => res.json())
      .then((data) => {
        if (data.cells) setCells(data.cells);
        if (data.summary) setSummary(data.summary);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Map data fetch error:', err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <span className="text-xs font-bold text-pran-teal uppercase tracking-wide flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Privacy-First Public Health Radar
          </span>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {t('map_title', 'Medicine Safety Map')}
          </h1>
          <p className="text-xs text-slate-600 font-medium">
            {t('map_subtitle', 'Verification results reported through PranCare')}
          </p>
        </div>

        <span className="demo-badge">
          {t('demo_data_badge', 'DEMO DATA')}
        </span>
      </div>

      {/* Summary KPI Strip */}
      {summary && (
        <div className="grid grid-cols-3 gap-2">
          <div className="pran-card p-3 text-center border border-emerald-200 bg-emerald-50/40">
            <span className="text-[10px] font-bold text-emerald-800 uppercase block">
              Verified
            </span>
            <span className="text-xl font-black text-emerald-700">
              {summary.verifiedCount}
            </span>
          </div>

          <div className="pran-card p-3 text-center border border-amber-200 bg-amber-50/40">
            <span className="text-[10px] font-bold text-amber-800 uppercase block">
              Needs Review
            </span>
            <span className="text-xl font-black text-amber-700">
              {summary.needsVerificationCount}
            </span>
          </div>

          <div className="pran-card p-3 text-center border border-rose-200 bg-rose-50/40">
            <span className="text-[10px] font-bold text-rose-800 uppercase block">
              Suspicious
            </span>
            <span className="text-xl font-black text-rose-700">
              {summary.suspiciousCount}
            </span>
          </div>
        </div>
      )}

      {/* Interactive Map */}
      <div className="pran-card p-2 border border-teal-200 bg-white overflow-hidden shadow-sm">
        <LeafletMapContainer cells={cells} />
      </div>

      {/* Legend & Privacy Disclaimer */}
      <div className="pran-card p-4 border border-teal-100 bg-white space-y-3">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
          Map Legend & Interpretation
        </h3>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 border border-emerald-600 flex-shrink-0"></span>
            <span className="text-slate-600 font-medium">Mostly verified (&gt;85%)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-full bg-rose-500 border border-rose-600 flex-shrink-0"></span>
            <span className="text-slate-600 font-medium">Higher concentration of suspicious results</span>
          </div>
        </div>

        {/* k-anonymity Guarantee Notice */}
        <div className="pt-2 border-t border-slate-100 flex items-start gap-2 text-[11px] text-slate-500 leading-relaxed">
          <Info className="w-4 h-4 text-pran-teal flex-shrink-0 mt-0.5" />
          <p>
            {t('privacy_notice', 'Your privacy is protected. Coordinates are never saved or linked to your identity.')}{' '}
            All clusters meet k-anonymity (k=5) across regional centroids.
          </p>
        </div>
      </div>
    </div>
  );
}
