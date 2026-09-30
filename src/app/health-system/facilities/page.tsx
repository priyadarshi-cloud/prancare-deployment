'use client';

import React, { useEffect, useState } from 'react';
import HealthHeader from '@/components/health-system/HealthHeader';
import { Building2, Phone, MapPin, CheckCircle, AlertTriangle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function HealthSystemFacilitiesPage() {
  const [facilities, setFacilities] = useState<any[]>([]);
  const [district, setDistrict] = useState('ALL');
  const [tier, setTier] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch inventory grouped by facility
    fetch('/api/health-system/inventory')
      .then((res) => res.json())
      .then((data) => {
        const items = data.items || [];
        const facMap = new Map<string, any>();

        for (const item of items) {
          if (!facMap.has(item.facility_id)) {
            facMap.set(item.facility_id, {
              id: item.facility_id,
              name: item.facility_name,
              district: item.district,
              state: item.state,
              tier: item.tier,
              contact_person: item.contact_person,
              phone: item.phone,
              criticalCount: 0,
              totalSkus: 0,
            });
          }
          const f = facMap.get(item.facility_id)!;
          f.totalSkus++;
          if (item.stock_status === 'CRITICAL') f.criticalCount++;
        }
        setFacilities(Array.from(facMap.values()));
      })
      .catch((err) => console.error('Failed to load facilities:', err))
      .finally(() => setIsLoading(false));
  }, []);

  const filteredFacilities = facilities.filter((f) => {
    if (district !== 'ALL' && f.district !== district) return false;
    if (tier !== 'ALL' && f.tier !== tier) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <HealthHeader
        title="Districts & Public Health Facilities"
        subtitle="Network directory of District Hospitals, Community Health Centres, and Primary Health Centres."
        selectedDistrict={district}
        onDistrictChange={setDistrict}
        selectedTier={tier}
        onTierChange={setTier}
        isRefreshing={isLoading}
      />

      <div className="px-6 space-y-6 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFacilities.map((fac) => (
            <div
              key={fac.id}
              className="pran-card p-5 border border-teal-100 bg-white space-y-3 hover:border-pran-turquoise transition-all flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-pran-dark font-black">
                    <Building2 className="w-5 h-5 text-pran-teal" />
                  </div>
                  <span
                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                      fac.tier === 'DH'
                        ? 'bg-purple-100 text-purple-800 border border-purple-200'
                        : fac.tier === 'CHC'
                        ? 'bg-blue-100 text-blue-800 border border-blue-200'
                        : 'bg-teal-100 text-teal-800 border border-teal-200'
                    }`}
                  >
                    {fac.tier === 'DH'
                      ? 'District Hospital'
                      : fac.tier === 'CHC'
                      ? 'Community Health'
                      : 'Primary Health'}
                  </span>
                </div>

                <div>
                  <h3 className="font-extrabold text-slate-900 text-base leading-tight">
                    {fac.name}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mt-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      {fac.district}, {fac.state}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 text-xs space-y-1 text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-medium text-slate-700">{fac.phone}</span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Store Head: <strong className="text-slate-800">{fac.contact_person}</strong>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <div>
                  {fac.criticalCount > 0 ? (
                    <span className="text-rose-700 font-extrabold flex items-center gap-1 text-[11px]">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      {fac.criticalCount} Critical Stockouts
                    </span>
                  ) : (
                    <span className="text-emerald-700 font-bold flex items-center gap-1 text-[11px]">
                      <CheckCircle className="w-3.5 h-3.5" />
                      All SKUs Resilient
                    </span>
                  )}
                </div>

                <Link
                  href={`/health-system/inventory?district=${encodeURIComponent(fac.district)}`}
                  className="text-xs font-bold text-pran-teal hover:underline flex items-center gap-1"
                >
                  <span>Inventory</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
