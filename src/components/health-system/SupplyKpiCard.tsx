import React from 'react';
import { LucideIcon } from 'lucide-react';

interface SupplyKpiCardProps {
  title: string;
  value: string | number;
  subtext: string;
  icon: LucideIcon;
  variant?: 'danger' | 'warning' | 'success' | 'info' | 'purple';
}

export default function SupplyKpiCard({
  title,
  value,
  subtext,
  icon: Icon,
  variant = 'info',
}: SupplyKpiCardProps) {
  const variantStyles = {
    danger: {
      bg: 'bg-rose-50/70',
      border: 'border-rose-200',
      iconBg: 'bg-rose-100 text-rose-700',
      valueColor: 'text-rose-700',
    },
    warning: {
      bg: 'bg-amber-50/70',
      border: 'border-amber-200',
      iconBg: 'bg-amber-100 text-amber-800',
      valueColor: 'text-amber-800',
    },
    success: {
      bg: 'bg-emerald-50/70',
      border: 'border-emerald-200',
      iconBg: 'bg-emerald-100 text-emerald-700',
      valueColor: 'text-emerald-800',
    },
    purple: {
      bg: 'bg-indigo-50/70',
      border: 'border-indigo-200',
      iconBg: 'bg-indigo-100 text-indigo-700',
      valueColor: 'text-indigo-800',
    },
    info: {
      bg: 'bg-teal-50/50',
      border: 'border-teal-200',
      iconBg: 'bg-teal-100 text-pran-teal',
      valueColor: 'text-pran-dark',
    },
  }[variant];

  return (
    <div className={`p-4 rounded-2xl border ${variantStyles.border} ${variantStyles.bg} bg-white shadow-sm flex flex-col justify-between transition-all hover:shadow-md`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
          {title}
        </span>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${variantStyles.iconBg}`}>
          <Icon className="w-5 h-5 stroke-[2.2]" />
        </div>
      </div>

      <div className="mt-3">
        <div className={`text-2xl sm:text-3xl font-black tracking-tight ${variantStyles.valueColor}`}>
          {value}
        </div>
        <p className="text-xs text-slate-600 mt-1 font-medium">
          {subtext}
        </p>
      </div>
    </div>
  );
}
