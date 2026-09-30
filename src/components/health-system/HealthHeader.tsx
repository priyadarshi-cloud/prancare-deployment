'use client';

import React from 'react';
import { Building2, Filter, RefreshCw, Activity, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface HealthHeaderProps {
  title: string;
  subtitle: string;
  selectedDistrict?: string;
  onDistrictChange?: (district: string) => void;
  selectedTier?: string;
  onTierChange?: (tier: string) => void;
  districts?: string[];
  tiers?: string[];
  isRefreshing?: boolean;
  onRefresh?: () => void;
}

export default function HealthHeader({
  title,
  subtitle,
  selectedDistrict,
  onDistrictChange,
  selectedTier,
  onTierChange,
  districts = ['ALL', 'Central Delhi', 'South Delhi', 'Lucknow', 'Patna', 'Bengaluru'],
  tiers = ['ALL', 'DH', 'CHC', 'PHC'],
  isRefreshing = false,
  onRefresh,
}: HealthHeaderProps) {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-teal-100 shadow-sm px-6 py-3.5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Title and breadcrumbs */}
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-pran-teal">
              National Health Mission • Supply Grid
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {title}
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            {subtitle}
          </p>
        </div>

        {/* Action Controls & Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* District Switcher */}
          {onDistrictChange && (
            <div className="relative flex items-center">
              <span className="absolute left-2.5 text-xs text-slate-400 font-bold pointer-events-none">
                District:
              </span>
              <select
                value={selectedDistrict || 'ALL'}
                onChange={(e) => onDistrictChange(e.target.value)}
                aria-label="Filter by District"
                className="h-9 pl-16 pr-8 text-xs font-bold rounded-xl bg-slate-50 border border-slate-200 text-slate-800 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-pran-turquoise cursor-pointer"
              >
                <option value="ALL">All Districts</option>
                {districts
                  .filter((d) => d !== 'ALL')
                  .map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
              </select>
            </div>
          )}

          {/* Tier Switcher */}
          {onTierChange && (
            <div className="relative flex items-center">
              <span className="absolute left-2.5 text-xs text-slate-400 font-bold pointer-events-none">
                Tier:
              </span>
              <select
                value={selectedTier || 'ALL'}
                onChange={(e) => onTierChange(e.target.value)}
                aria-label="Filter by Facility Tier"
                className="h-9 pl-12 pr-8 text-xs font-bold rounded-xl bg-slate-50 border border-slate-200 text-slate-800 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-pran-turquoise cursor-pointer"
              >
                <option value="ALL">All Tiers</option>
                <option value="DH">District Hospital (DH)</option>
                <option value="CHC">Community Health (CHC)</option>
                <option value="PHC">Primary Health (PHC)</option>
              </select>
            </div>
          )}

          {/* Refresh Button */}
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              aria-label="Refresh Data"
              title="Refresh Data"
              className="h-9 px-3 rounded-xl bg-teal-50 border border-teal-200 text-pran-dark font-bold text-xs flex items-center gap-1.5 hover:bg-teal-100 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-pran-teal ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          )}

          {/* Mobile Citizen Return Link */}
          <Link
            href="/"
            className="md:hidden h-9 px-3 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1 hover:bg-slate-200"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Citizen</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
