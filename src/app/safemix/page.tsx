'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useApp } from '@/components/AppContext';
import VoiceButton from '@/components/VoiceButton';
import {
  ShieldAlert,
  ShieldCheck,
  Plus,
  X,
  PhoneCall,
  MessageSquare,
  Share2,
  Sparkles,
  AlertTriangle,
  Info,
  Pill,
  Leaf
} from 'lucide-react';
import { SafeMixResponse } from '@/types';

const POPULAR_REMEDIES = [
  { name: 'Aspirin', type: 'allopathic' },
  { name: 'Ashwagandha', type: 'ayurvedic' },
  { name: 'Metformin', type: 'allopathic' },
  { name: 'Amlodipine', type: 'allopathic' },
  { name: 'Turmeric (Curcumin)', type: 'ayurvedic' },
  { name: 'Paracetamol', type: 'allopathic' }
];

export default function SafeMixPage() {
  const { t } = useApp();

  const [medicines, setMedicines] = useState<string[]>(['Aspirin', 'Ashwagandha']);
  const [inputVal, setInputVal] = useState('');
  const [result, setResult] = useState<SafeMixResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchInteractions = async (medList: string[]) => {
    if (medList.length < 2) {
      setResult(null);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/safemix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ medicines: medList })
      });
      if (res.ok) {
        const data = await res.json();
        setResult(data);
      }
    } catch (err) {
      console.error('SafeMix fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInteractions(medicines);
  }, [medicines]);

  const addMedicine = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (!medicines.some((m) => m.toLowerCase() === trimmed.toLowerCase())) {
      const updated = [...medicines, trimmed];
      setMedicines(updated);
      setInputVal('');
    }
  };

  const removeMedicine = (index: number) => {
    const updated = medicines.filter((_, i) => i !== index);
    setMedicines(updated);
  };

  const audioText = result
    ? `SafeMix interaction screening. Overall risk is ${result.overallRisk}. ${result.summary} If taking together, remember to consult your physician.`
    : 'Add two or more medicines or Ayurvedic supplements to check interactions.';

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-bold text-pran-teal uppercase tracking-wide flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Dual-System Safety Shield
          </span>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {t('safemix_heading', 'SafeMix · Safety Check')}
          </h1>
          <p className="text-xs text-slate-600 font-medium">
            {t('safemix_tagline', 'Check interactions between allopathic and Ayurvedic remedies')}
          </p>
        </div>
        {result && <VoiceButton textToRead={audioText} className="!min-h-[38px] !py-1 text-xs" />}
      </div>

      {/* Input Section & Selected Chips */}
      <div className="pran-card p-5 border border-teal-200 bg-white space-y-3">
        <label className="block text-xs font-bold text-slate-700">
          Medicines & Herbs to Compare:
        </label>

        {/* Selected medicine tags */}
        <div className="flex flex-wrap gap-2 min-h-[44px]">
          {medicines.map((med, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-teal-50 border border-teal-200 text-pran-dark font-bold text-xs shadow-sm"
            >
              {med.toLowerCase().includes('ashwagandha') || med.toLowerCase().includes('turmeric') ? (
                <Leaf className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Pill className="w-3.5 h-3.5 text-pran-teal" />
              )}
              <span>{med}</span>
              <button
                type="button"
                onClick={() => removeMedicine(idx)}
                className="w-4 h-4 rounded-full bg-teal-200 text-pran-dark flex items-center justify-center hover:bg-rose-100 hover:text-rose-700 transition-colors"
                aria-label={`Remove ${med}`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}

          {medicines.length === 0 && (
            <span className="text-xs text-slate-400 italic py-1">
              Select or type medicines below to begin interaction check.
            </span>
          )}
        </div>

        {/* Text Input to add custom medicine */}
        <div className="flex gap-2 pt-1">
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addMedicine(inputVal);
              }
            }}
            placeholder="Type tablet, syrup or herb name..."
            className="flex-1 min-h-[48px] px-3.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-pran-teal bg-slate-50/50"
          />
          <button
            type="button"
            onClick={() => addMedicine(inputVal)}
            className="min-h-[48px] px-4 rounded-xl bg-pran-dark text-white font-bold text-xs flex items-center gap-1 hover:bg-pran-deep"
          >
            <Plus className="w-4 h-4" />
            <span>Add</span>
          </button>
        </div>

        {/* Quick Suggestion Chips */}
        <div className="pt-2 border-t border-slate-100">
          <span className="text-[11px] font-bold text-slate-500 block mb-1.5">
            Quick Add Popular Combinations:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {POPULAR_REMEDIES.map((item) => (
              <button
                key={item.name}
                type="button"
                onClick={() => addMedicine(item.name)}
                className="text-[11px] px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-teal-50 text-slate-700 font-semibold transition-colors"
              >
                + {item.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Interaction Results Screen (Matches Center Phone Mockup) */}
      {loading && (
        <div className="pran-card p-6 text-center space-y-2">
          <div className="w-8 h-8 border-3 border-pran-teal border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-semibold text-slate-600">
            Analyzing pharmacological and herbal interactions...
          </p>
        </div>
      )}

      {result && !loading && (
        <div className="space-y-4">
          {/* Overall Warning Banner if significant */}
          {result.overallRisk === 'high' ? (
            <div className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-400 text-rose-950 space-y-1.5 shadow-sm">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-600 stroke-[2.5]" />
                <span className="font-black text-sm tracking-wide">
                  {t('safemix_danger', 'POTENTIAL INTERACTION DETECTED')}
                </span>
              </div>
              <p className="text-xs text-rose-900 leading-relaxed pl-7">
                {result.summary}
              </p>
            </div>
          ) : result.overallRisk === 'moderate' ? (
            <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-950 space-y-1.5 shadow-sm">
              <div className="flex items-center gap-2">
                <Info className="w-5 h-5 text-amber-600 stroke-[2.5]" />
                <span className="font-black text-sm tracking-wide">
                  MONITORING ADVISED
                </span>
              </div>
              <p className="text-xs text-amber-900 leading-relaxed pl-7">
                {result.summary}
              </p>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-300 text-emerald-950 space-y-1.5 shadow-sm">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600 stroke-[2.5]" />
                <span className="font-black text-sm tracking-wide">
                  NO KNOWN HIGH-RISK CONFLICT
                </span>
              </div>
              <p className="text-xs text-emerald-900 leading-relaxed pl-7">
                {result.summary}
              </p>
            </div>
          )}

          {/* Interaction Pairs Detail Cards */}
          <div className="space-y-3">
            {result.pairs.map((pairItem, idx) => (
              <div
                key={idx}
                className="pran-card p-4 border border-teal-100 bg-white space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-900">
                    {pairItem.pair[0]} + {pairItem.pair[1]}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      pairItem.severity === 'significant'
                        ? 'bg-rose-100 text-rose-800'
                        : pairItem.severity === 'possible'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {pairItem.severity === 'significant'
                      ? 'Significant Risk'
                      : pairItem.severity === 'possible'
                      ? 'Mild / Monitor'
                      : 'No Known Clash'}
                  </span>
                </div>

                <p className="text-xs text-slate-700 leading-relaxed">
                  {pairItem.plainExplanation}
                </p>

                {/* Doctor Question Prompt */}
                <div className="p-3 rounded-xl bg-teal-50/70 border border-teal-100 text-xs text-pran-dark">
                  <span className="font-bold block mb-0.5 text-pran-teal">
                    {t('safemix_ask_doctor', 'What to ask your doctor')}:
                  </span>
                  <p className="italic text-slate-700">
                    &quot;{pairItem.whatToAskDoctor}&quot;
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Action CTAs (Matches Center Phone Mockup) */}
          <div className="space-y-2 pt-2">
            <Link
              href="/doctor-connect?ref=safemix"
              className="w-full min-h-[52px] btn-primary text-sm font-bold flex items-center justify-center gap-2"
            >
              <PhoneCall className="w-4 h-4" />
              <span>{t('btn_talk_doctor', 'Talk to Doctor Now')}</span>
            </Link>

            <div className="grid grid-cols-2 gap-2">
              <Link
                href="/doctor-connect?mode=chat&ref=safemix"
                className="min-h-[48px] rounded-xl border border-teal-200 bg-white text-pran-dark font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-teal-50"
              >
                <MessageSquare className="w-4 h-4 text-pran-teal" />
                <span>{t('btn_chat_doctor', 'Chat with Doctor')}</span>
              </Link>
              <button
                onClick={() => {
                  if (typeof navigator !== 'undefined' && navigator.share) {
                    navigator.share({
                      title: 'PranCare SafeMix Interaction Summary',
                      text: `SafeMix screening for ${medicines.join(', ')}: ${result.summary}`,
                      url: window.location.href
                    }).catch(() => {});
                  }
                }}
                className="min-h-[48px] rounded-xl border border-teal-200 bg-white text-pran-dark font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-teal-50"
              >
                <Share2 className="w-4 h-4 text-pran-teal" />
                <span>Share Summary</span>
              </button>
            </div>
          </div>

          {/* Safety Disclaimer */}
          <div className="p-3.5 rounded-xl bg-slate-100 text-slate-500 text-[11px] leading-relaxed">
            {result.disclaimer}
          </div>
        </div>
      )}
    </div>
  );
}
