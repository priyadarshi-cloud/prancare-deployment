import React from 'react';
import type { Metadata } from 'next';
import HealthSidebar from '@/components/health-system/HealthSidebar';
import DemoDataBanner from '@/components/health-system/DemoDataBanner';

export const metadata: Metadata = {
  title: 'PranCare Health System — Public Health Supply Chain & Early Warning',
  description: 'Smart Health & Supply inventory visibility, demand forecasting, stockout risk alerts, and cross-district redistribution.',
};

export default function HealthSystemLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#F2F9F9] flex flex-col antialiased">
      {/* Simulation Disclosure Banner */}
      <DemoDataBanner />

      <div className="flex-1 flex flex-col md:flex-row w-full">
        {/* Enterprise Sidebar */}
        <div className="hidden md:block">
          <HealthSidebar />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#F2F9F9] pb-16">
          {children}
        </div>
      </div>
    </div>
  );
}
