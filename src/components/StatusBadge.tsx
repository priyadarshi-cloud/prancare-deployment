'use client';

import React from 'react';
import { CheckCircle2, AlertTriangle, AlertOctagon, HelpCircle, Sparkles } from 'lucide-react';
import { useApp } from './AppContext';

interface StatusBadgeProps {
  status: 'VERIFIED' | 'NEEDS_VERIFICATION' | 'SUSPICIOUS' | 'EXPIRED';
  isDemo?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function StatusBadge({ status, isDemo = true, size = 'md' }: StatusBadgeProps) {
  const { t } = useApp();

  let config = {
    bg: 'bg-emerald-50',
    border: 'border-emerald-300',
    text: 'text-emerald-800',
    icon: CheckCircle2,
    iconColor: 'text-emerald-600',
    label: t('status_verified', 'Verified')
  };

  if (status === 'NEEDS_VERIFICATION') {
    config = {
      bg: 'bg-amber-50',
      border: 'border-amber-300',
      text: 'text-amber-900',
      icon: HelpCircle,
      iconColor: 'text-amber-600',
      label: t('status_needs_verification', 'Needs Verification')
    };
  } else if (status === 'SUSPICIOUS') {
    config = {
      bg: 'bg-rose-50',
      border: 'border-rose-300',
      text: 'text-rose-900',
      icon: AlertOctagon,
      iconColor: 'text-rose-600',
      label: t('status_suspicious', 'Suspicious Information')
    };
  } else if (status === 'EXPIRED') {
    config = {
      bg: 'bg-red-50',
      border: 'border-red-400',
      text: 'text-red-900',
      icon: AlertTriangle,
      iconColor: 'text-red-600',
      label: t('status_expired', 'Expired — Do Not Use')
    };
  }

  const Icon = config.icon;
  const sizeClasses = {
    sm: 'text-xs px-2.5 py-1 gap-1.5',
    md: 'text-sm px-3.5 py-1.5 gap-2 font-bold',
    lg: 'text-base px-4 py-2.5 gap-2.5 font-extrabold'
  };

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  return (
    <div className="inline-flex items-center gap-2 flex-wrap">
      <div
        className={`inline-flex items-center rounded-full border shadow-sm ${config.bg} ${config.border} ${config.text} ${sizeClasses[size]}`}
      >
        <Icon className={`${iconSizes[size]} ${config.iconColor} flex-shrink-0 stroke-[2.5]`} />
        <span>{config.label}</span>
      </div>

      {isDemo && (
        <span className="demo-badge">
          <Sparkles className="w-3 h-3 text-amber-600" />
          {t('demo_data_badge', 'DEMO DATA')}
        </span>
      )}
    </div>
  );
}
