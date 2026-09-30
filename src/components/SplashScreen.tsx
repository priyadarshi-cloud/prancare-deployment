'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';

export default function SplashScreen() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Only show once per session
    const hasSeenSplash = sessionStorage.getItem('prancare_splash_seen');
    if (!hasSeenSplash) {
      setVisible(true);
      sessionStorage.setItem('prancare_splash_seen', 'true');
      const timer = setTimeout(() => {
        setVisible(false);
      }, 2400);
      return () => clearTimeout(timer);
    }
  }, []);

  if (!visible) return null;

  return (
    <div
      onClick={() => setVisible(false)}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-pran-dark via-[#0B3D43] to-[#0E525A] text-white cursor-pointer select-none transition-opacity duration-500 animate-fadeIn"
      title="Tap anywhere to skip"
    >
      <div className="flex flex-col items-center gap-4 text-center px-6">
        <div className="relative w-24 h-24 rounded-full overflow-hidden shadow-2xl border-2 border-pran-turquoise/60 animate-bounce">
          <Image
            src="/logo.png"
            alt="PranCare Logo"
            width={96}
            height={96}
            className="object-cover"
            priority
          />
        </div>

        <div className="flex flex-col items-center gap-1">
          <h1 className="text-4xl font-black tracking-tight text-white">
            Pran<span className="text-pran-turquoise">Care</span>
          </h1>
          <p className="text-sm font-medium text-teal-100/90 tracking-wide mt-1">
            Protect the Life That Matters Most
          </p>
        </div>

        <div className="mt-8 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-pran-turquoise animate-ping"></span>
          <span className="text-xs text-teal-200 tracking-wider uppercase font-semibold">
            Medicine Verification & Family Care
          </span>
        </div>

        <p className="text-[11px] text-teal-300/60 mt-4">
          Tap anywhere to continue
        </p>
      </div>
    </div>
  );
}
