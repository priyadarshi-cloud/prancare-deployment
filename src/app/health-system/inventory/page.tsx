'use client';

import React, { useEffect, useState } from 'react';
import HealthHeader from '@/components/health-system/HealthHeader';
import StockStatusBadge from '@/components/health-system/StockStatusBadge';
import { Search, Filter, Boxes, AlertTriangle, Building2, Phone } from 'lucide-react';

export default function HealthSystemInventoryPage() {
  const [items, setItems] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [district, setDistrict] = useState('ALL');
  const [tier, setTier] = useState('ALL');
  const [status, setStatus] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);

  const fetchInventory = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (district !== 'ALL') params.set('district', district);
      if (tier !== 'ALL') params.set('tier', tier);
      if (status !== 'ALL') params.set('status', status);
      if (search.trim()) params.set('search', search.trim());

      const res = await fetch(`/api/health-system/inventory?${params.toString()}`);
      const data = await res.json();
      setItems(data.items || []);
    } catch (err) {
      console.error('Failed to load inventory:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [district, tier, status]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchInventory();
  };

  return (
    <div className="space-y-6">
      <HealthHeader
        title="Medicine Inventory & Facility Stock"
        subtitle="Multi-tier stock visibility, consumption velocity, and batch expiry tracking."
        selectedDistrict={district}
        onDistrictChange={setDistrict}
        selectedTier={tier}
        onTierChange={setTier}
        isRefreshing={isLoading}
        onRefresh={fetchInventory}
      />

      <div className="px-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* Filter bar */}
        <div className="pran-card p-4 border border-teal-100 bg-white flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search Input */}
          <form onSubmit={handleSearchSubmit} className="relative w-full md:w-96">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search medicine, salt, batch, facility..."
              className="w-full h-10 pl-9 pr-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-pran-turquoise"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          </form>

          {/* Status Quick Filter Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
            {['ALL', 'CRITICAL', 'WARNING', 'ADEQUATE', 'SURPLUS'].map((st) => (
              <button
                key={st}
                onClick={() => setStatus(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  status === st
                    ? 'bg-pran-dark text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st === 'ALL' ? 'All Status' : st}
              </button>
            ))}
          </div>
        </div>

        {/* Inventory Ledger Table */}
        <div className="pran-card overflow-hidden border border-teal-100 bg-white shadow-sm">
          <div className="p-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Boxes className="w-4 h-4 text-pran-teal" />
              <span className="text-xs font-black uppercase tracking-wider text-slate-700">
                Facility Stock Records ({items.length} SKUs Listed)
              </span>
            </div>
            <span className="text-[11px] font-medium text-slate-500">
              Sorted by stockout urgency
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/90 text-slate-500 font-extrabold uppercase tracking-wider border-b border-slate-200 text-[10px]">
                <tr>
                  <th className="py-3 px-4">Medicine & Formulation</th>
                  <th className="py-3 px-4">Facility & Tier</th>
                  <th className="py-3 px-4">District</th>
                  <th className="py-3 px-4 text-right">Current Stock</th>
                  <th className="py-3 px-4 text-right">Daily Burn</th>
                  <th className="py-3 px-4 text-right">Days Reserve</th>
                  <th className="py-3 px-4 text-center">Batch Expiry</th>
                  <th className="py-3 px-4 text-center">Supply Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      No stock records match the selected criteria.
                    </td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-teal-50/30 transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-extrabold text-slate-900 text-sm">
                          {item.medicine_name}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {item.category} • Batch: <code className="font-mono text-slate-700">{item.batch_number}</code>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">
                          {item.facility_name}
                        </div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-slate-400" />
                          <span className="font-bold">{item.tier}</span> • Contact: {item.contact_person}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">
                          {item.district}
                        </div>
                        <div className="text-[10px] text-slate-400">{item.state}</div>
                      </td>

                      <td className="py-3.5 px-4 text-right font-black text-slate-900 text-sm">
                        {item.current_stock.toLocaleString()}
                      </td>

                      <td className="py-3.5 px-4 text-right text-slate-600">
                        {item.daily_consumption_rate}/day
                      </td>

                      <td className="py-3.5 px-4 text-right font-black">
                        <span
                          className={
                            item.days_of_supply < 7
                              ? 'text-rose-600'
                              : item.days_of_supply < 15
                              ? 'text-amber-600'
                              : item.days_of_supply > 45
                              ? 'text-indigo-600'
                              : 'text-emerald-700'
                          }
                        >
                          {item.days_of_supply.toFixed(1)} d
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center text-slate-600 font-mono text-[11px]">
                        {item.expiry_date}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <StockStatusBadge
                          status={item.stock_status}
                          daysOfSupply={item.days_of_supply}
                          showDays={false}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
