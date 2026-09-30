'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useApp } from './AppContext';
import { Globe, Type, Sparkles, Building2 } from 'lucide-react';

export default function Header() {
  const { locale, setLocale, textSize, setTextSize, supportedLocales } = useApp();

  const nextTextSize = () => {
    if (textSize === 'normal') setTextSize('large');
    else if (textSize === 'large') setTextSize('extralarge');
    else setTextSize('normal');
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-teal-100 shadow-sm px-4 py-3">
      <div className="max-w-md mx-auto flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5">
          <div className="relative w-10 h-10 rounded-full overflow-hidden shadow-sm border border-teal-200">
            <Image
              src="/logo.png"
              alt="PranCare Logo"
              width={40}
              height={40}
              className="object-cover"
              priority
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-2xl tracking-tight text-pran-dark leading-none">
                Pran<span className="text-pran-turquoise">Care</span>
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-medium tracking-wide">
              Protect The Life That Matters
            </p>
          </div>
        </Link>

        {/* Quick Accessibility Controls */}
        <div className="flex items-center gap-2">
          {/* Text Scaling Button */}
          <button
            onClick={nextTextSize}
            aria-label="Adjust text size"
            title="Adjust text size"
            className="w-10 h-10 rounded-full bg-teal-50 border border-teal-200 text-pran-dark font-bold flex items-center justify-center hover:bg-teal-100 transition-colors"
          >
            <span className="text-xs">
              {textSize === 'normal' ? 'A' : textSize === 'large' ? 'A+' : 'A++'}
            </span>
          </button>

          {/* Language Selector Dropdown */}
          <div className="relative flex items-center">
            <select
              value={locale}
              onChange={(e) => setLocale(e.target.value as any)}
              aria-label="Choose Language"
              className="h-10 pl-2 pr-6 rounded-full bg-teal-50 border border-teal-200 text-pran-dark font-semibold text-xs appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-pran-turquoise"
            >
              {supportedLocales.map((loc) => (
                <option key={loc.code} value={loc.code}>
                  {loc.nativeName}
                </option>
              ))}
            </select>
            <Globe className="w-3.5 h-3.5 text-pran-teal absolute right-2 pointer-events-none" />
          </div>

          {/* Health System Portal Switcher */}
          <Link
            href="/health-system"
            aria-label="Health System Supply Portal"
            title="Health System Supply Portal"
            className="h-10 px-2.5 rounded-full bg-teal-50 border border-teal-200 text-pran-dark font-bold flex items-center gap-1 hover:bg-teal-100 transition-colors text-xs"
          >
            <Building2 className="w-3.5 h-3.5 text-pran-teal" />
            <span className="text-[11px] font-bold">Supply</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
