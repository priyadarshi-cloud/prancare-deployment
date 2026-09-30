'use client';

import React, { useState } from 'react';
import { Truck, ArrowRight, Clock, MapPin, CheckCircle, ShieldAlert, Check } from 'lucide-react';

interface RedistributionOrder {
  id: string;
  medicine_name: string;
  source_facility_id: string;
  source_name: string;
  source_district: string;
  source_tier: string;
  target_facility_id: string;
  target_name: string;
  target_district: string;
  target_tier: string;
  transfer_units: number;
  urgency: 'CRITICAL' | 'MODERATE' | string;
  status: 'PROPOSED' | 'APPROVED' | 'IN_TRANSIT' | 'COMPLETED' | string;
  rationale: string;
  distance_km: number;
  est_transit_hours: number;
}

interface RedistributionCardProps {
  order: RedistributionOrder;
  onStatusUpdate?: (updated: RedistributionOrder) => void;
}

export default function RedistributionCard({
  order,
  onStatusUpdate,
}: RedistributionCardProps) {
  const [currentOrder, setCurrentOrder] = useState<RedistributionOrder>(order);
  const [isUpdating, setIsUpdating] = useState(false);
  const [simulationNote, setSimulationNote] = useState<string | null>(null);

  const handleSimulateAction = async (nextStatus: string) => {
    setIsUpdating(true);
    setSimulationNote(null);
    try {
      const res = await fetch('/api/health-system/redistribution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: currentOrder.id, nextStatus }),
      });
      const data = await res.json();
      if (data.success && data.updatedRecord) {
        setCurrentOrder(data.updatedRecord);
        setSimulationNote(
          `Simulated Prototype Action: Order status updated to "${nextStatus}". (Demo simulation only — no real government inventory transaction was executed).`
        );
        if (onStatusUpdate) onStatusUpdate(data.updatedRecord);
      }
    } catch (err) {
      console.error('Failed to update transfer status:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const statusBadge = () => {
    switch (currentOrder.status) {
      case 'IN_TRANSIT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-blue-50 text-blue-700 border border-blue-200">
            <Truck className="w-3.5 h-3.5 animate-pulse" />
            IN TRANSIT (Simulated)
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Check className="w-3.5 h-3.5 stroke-[3]" />
            DISPATCH APPROVED
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-slate-100 text-slate-700 border border-slate-300">
            <CheckCircle className="w-3.5 h-3.5" />
            COMPLETED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-amber-50 text-amber-800 border border-amber-300">
            <Clock className="w-3.5 h-3.5" />
            ACTION PROPOSED
          </span>
        );
    }
  };

  return (
    <div className="pran-card p-5 border border-teal-100/90 bg-white space-y-4 hover:border-pran-turquoise transition-all">
      {/* Top row: Medicine name, units, urgency, and status */}
      <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-100 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm sm:text-base font-black text-slate-900">
              {currentOrder.medicine_name}
            </span>
            {currentOrder.urgency === 'CRITICAL' && (
              <span className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-200">
                CRITICAL REBALANCE
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Order Reference: {currentOrder.id}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-right">
            <span className="text-base sm:text-lg font-black text-pran-dark">
              {currentOrder.transfer_units.toLocaleString()}
            </span>
            <span className="text-[11px] text-slate-500 font-bold ml-1">units</span>
          </div>
          {statusBadge()}
        </div>
      </div>

      {/* Facilities Flow: Source (Surplus) -> Target (Deficit) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-50 rounded-2xl p-3.5 border border-slate-200/70 text-xs">
        {/* Source Facility */}
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-indigo-700 font-bold text-[11px]">
            <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
            SURPLUS SOURCE FACILITY
          </div>
          <p className="font-extrabold text-slate-900 text-sm leading-snug">
            {currentOrder.source_name}
          </p>
          <p className="text-slate-600 text-[11px]">
            {currentOrder.source_district} • <span className="font-semibold">{currentOrder.source_tier}</span>
          </p>
        </div>

        {/* Target Facility */}
        <div className="space-y-1 md:border-l md:border-slate-200 md:pl-4">
          <div className="flex items-center gap-1.5 text-rose-700 font-bold text-[11px]">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            DEFICIT DESTINATION FACILITY
          </div>
          <p className="font-extrabold text-slate-900 text-sm leading-snug">
            {currentOrder.target_name}
          </p>
          <p className="text-slate-600 text-[11px]">
            {currentOrder.target_district} • <span className="font-semibold">{currentOrder.target_tier}</span>
          </p>
        </div>
      </div>

      {/* Logistics & Rationale */}
      <div className="space-y-2 text-xs">
        <p className="text-slate-700 font-normal leading-relaxed">
          <strong className="text-slate-900">Clinical Rationale:</strong> {currentOrder.rationale}
        </p>

        <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500 pt-1">
          <span className="inline-flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-pran-teal" />
            Transit Distance: <strong>{currentOrder.distance_km} km</strong>
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-pran-teal" />
            Estimated Transit: <strong>{currentOrder.est_transit_hours} hrs</strong>
          </span>
        </div>
      </div>

      {/* Simulation Feedback Note */}
      {simulationNote && (
        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium flex items-start gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
          <span>{simulationNote}</span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
        <div className="text-[11px] text-slate-500 font-medium">
          Prototype Simulated Action Workflow
        </div>

        <div className="flex items-center gap-2">
          {currentOrder.status === 'PROPOSED' && (
            <button
              onClick={() => handleSimulateAction('APPROVED')}
              disabled={isUpdating}
              className="px-3.5 py-2 rounded-xl bg-pran-dark hover:bg-pran-deep text-white font-bold text-xs flex items-center gap-1.5 shadow-sm active:scale-95 disabled:opacity-50"
            >
              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Simulate Approval</span>
            </button>
          )}

          {currentOrder.status === 'APPROVED' && (
            <button
              onClick={() => handleSimulateAction('IN_TRANSIT')}
              disabled={isUpdating}
              className="px-3.5 py-2 rounded-xl bg-pran-turquoise hover:bg-teal-400 text-pran-dark font-extrabold text-xs flex items-center gap-1.5 shadow-sm active:scale-95 disabled:opacity-50"
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Simulate Dispatch</span>
            </button>
          )}

          {currentOrder.status === 'IN_TRANSIT' && (
            <button
              onClick={() => handleSimulateAction('COMPLETED')}
              disabled={isUpdating}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm active:scale-95 disabled:opacity-50"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Simulate Delivery Confirmed</span>
            </button>
          )}

          {currentOrder.status === 'COMPLETED' && (
            <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
              <CheckCircle className="w-4 h-4" />
              Transfer Complete (Simulated)
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
