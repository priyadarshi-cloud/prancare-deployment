import React from 'react';
import { AlertTriangle, Clock, CheckCircle2, ArrowUpRight } from 'lucide-react';

interface StockStatusBadgeProps {
  status: 'CRITICAL' | 'WARNING' | 'ADEQUATE' | 'SURPLUS' | string;
  daysOfSupply?: number;
  showDays?: boolean;
  className?: string;
}

export default function StockStatusBadge({
  status,
  daysOfSupply,
  showDays = true,
  className = '',
}: StockStatusBadgeProps) {
  const norm = status.toUpperCase();

  if (norm === 'CRITICAL') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-rose-50 text-rose-700 border border-rose-300 shadow-sm ${className}`}
      >
        <AlertTriangle className="w-3.5 h-3.5 stroke-[2.5] text-rose-600 animate-pulse" />
        <span>CRITICAL</span>
        {showDays && daysOfSupply !== undefined && (
          <span className="text-[11px] font-bold text-rose-800">
            ({daysOfSupply.toFixed(1)}d left)
          </span>
        )}
      </span>
    );
  }

  if (norm === 'WARNING') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-extrabold bg-amber-50 text-amber-800 border border-amber-300 ${className}`}
      >
        <Clock className="w-3.5 h-3.5 stroke-[2.5] text-amber-600" />
        <span>WARNING</span>
        {showDays && daysOfSupply !== undefined && (
          <span className="text-[11px] font-bold text-amber-900">
            ({daysOfSupply.toFixed(1)}d left)
          </span>
        )}
      </span>
    );
  }

  if (norm === 'SURPLUS') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-300 ${className}`}
      >
        <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5] text-indigo-600" />
        <span>SURPLUS</span>
        {showDays && daysOfSupply !== undefined && (
          <span className="text-[11px] font-bold text-indigo-900">
            ({daysOfSupply.toFixed(0)}d)
          </span>
        )}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 ${className}`}
    >
      <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5] text-emerald-600" />
      <span>ADEQUATE</span>
      {showDays && daysOfSupply !== undefined && (
        <span className="text-[11px] font-medium text-emerald-700">
          ({daysOfSupply.toFixed(0)}d)
        </span>
      )}
    </span>
  );
}
