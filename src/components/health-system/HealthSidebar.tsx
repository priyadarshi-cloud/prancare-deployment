'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Boxes,
  TrendingUp,
  Truck,
  Building2,
  ArrowLeft,
  Shield,
  Activity,
  UserCheck
} from 'lucide-react';

export default function HealthSidebar() {
  const pathname = usePathname();

  const navItems = [
    {
      href: '/health-system',
      label: 'Supply Command Center',
      icon: LayoutDashboard,
      badge: 'Live',
    },
    {
      href: '/health-system/inventory',
      label: 'Medicine Inventory & Stock',
      icon: Boxes,
    },
    {
      href: '/health-system/forecasts',
      label: 'Demand Forecasting',
      icon: TrendingUp,
      badge: '30-Day',
    },
    {
      href: '/health-system/redistribution',
      label: 'Cross-District Transfers',
      icon: Truck,
      badge: 'Urgent',
    },
    {
      href: '/health-system/facilities',
      label: 'Districts & Facilities',
      icon: Building2,
    },
  ];

  return (
    <aside className="w-64 bg-[#0A363B] text-white flex-shrink-0 flex flex-col justify-between border-r border-teal-900/60 shadow-xl min-h-screen">
      <div>
        {/* Brand Header */}
        <div className="p-5 border-b border-teal-800/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-pran-turquoise flex items-center justify-center text-pran-dark font-black shadow-md">
              <Activity className="w-6 h-6 text-pran-dark stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg tracking-tight text-white">
                  Pran<span className="text-pran-turquoise">Care</span>
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-200 border border-teal-400/30">
                  SUPPLY
                </span>
              </div>
              <p className="text-[11px] text-teal-200/70 font-medium">
                Health System Intelligence
              </p>
            </div>
          </div>
        </div>

        {/* User Role Banner */}
        <div className="mx-4 my-3 px-3 py-2 rounded-xl bg-teal-900/40 border border-teal-700/50 flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-teal-800/80 flex items-center justify-center text-teal-200">
            <UserCheck className="w-3.5 h-3.5 stroke-[2.5]" />
          </div>
          <div className="overflow-hidden">
            <p className="text-[11px] font-bold text-white truncate">
              Dr. Rajan Malhotra
            </p>
            <p className="text-[10px] text-teal-300 font-medium truncate">
              Chief Medical Officer (CMO)
            </p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="p-3 space-y-1.5">
          <div className="px-3 pt-2 pb-1 text-[10px] font-extrabold uppercase tracking-wider text-teal-300/60">
            Supply Operations
          </div>
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-pran-turquoise text-pran-dark font-extrabold shadow-sm'
                    : 'text-teal-100/90 hover:bg-teal-900/50 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      isActive
                        ? 'bg-pran-dark/20 text-pran-dark'
                        : item.badge === 'Urgent'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-400/40'
                        : 'bg-teal-700/50 text-teal-200'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer / Switch back to Citizen App */}
      <div className="p-4 border-t border-teal-800/60 bg-[#082b2f]/60 space-y-2">
        <Link
          href="/"
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold border border-white/15 transition-all shadow-sm active:scale-[0.98]"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Citizen App</span>
        </Link>
        <p className="text-[10px] text-teal-300/50 text-center">
          PranCare Public Health v1.0
        </p>
      </div>
    </aside>
  );
}
