'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Header from './Header';
import Navigation from './Navigation';
import SplashScreen from './SplashScreen';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHealthSystem = pathname.startsWith('/health-system');

  if (isHealthSystem) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F2F9F9]">
        <main className="flex-1 w-full min-w-0">
          {children}
        </main>
      </div>
    );
  }

  // Standard Citizen Shell (Unchanged)
  return (
    <>
      <SplashScreen />
      <div className="min-h-screen flex flex-col bg-[#F2F9F9]">
        <Header />
        <main className="flex-1 max-w-md w-full mx-auto px-4 pt-4 pb-28">
          {children}
        </main>
        <Navigation />
      </div>
    </>
  );
}
