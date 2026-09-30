'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/components/AppContext';
import {
  Globe,
  Type,
  Shield,
  Trash2,
  ExternalLink,
  Check,
  Sparkles,
  Info,
  Building2,
  ChevronRight
} from 'lucide-react';
import citations from '../../../content/citations.json';

export default function ProfilePage() {
  const { locale, setLocale, textSize, setTextSize, supportedLocales } = useApp();
  const [shareLocation, setShareLocation] = useState(false);
  const [clearedMessage, setClearedMessage] = useState(false);

  const handleClearData = () => {
    if (confirm('Are you sure you want to clear your local preferences and history?')) {
      localStorage.clear();
      sessionStorage.clear();
      setClearedMessage(true);
      setTimeout(() => window.location.reload(), 1500);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Settings & Accessibility
        </h1>
        <p className="text-xs text-slate-600 font-medium">
          Customize language, text sizing, and privacy controls.
        </p>
      </div>

      {/* Language Preferences */}
      <div className="pran-card p-5 border border-teal-100 bg-white space-y-3">
        <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
          <Globe className="w-4 h-4 text-pran-teal" />
          Language (भाषा / மொழி / ভাষা)
        </h2>

        <div className="grid grid-cols-2 gap-2">
          {supportedLocales.map((loc) => {
            const isSelected = locale === loc.code;
            return (
              <button
                key={loc.code}
                onClick={() => setLocale(loc.code)}
                className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                  isSelected
                    ? 'bg-teal-50 border-pran-teal text-pran-dark font-extrabold shadow-sm'
                    : 'bg-slate-50/60 border-slate-200 text-slate-700 font-medium hover:bg-slate-100'
                }`}
              >
                <div>
                  <span className="block text-xs">{loc.label}</span>
                  <span className="block text-sm font-bold text-slate-900">{loc.nativeName}</span>
                </div>
                {isSelected && <Check className="w-4 h-4 text-pran-teal stroke-[3]" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Elderly Text Sizing */}
      <div className="pran-card p-5 border border-teal-100 bg-white space-y-3">
        <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
          <Type className="w-4 h-4 text-pran-teal" />
          Text Size for Easy Reading
        </h2>

        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => setTextSize('normal')}
            className={`py-3 px-2 rounded-xl border text-center transition-all ${
              textSize === 'normal'
                ? 'bg-teal-50 border-pran-teal text-pran-dark font-bold'
                : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            <span className="text-xs block font-bold">Normal</span>
            <span className="text-sm text-slate-500">18px</span>
          </button>

          <button
            onClick={() => setTextSize('large')}
            className={`py-3 px-2 rounded-xl border text-center transition-all ${
              textSize === 'large'
                ? 'bg-teal-50 border-pran-teal text-pran-dark font-bold'
                : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            <span className="text-sm block font-bold">Large</span>
            <span className="text-sm text-slate-500">20px</span>
          </button>

          <button
            onClick={() => setTextSize('extralarge')}
            className={`py-3 px-2 rounded-xl border text-center transition-all ${
              textSize === 'extralarge'
                ? 'bg-teal-50 border-pran-teal text-pran-dark font-bold'
                : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            <span className="text-base block font-bold">Extra</span>
            <span className="text-sm text-slate-500">23px</span>
          </button>
        </div>
      </div>

      {/* Privacy & Opt-In */}
      <div className="pran-card p-5 border border-teal-100 bg-white space-y-3">
        <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
          <Shield className="w-4 h-4 text-pran-teal" />
          Community Safety Radar Opt-In
        </h2>

        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-900 block">
              Contribute anonymous coarse verification signals
            </span>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              When enabled, only regional city centroid codes are submitted to help community alerts. Individual coordinates or identities are never logged.
            </p>
          </div>
          <button
            onClick={() => setShareLocation(!shareLocation)}
            className={`w-12 h-6 rounded-full transition-colors relative flex-shrink-0 mt-1 ${
              shareLocation ? 'bg-pran-turquoise' : 'bg-slate-300'
            }`}
          >
            <span
              className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                shareLocation ? 'right-0.5' : 'left-0.5'
              }`}
            ></span>
          </button>
        </div>
      </div>

      {/* Institutional Health System Supply Link */}
      <div className="pran-card p-4 border border-teal-200/80 bg-gradient-to-r from-teal-50/70 to-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-pran-dark text-white flex items-center justify-center shadow-sm">
              <Building2 className="w-5 h-5 text-pran-turquoise" />
            </div>
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-pran-teal block">
                Healthcare Administration
              </span>
              <h3 className="text-sm font-bold text-slate-900 leading-tight">
                Health System Supply Command
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                District stock visibility, demand forecasts, and redistribution
              </p>
            </div>
          </div>
          <Link
            href="/health-system"
            className="px-3 py-1.5 rounded-xl bg-pran-dark hover:bg-pran-deep text-white font-bold text-xs flex items-center gap-1 shadow-sm active:scale-95 transition-all"
          >
            <span>Open</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Clear Data Action */}
      <div className="pt-1">
        <button
          onClick={handleClearData}
          className="w-full min-h-[48px] rounded-xl border border-rose-200 bg-rose-50/60 text-rose-800 font-bold text-xs flex items-center justify-center gap-2 hover:bg-rose-100 transition-colors"
        >
          <Trash2 className="w-4 h-4 text-rose-600" />
          <span>{clearedMessage ? 'Data Cleared!' : 'Clear All Local App Data'}</span>
        </button>
      </div>

      {/* About & Grounded Citations */}
      <div className="p-4 rounded-2xl bg-teal-50 border border-teal-100 space-y-2 text-xs text-slate-600">
        <div className="flex items-center gap-1.5 font-bold text-pran-dark">
          <Sparkles className="w-4 h-4 text-pran-teal" />
          <span>PranCare · Protect the Life That Matters Most</span>
        </div>
        <p className="text-[11px] leading-relaxed">
          Designed for Indian households, elderly parents, and caregivers. Built with privacy-first k-anonymity (k=5) and deterministic verification logic.
        </p>
        <div className="pt-2 border-t border-teal-200/60 text-[10px] text-slate-500">
          Source Citations: WHO Technical Report Series No. 908 · GS1 India General Specifications · National Health Portal Drug Safety
        </div>
      </div>
    </div>
  );
}
