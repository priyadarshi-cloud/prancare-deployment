'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from './AppContext';
import { Home, Camera, ShieldAlert, Users, MapPin, UserCheck } from 'lucide-react';

export default function Navigation() {
  const pathname = usePathname();
  const { t } = useApp();

  const navItems = [
    { href: '/', label: t('home', 'Home'), icon: Home },
    { href: '/scan', label: t('scan', 'Scan'), icon: Camera, highlight: true },
    { href: '/safemix', label: t('safemix', 'SafeMix'), icon: ShieldAlert },
    { href: '/family', label: t('family', 'Family'), icon: Users },
    { href: '/map', label: t('map', 'Map'), icon: MapPin },
    { href: '/profile', label: t('profile', 'Profile'), icon: UserCheck },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-teal-100 shadow-lg px-2 py-1 safe-area-pb">
      <div className="max-w-md mx-auto flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          const Icon = item.icon;

          if (item.highlight) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center justify-center -mt-5 group"
                aria-label={item.label}
              >
                <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-md transition-transform group-active:scale-95 ${
                  isActive
                    ? 'bg-pran-turquoise text-white ring-4 ring-pran-lightMint'
                    : 'bg-pran-dark text-white hover:bg-pran-deep ring-4 ring-white'
                }`}>
                  <Icon className="w-7 h-7" />
                </div>
                <span className="text-[11px] font-bold text-pran-dark mt-1">
                  {item.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center min-w-[48px] min-h-[48px] px-1 py-1 rounded-xl transition-colors ${
                isActive
                  ? 'text-pran-dark font-extrabold'
                  : 'text-slate-500 font-medium hover:text-pran-teal'
              }`}
              aria-label={item.label}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-pran-dark stroke-[2.5]' : 'stroke-[1.8]'}`} />
              <span className={`text-[11px] mt-0.5 ${isActive ? 'text-pran-dark font-bold' : ''}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
