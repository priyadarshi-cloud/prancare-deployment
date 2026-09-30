'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import HealthHeader from '@/components/health-system/HealthHeader';
import SupplyKpiCard from '@/components/health-system/SupplyKpiCard';
import StockStatusBadge from '@/components/health-system/StockStatusBadge';
import AISupplyBrief from '@/components/health-system/AISupplyBrief';
import RedistributionCard from '@/components/health-system/RedistributionCard';
import {
  Boxes,
  AlertTriangle,
  ArrowUpRight,
  Truck,
  TrendingDown,
  Building2,
  ArrowRight,
  ShieldCheck,
  MapPin,
  Clock,
  ChevronRight
} from 'lucide-react';

export default function HealthSystemDashboardPage() {
  const [overview, setOverview] = useState<any>(null);
  const [selectedDistrict, setSelectedDistrict] = useState('ALL');
  const [selectedTier, setSelectedTier] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);

  const fetchOverview = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/health-system/overview');
      const data = await res.json();
      setOverview(data);
    } catch (err) {
      console.error('Failed to load supply overview:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const summary = overview?.summary || {
    totalFacilities: 12,
    totalSkus: 22,
    criticalCount: 4,
    warningCount: 4,
    adequateCount: 9,
    surplusCount: 5,
    activeRedistributions: 4,
  };

  const criticalAlerts = (overview?.criticalAlerts || []).filter((item: any) => {
    if (selectedDistrict !== 'ALL' && item.district !== selectedDistrict) return false;
    if (selectedTier !== 'ALL' && item.tier !== selectedTier) return false;
    return true;
  });

  const activeRedistributions = overview?.activeRedistributions || [];
  const districtSummary = overview?.districtSummary || [];

  return (
    <div className="space-y-6">
      <HealthHeader
        title="Supply Command Center"
        subtitle="Real-time multi-district medicine inventory monitoring, stockout early warnings, and intelligent redistribution."
        selectedDistrict={selectedDistrict}
        onDistrictChange={setSelectedDistrict}
        selectedTier={selectedTier}
        onTierChange={setSelectedTier}
        isRefreshing={isLoading}
        onRefresh={fetchOverview}
      />

      <div className="px-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* Row 1: KPI Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <SupplyKpiCard
            title="Monitored Facilities"
            value={summary.totalFacilities}
            subtext="District Hospitals, CHCs & PHCs"
            icon={Building2}
            variant="info"
          />
          <SupplyKpiCard
            title="Critical Stockouts"
            value={summary.criticalCount}
            subtext="Facilities under 7 days reserve"
            icon={AlertTriangle}
            variant="danger"
          />
          <SupplyKpiCard
            title="Surplus Pockets"
            value={summary.surplusCount}
            subtext="Facilities with >45 days stock"
            icon={ArrowUpRight}
            variant="purple"
          />
          <SupplyKpiCard
            title="Redistribution Orders"
            value={summary.activeRedistributions}
            subtext="Surplus-to-deficit transfers"
            icon={Truck}
            variant="warning"
          />
        </div>

        {/* Row 2: AI Supply Intelligence (Gemini Brief) */}
        <AISupplyBrief />

        {/* Row 3: Two Column Layout (Urgent Early Warnings + Active Transfers) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Column A: Urgent Stockout Early Warnings (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-rose-600 stroke-[2.5]" />
                  Critical Stockout Early Warnings
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  Medicines approaching zero-stock within 7 days
                </p>
              </div>
              <Link
                href="/health-system/inventory?status=CRITICAL"
                className="text-xs font-bold text-pran-teal hover:underline flex items-center gap-1"
              >
                View Ledger <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="pran-card overflow-hidden border border-teal-100 bg-white">
              {criticalAlerts.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500 font-medium">
                  No critical stockouts matching current district/tier filters.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {criticalAlerts.map((item: any) => (
                    <div
                      key={item.id}
                      className="p-4 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-slate-900 text-sm">
                            {item.medicine_name}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-bold">
                            {item.tier}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-2">
                          <span className="font-medium text-slate-800">{item.facility_name}</span>
                          <span>•</span>
                          <span>{item.district}</span>
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Burn rate: <strong>{item.daily_consumption_rate} units/day</strong> • Batch exp: {item.expiry_date}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 sm:text-right">
                        <div>
                          <div className="text-sm font-black text-rose-700">
                            {item.current_stock.toLocaleString()} units
                          </div>
                          <StockStatusBadge
                            status="CRITICAL"
                            daysOfSupply={item.days_of_supply}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Column B: Recommended Cross-District Transfers (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <Truck className="w-5 h-5 text-pran-teal stroke-[2.2]" />
                  Active Redistribution Orders
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  Surplus-to-deficit rebalancing proposals
                </p>
              </div>
              <Link
                href="/health-system/redistribution"
                className="text-xs font-bold text-pran-teal hover:underline flex items-center gap-1"
              >
                All Orders <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-3">
              {activeRedistributions.slice(0, 2).map((order: any) => (
                <RedistributionCard
                  key={order.id}
                  order={order}
                  onStatusUpdate={() => fetchOverview()}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Row 4: District Supply Health Table */}
        <div className="space-y-3 pt-2">
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
              District-Level Supply Health Scorecards
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Regional breakdown of stock resilience and risk concentrations
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {districtSummary.map((d: any) => (
              <div
                key={d.district}
                className="pran-card p-4 border border-teal-100 bg-white hover:border-pran-turquoise transition-all"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="font-extrabold text-sm text-slate-900">
                    {d.district}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-50 text-pran-dark border border-teal-200">
                    {d.state}
                  </span>
                </div>

                <div className="mt-3 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Facilities Reporting:</span>
                    <strong className="text-slate-900">{d.facility_count}</strong>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Critical Deficits:</span>
                    <span className="font-extrabold text-rose-600">{d.critical_items}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Surplus Buffers:</span>
                    <span className="font-bold text-indigo-600">{d.surplus_items}</span>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100">
                  <Link
                    href={`/health-system/inventory?district=${encodeURIComponent(d.district)}`}
                    className="text-[11px] font-bold text-pran-teal hover:underline flex items-center justify-between"
                  >
                    <span>Inspect District Inventory</span>
                    <ArrowRight className="w-3 h-3" />
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
