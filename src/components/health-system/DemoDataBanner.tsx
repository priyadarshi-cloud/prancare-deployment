import React from 'react';
import { Info, Sparkles, ShieldCheck } from 'lucide-react';

export default function DemoDataBanner() {
  return (
    <div className="bg-gradient-to-r from-amber-50 via-teal-50/50 to-amber-50 border-b border-amber-200/80 px-4 py-2.5">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-200/80 border border-amber-300 text-amber-900 font-extrabold text-[10px] tracking-wide uppercase">
            <Info className="w-3 h-3 stroke-[2.5]" />
            Prototype Simulator
          </span>
          <span className="font-semibold text-slate-800">
            Demo data — synthetic district/facility supply data
          </span>
        </div>
        <div className="flex items-center gap-3 text-slate-600 text-[11px]">
          <span className="hidden sm:inline">
            Smart Health & Supply Hackathon Track
          </span>
          <span className="inline-flex items-center gap-1 text-pran-dark font-medium bg-white/70 px-2 py-0.5 rounded-md border border-teal-200/60">
            <ShieldCheck className="w-3 h-3 text-pran-teal" />
            Simulated actions only • No real government transactions
          </span>
        </div>
      </div>
    </div>
  );
}
