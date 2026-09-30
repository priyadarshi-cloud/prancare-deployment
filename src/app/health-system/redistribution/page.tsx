'use client';

import React, { useEffect, useState } from 'react';
import HealthHeader from '@/components/health-system/HealthHeader';
import RedistributionCard from '@/components/health-system/RedistributionCard';
import { Truck, AlertTriangle, ShieldCheck, CheckCircle2, ArrowRight } from 'lucide-react';

export default function HealthSystemRedistributionPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);

  const fetchRedistributions = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/health-system/redistribution');
      const data = await res.json();
      setOrders(data.recommendations || []);
    } catch (err) {
      console.error('Failed to load redistributions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRedistributions();
  }, []);

  const filteredOrders = orders.filter((order) => {
    if (statusFilter !== 'ALL' && order.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <HealthHeader
        title="Cross-District Redistribution Engine"
        subtitle="AI-assisted surplus-to-deficit medicine matching to reduce stockout risk and improve stock utilization."
        isRefreshing={isLoading}
        onRefresh={fetchRedistributions}
      />

      <div className="px-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* Core Explanatory Banner */}
        <div className="bg-gradient-to-r from-teal-50 via-white to-amber-50 rounded-2xl p-5 border border-teal-200 shadow-sm space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-pran-teal"></span>
            <span className="text-xs font-black uppercase tracking-wider text-pran-dark">
              Smart Supply Optimization Rule
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed">
            Facilities holding <strong>&gt;45 days buffer</strong> with approaching expiry dates are automatically paired with Primary Health Centres facing <strong>&lt;7 days critical stockout</strong> within transport range. Clicking <em>"Simulate Dispatch"</em> transitions the logistics state in this prototype simulation.
          </p>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {['ALL', 'PROPOSED', 'APPROVED', 'IN_TRANSIT', 'COMPLETED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  statusFilter === st
                    ? 'bg-pran-dark text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {st === 'ALL' ? 'All Orders' : st.replace('_', ' ')}
              </button>
            ))}
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Showing {filteredOrders.length} of {orders.length} recommended transfers
          </div>
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          {filteredOrders.length === 0 ? (
            <div className="pran-card p-12 text-center text-slate-500 text-xs font-medium">
              No redistribution orders currently match the selected status filter.
            </div>
          ) : (
            filteredOrders.map((order) => (
              <RedistributionCard
                key={order.id}
                order={order}
                onStatusUpdate={() => fetchRedistributions()}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
