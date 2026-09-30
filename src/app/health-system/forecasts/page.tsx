'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import HealthHeader from '@/components/health-system/HealthHeader';
import {
  TrendingUp,
  AlertTriangle,
  Calendar,
  Sparkles,
  ArrowRight,
  TrendingDown,
  Clock,
  ShieldCheck
} from 'lucide-react';

export default function HealthSystemForecastsPage() {
  const [forecasts, setForecasts] = useState<any[]>([]);
  const [district, setDistrict] = useState('ALL');
  const [totalDeficit, setTotalDeficit] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchForecasts = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (district !== 'ALL') params.set('district', district);
      const res = await fetch(`/api/health-system/forecasts?${params.toString()}`);
      const data = await res.json();
      setForecasts(data.forecasts || []);
      setTotalDeficit(data.totalProjectedDeficitUnits || 0);
    } catch (err) {
      console.error('Failed to load forecasts:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchForecasts();
  }, [district]);

  return (
    <div className="space-y-6">
      <HealthHeader
        title="Demand Forecasting & Stockout Risk"
        subtitle="Predictive 30-day consumption modeling, epidemiological surge factors, and early stock exhaustion alerts."
        selectedDistrict={district}
        onDistrictChange={setDistrict}
        isRefreshing={isLoading}
        onRefresh={fetchForecasts}
      />

      <div className="px-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* Top Summary Banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="pran-card p-5 border border-rose-200 bg-rose-50/40">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-700">
              Projected 30-Day Deficit
            </span>
            <div className="text-3xl font-black text-rose-700 mt-2">
              {totalDeficit.toLocaleString()} <span className="text-sm font-semibold">units</span>
            </div>
            <p className="text-xs text-rose-900/80 mt-1 font-medium">
              Cumulative shortfall across vulnerable primary health centers
            </p>
          </div>

          <div className="pran-card p-5 border border-amber-200 bg-amber-50/40">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700">
              Imminent Stockout Threat
            </span>
            <div className="text-3xl font-black text-amber-800 mt-2">
              {forecasts.filter((f) => f.predicted_stockout_date?.includes('Hours') || f.predicted_stockout_date?.includes('5 Days')).length} <span className="text-sm font-semibold">facilities</span>
            </div>
            <p className="text-xs text-amber-900/80 mt-1 font-medium">
              Will exhaust critical inventory within 120 hours without transfer
            </p>
          </div>

          <div className="pran-card p-5 border border-teal-200 bg-teal-50/40">
            <span className="text-xs font-bold uppercase tracking-wider text-pran-teal">
              FORECAST SIGNAL
            </span>
            <div className="text-lg sm:text-xl font-black text-pran-dark mt-2 leading-tight">
              Seasonal demand pattern detected
            </div>
            <p className="text-xs text-slate-600 mt-1 font-medium">
              Calibrated with seasonal historical clinic consumption rates
            </p>
          </div>
        </div>

        {/* Forecasts List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                Active Facility Demand Projections (Next 30 Days)
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Detailed gap analysis between on-hand supply and forecast clinical demand
              </p>
            </div>
            <Link
              href="/health-system/redistribution"
              className="px-3.5 py-2 rounded-xl bg-pran-dark hover:bg-pran-deep text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
            >
              <span>Open Redistribution Hub</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {forecasts.map((fc) => (
              <div
                key={fc.id}
                className="pran-card p-5 border border-teal-100 bg-white space-y-4 hover:border-pran-turquoise transition-all"
              >
                <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-base font-black text-slate-900 block">
                      {fc.medicine_name}
                    </span>
                    <span className="text-xs text-slate-600 font-bold">
                      {fc.facility_name}
                    </span>
                    <span className="text-[11px] text-slate-400 block">
                      {fc.district} • {fc.tier}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-rose-100 text-rose-800 border border-rose-200">
                      <Clock className="w-3 h-3 stroke-[2.5]" />
                      Zero-Stock: {fc.predicted_stockout_date}
                    </span>
                  </div>
                </div>

                {/* Demand Comparison Bar Visual */}
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center text-slate-700 font-semibold">
                    <span>Current On-Hand Stock:</span>
                    <strong className="text-slate-900">{fc.current_stock.toLocaleString()} units</strong>
                  </div>
                  <div className="flex justify-between items-center text-slate-700 font-semibold">
                    <span>Projected 30-Day Need:</span>
                    <strong className="text-slate-900">{fc.projected_demand.toLocaleString()} units</strong>
                  </div>

                  {/* Visual Progress Bar */}
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, (fc.current_stock / fc.projected_demand) * 100)}%`,
                      }}
                    ></div>
                  </div>

                  <div className="flex justify-between items-center pt-1 text-xs">
                    <span className="text-rose-700 font-black">
                      Projected Shortfall: {fc.projected_deficit.toLocaleString()} units
                    </span>
                    <span className="text-slate-400 text-[10px]">
                      {((fc.current_stock / fc.projected_demand) * 100).toFixed(0)}% Covered
                    </span>
                  </div>
                </div>

                {/* Epidemiological Surge Factor */}
                <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-900 space-y-0.5">
                  <span className="font-extrabold text-[11px] uppercase tracking-wider block text-amber-800">
                    Epidemiological Surge Driver:
                  </span>
                  <p className="font-medium text-slate-700 leading-snug">
                    {fc.surge_factor_reason}
                  </p>
                </div>

                {/* Action CTA */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 font-medium">
                    Recommended Fix: Cross-district dispatch
                  </span>
                  <Link
                    href={`/health-system/redistribution`}
                    className="text-xs font-bold text-pran-teal hover:underline flex items-center gap-1"
                  >
                    <span>View Rebalance Options</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
