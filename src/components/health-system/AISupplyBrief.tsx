'use client';

import React, { useState } from 'react';
import { Sparkles, AlertTriangle, ArrowRight, ShieldCheck, RefreshCw, Zap } from 'lucide-react';

interface PriorityAlert {
  facility: string;
  district: string;
  medicine: string;
  daysRemaining: number;
  riskLevel: 'CRITICAL' | 'HIGH';
  urgencyReason: string;
}

interface RedistributionStrategy {
  action: string;
  fromFacility: string;
  toFacility: string;
  medicine: string;
  units: number;
  expectedImpact: string;
  spoilageMitigation: string;
}

interface AdvisoryData {
  headline: string;
  summary: string;
  source: string;
  generatedAt: string;
  priorityAlerts: PriorityAlert[];
  redistributionStrategies: RedistributionStrategy[];
  procurementRecommendations: string[];
  disclaimer: string;
}

export default function AISupplyBrief() {
  const [advisory, setAdvisory] = useState<AdvisoryData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAdvisory = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/health-system/ai-advisory', {
        method: 'POST',
      });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      setAdvisory(data);
    } catch (err: any) {
      console.error('Failed to load AI advisory:', err);
      setError(err?.message || 'Could not fetch AI supply advisory');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-[#0A363B] via-[#0E525A] to-[#126068] text-white rounded-3xl p-6 shadow-xl border border-teal-700/60 relative overflow-hidden">
      {/* Background Watermark */}
      <div className="absolute -right-8 -bottom-8 opacity-10 pointer-events-none">
        <Sparkles className="w-56 h-56 text-teal-200" />
      </div>

      <div className="relative z-10 space-y-4">
        {/* Header Strip */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-teal-700/50 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-400/20 text-pran-turquoise border border-teal-400/30 text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5 text-pran-turquoise animate-pulse" />
                Gemini 1.5 Supply Intelligence
              </span>
              <span className="text-[11px] text-teal-200/70 font-medium">
                Autonomous Supply & Logistics Reasoning
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              AI-Assisted Supply & Rebalancing Advisory
            </h2>
            <p className="text-xs text-teal-100/80 font-normal">
              Real-time multi-district supply chain reasoning: identifies imminent stockouts and calculates recommended cross-facility rebalancing before zero-stock occurs.
            </p>
          </div>

          <button
            onClick={fetchAdvisory}
            disabled={isLoading}
            className="self-start sm:self-auto min-h-[44px] px-4 py-2 rounded-xl bg-pran-turquoise hover:bg-teal-400 text-pran-dark font-black text-xs flex items-center gap-2 shadow-md transition-all active:scale-95 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Analyzing Supply Grid...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 stroke-[2.5]" />
                <span>{advisory ? 'Re-run AI Analysis' : 'Run Gemini AI Advisory'}</span>
              </>
            )}
          </button>
        </div>

        {/* State 1: Not yet run */}
        {!advisory && !isLoading && !error && (
          <div className="bg-teal-900/40 rounded-2xl p-5 border border-teal-600/30 text-center space-y-3">
            <p className="text-sm text-teal-100 font-medium max-w-xl mx-auto">
              Click <strong className="text-pran-turquoise">"Run Gemini AI Advisory"</strong> to synthesize current district deficits (Daryaganj, Hazratganj, Kankarbagh) with surplus stocks (South Delhi, Victoria) into an actionable clinical transfer manifest.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] text-teal-200/70">
              <span className="bg-teal-950/60 px-2.5 py-1 rounded-md border border-teal-800">✓ Seasonal surge adjustment</span>
              <span className="bg-teal-950/60 px-2.5 py-1 rounded-md border border-teal-800">✓ Batch expiry prioritization</span>
              <span className="bg-teal-950/60 px-2.5 py-1 rounded-md border border-teal-800">✓ Deterministic offline fallback enabled</span>
            </div>
          </div>
        )}

        {/* State 2: Error */}
        {error && (
          <div className="bg-rose-900/50 rounded-2xl p-4 border border-rose-500/40 text-rose-100 text-xs">
            {error}
          </div>
        )}

        {/* State 3: Advisory Loaded */}
        {advisory && (
          <div className="space-y-4 pt-1">
            {/* Headline and source */}
            <div className="bg-teal-950/50 rounded-2xl p-4 border border-teal-700/50 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-extrabold text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  {advisory.headline}
                </span>
                <span className="text-[10px] text-teal-300 bg-teal-900/80 px-2 py-0.5 rounded-full border border-teal-700">
                  Engine: {advisory.source === 'gemini' ? 'Gemini 1.5 Flash' : 'Deterministic Pharmacovigilance Model'}
                </span>
              </div>
              <p className="text-xs text-teal-100/90 leading-relaxed font-normal">
                {advisory.summary}
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Priority Alerts */}
              <div className="bg-teal-950/40 rounded-2xl p-4 border border-teal-700/40 space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-rose-300 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 stroke-[2.5]" />
                  Priority Stockout Hazards
                </h3>
                <div className="space-y-2.5">
                  {advisory.priorityAlerts.map((alert, i) => (
                    <div
                      key={i}
                      className="bg-black/20 rounded-xl p-3 border border-teal-800/60 space-y-1 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white">
                          {alert.medicine}
                        </span>
                        <span className="text-[11px] font-black px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40">
                          {alert.daysRemaining.toFixed(1)} Days Left
                        </span>
                      </div>
                      <div className="text-[11px] text-teal-200">
                        {alert.facility} • <span className="text-slate-300">{alert.district}</span>
                      </div>
                      <p className="text-[11px] text-teal-100/80 font-normal leading-relaxed pt-0.5">
                        {alert.urgencyReason}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Redistribution Strategy */}
              <div className="bg-teal-950/40 rounded-2xl p-4 border border-teal-700/40 space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 stroke-[2.5]" />
                  Intelligent Rebalancing Actions
                </h3>
                <div className="space-y-2.5">
                  {advisory.redistributionStrategies.map((strat, i) => (
                    <div
                      key={i}
                      className="bg-black/20 rounded-xl p-3 border border-teal-800/60 space-y-1.5 text-xs"
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-extrabold text-pran-turquoise">
                          {strat.action}
                        </span>
                        <span className="font-bold text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                          {strat.units.toLocaleString()} units
                        </span>
                      </div>

                      <div className="text-xs font-semibold text-white flex items-center gap-1.5 flex-wrap">
                        <span>{strat.fromFacility}</span>
                        <ArrowRight className="w-3 h-3 text-pran-turquoise" />
                        <span className="text-teal-200">{strat.toFacility}</span>
                      </div>

                      <p className="text-[11px] text-teal-100/80 leading-relaxed">
                        <strong>Impact:</strong> {strat.expectedImpact}
                      </p>
                      <p className="text-[10px] text-amber-200/80">
                        <strong>Waste Prevention:</strong> {strat.spoilageMitigation}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Procurement Guidance */}
            {advisory.procurementRecommendations && advisory.procurementRecommendations.length > 0 && (
              <div className="bg-teal-950/30 rounded-2xl p-3.5 border border-teal-700/40 text-xs space-y-1.5">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-teal-300">
                  Procurement & Long-Term Buffer Directives:
                </span>
                <ul className="space-y-1 text-[11px] text-teal-100/90 list-disc list-inside">
                  {advisory.procurementRecommendations.map((rec, i) => (
                    <li key={i}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
