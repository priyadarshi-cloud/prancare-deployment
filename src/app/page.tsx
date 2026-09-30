'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/components/AppContext';
import { Camera, Clock, ShieldAlert, ChevronRight, CheckCircle, AlertCircle, Sparkles, HeartHandshake, MapPin } from 'lucide-react';
import VoiceButton from '@/components/VoiceButton';

export default function HomePage() {
  const { t } = useApp();
  const [familyStatus, setFamilyStatus] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/family')
      .then((res) => res.json())
      .then((data) => {
        if (data.members) {
          setFamilyStatus(data.members);
        }
      })
      .catch((err) => console.log('Family status load note:', err));
  }, []);

  const dadi = familyStatus.find((m) => m.name.toLowerCase().includes('dadi')) || {
    name: 'Dadi',
    status: 'taken',
    next_dose_time: '8:00 AM',
    medicine_name: 'Glycomet 500mg',
    stock_count: 5,
  };

  const audioSummary = `Welcome to PranCare. Protect the life that matters most. You have three main features: Scan medicine to verify packaging, check family medicine reminders, and check if multiple medicines are safe to take together using SafeMix. Dadi took medicine at 8 AM. 5 pills remaining.`;

  return (
    <div className="space-y-4">
      {/* Top Banner & Audio Welcome */}
      <div className="flex items-center justify-between bg-teal-50 border border-teal-200/80 rounded-2xl px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-xs font-bold text-pran-dark">
            Elderly Care Active
          </span>
        </div>
        <VoiceButton textToRead={audioSummary} label={t('btn_read_aloud', 'Read Aloud')} className="!min-h-[36px] !py-1 text-xs" />
      </div>

      {/* CARD 1: Is My Medicine Real? (Matches Mockup Left Phone) */}
      <div className="bg-gradient-to-br from-[#0A363B] via-[#0E525A] to-[#126068] text-white rounded-[24px] p-5 shadow-lg border border-teal-700/50 relative overflow-hidden">
        {/* Background watermark badge */}
        <div className="absolute -right-6 -bottom-6 opacity-10 pointer-events-none">
          <Camera className="w-36 h-36" />
        </div>

        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-500/20 border border-teal-400/30 text-teal-200 text-xs font-semibold">
              <Sparkles className="w-3 h-3 text-pran-turquoise" />
              Packaging Verification
            </span>
            <h2 className="text-2xl font-black tracking-tight text-white mt-1">
              {t('scan_medicine_card_title', 'Is My Medicine Real?')}
            </h2>
            <p className="text-sm text-teal-100/90 font-medium">
              {t('scan_medicine_card_sub', 'Scan & verify packaging in seconds')}
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-2.5">
          <Link
            href="/scan"
            className="w-full min-h-[56px] bg-pran-turquoise hover:bg-[#0ea5a0] text-pran-dark font-extrabold text-base rounded-xl flex items-center justify-center gap-2.5 shadow-md active:scale-[0.99] transition-all"
          >
            <Camera className="w-5 h-5 stroke-[2.5]" />
            <span>{t('btn_scan', 'Scan Medicine')}</span>
          </Link>
          <div className="flex items-center justify-between text-xs text-teal-200/80 px-1">
            <span>✓ Batch, Expiry & Mfr OCR</span>
            <span>✓ Public Recall Check</span>
          </div>
        </div>
      </div>

      {/* CARD 2: Medicine Reminder & Family Feed */}
      <div className="pran-card p-5 border border-teal-100/80">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
              <Clock className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 leading-tight">
                {t('reminder_card_title', 'Medicine Reminder')}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {t('reminder_card_sub', 'Voice reminder in your language')}
              </p>
            </div>
          </div>
          <Link href="/family" className="text-xs font-bold text-pran-teal flex items-center gap-0.5">
            View All <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Live family adherence strip */}
        <div className="mt-4 bg-slate-50 rounded-xl p-3.5 border border-slate-200/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-700 font-bold text-xs">
              ✓
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-900">Dadi took medicine</span>
                <span className="text-xs text-slate-500 font-medium">· 8:00 AM</span>
              </div>
              <p className="text-xs text-slate-600 font-medium">
                Glycomet 500mg
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
              {dadi.stock_count} pills left
            </span>
          </div>
        </div>
      </div>

      {/* CARD 3: SafeMix Interaction Shield */}
      <div className="pran-card p-5 border border-teal-100/80">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-pran-teal">
              <ShieldAlert className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 leading-tight">
                {t('safemix_card_title', 'Are These Safe Together?')}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {t('safemix_card_sub', 'Check medicine interactions')}
              </p>
            </div>
          </div>
          <Link href="/safemix" className="text-xs font-bold text-pran-teal flex items-center gap-0.5">
            Check <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <p className="text-xs text-slate-600 mt-3 font-normal leading-relaxed">
          Screen allopathic tablets alongside Ayurvedic remedies (like Ashwagandha or Turmeric) to prevent adverse reactions.
        </p>

        <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-medium">
            Common: Aspirin + Ashwagandha
          </span>
          <Link
            href="/safemix"
            className="text-xs font-bold text-pran-dark bg-teal-50 border border-teal-200 px-3 py-1.5 rounded-lg hover:bg-teal-100"
          >
            Open SafeMix
          </Link>
        </div>
      </div>

      {/* Map & Community Safety Teaser */}
      <Link
        href="/map"
        className="block pran-card p-4 border border-teal-100 bg-gradient-to-r from-teal-50/50 to-white hover:border-pran-turquoise transition-colors"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-100/70 border border-teal-200 flex items-center justify-center text-pran-teal">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">
                {t('map_title', 'Medicine Safety Map')}
              </h4>
              <p className="text-xs text-slate-500">
                Privacy-first anonymized verification reports in your region
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </div>
      </Link>
    </div>
  );
}
