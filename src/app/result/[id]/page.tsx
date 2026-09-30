'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useApp } from '@/components/AppContext';
import StatusBadge from '@/components/StatusBadge';
import VoiceButton from '@/components/VoiceButton';
import {
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  ChevronDown,
  ChevronUp,
  Share2,
  PhoneCall,
  Camera,
  Info,
  ExternalLink,
  ShieldCheck,
  Calendar,
  Building2,
  Hash,
  Pill,
  Sparkles
} from 'lucide-react';
import { VerificationResult } from '@/types';

export default function ResultPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useApp();
  const scanId = params.id as string;

  const [reportData, setReportData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showWhyDetails, setShowWhyDetails] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (!scanId) return;

    fetch(`/api/report/${scanId}`)
      .then((res) => {
        if (!res.ok) throw new Error('Could not load verification report');
        return res.json();
      })
      .then((data) => {
        setReportData(data.report);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Report fetch error:', err);
        setError(err.message);
        setLoading(false);
      });
  }, [scanId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[350px] space-y-3">
        <div className="w-10 h-10 border-4 border-pran-teal border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-semibold text-slate-600">
          Loading verification record...
        </p>
      </div>
    );
  }

  if (error || !reportData) {
    return (
      <div className="pran-card p-6 text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-800">Verification Report Not Found</h2>
        <p className="text-xs text-slate-500">
          This scan could not be retrieved from the database.
        </p>
        <Link href="/scan" className="btn-primary w-full text-sm font-bold">
          Start New Scan
        </Link>
      </div>
    );
  }

  const { status, primaryReason, checks, sources, isDemo, medicine, extraction } = reportData;

  // Build audio text for voice read-aloud
  const readAloudText = `Verification result for ${medicine.name || 'your medicine'}. Status: ${
    status === 'VERIFIED'
      ? 'Verified against catalog records.'
      : status === 'NEEDS_VERIFICATION'
      ? 'Needs manual verification. Some packaging details were unreadable or unconfirmed.'
      : 'Suspicious information detected. Review with a pharmacist.'
  } What we found: ${medicine.name || 'Unknown medicine'}, manufacturer ${
    medicine.manufacturer || 'not confirmed'
  }, expiry date ${medicine.expDate || 'not verified'}. What should you do: ${
    status === 'SUSPICIOUS'
      ? 'Do not consume this pack until verified with a licensed pharmacist or doctor.'
      : 'Review dosage instructions with your physician or caregiver.'
  }`;

  const handleShare = () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({
        title: `PranCare Safety Report: ${medicine.name || 'Medicine'}`,
        text: `Medicine verification status: ${status} for ${medicine.name || 'Medicine'}.`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Bar: Status + Voice Read Aloud */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <StatusBadge status={status} isDemo={isDemo} size="lg" />
        <VoiceButton textToRead={readAloudText} />
      </div>

      {/* Main Medicine Packaging Card */}
      <div className="pran-card p-5 border border-teal-200/80 bg-white">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-xs font-bold text-pran-teal uppercase tracking-wider">
              {medicine.brand || 'Identified Product'}
            </span>
            <h1 className="text-xl font-black text-slate-900 mt-0.5">
              {medicine.name || 'Unlabeled Medicine Pack'}
            </h1>
          </div>
          <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-pran-dark flex-shrink-0">
            <Pill className="w-5 h-5" />
          </div>
        </div>

        {/* Key Attributes Grid */}
        <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-slate-100 text-xs">
          <div className="space-y-0.5">
            <span className="text-slate-400 font-semibold flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-slate-500" /> Manufacturer
            </span>
            <p className="font-bold text-slate-800 line-clamp-1">
              {medicine.manufacturer || 'Unreadable / Missing'}
            </p>
          </div>

          <div className="space-y-0.5">
            <span className="text-slate-400 font-semibold flex items-center gap-1">
              <Hash className="w-3.5 h-3.5 text-slate-500" /> Batch Number
            </span>
            <p className="font-bold text-slate-800">
              {medicine.batchNumber || 'Unreadable'}
            </p>
          </div>

          <div className="space-y-0.5">
            <span className="text-slate-400 font-semibold flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-500" /> Mfg. Date
            </span>
            <p className="font-bold text-slate-800">
              {medicine.mfgDate || 'Not specified'}
            </p>
          </div>

          <div className="space-y-0.5">
            <span className="text-slate-400 font-semibold flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-500" /> Expiry Date
            </span>
            <p className={`font-bold ${primaryReason === 'EXPIRED_PRODUCT' ? 'text-rose-600' : 'text-slate-800'}`}>
              {medicine.expDate || 'Not specified'}
            </p>
          </div>
        </div>

        {/* Mandatory Batch Caveat Notice */}
        <div className="mt-4 p-3 rounded-xl bg-teal-50/70 border border-teal-200/80 text-[11px] text-slate-700 leading-relaxed">
          <p className="font-semibold text-pran-dark mb-0.5 flex items-center gap-1">
            <Info className="w-3.5 h-3.5 text-pran-teal flex-shrink-0" />
            Batch Verification Notice:
          </p>
          While pack labels match registered catalog records, batch-level authentication requires manufacturer database confirmation.
        </div>
      </div>

      {/* THE 3-QUESTION BLOCK (Mandatory) */}
      <div className="pran-card p-5 border border-teal-100 bg-white space-y-4">
        {/* Q1: What did we find? */}
        <div className="space-y-1">
          <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-teal-100 text-pran-dark text-xs flex items-center justify-center font-bold">1</span>
            {t('q_what_found', 'What did we find?')}
          </h2>
          <p className="text-xs text-slate-700 leading-relaxed pl-7">
            Detected printed text for <span className="font-bold">{medicine.name || 'medicine'}</span> with batch <span className="font-mono font-bold">{medicine.batchNumber || 'unreadable'}</span> and expiry <span className="font-bold">{medicine.expDate || 'unspecified'}</span>.
          </p>
        </div>

        {/* Q2: What did we verify? */}
        <div className="space-y-1 border-t border-slate-100 pt-3">
          <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-teal-100 text-pran-dark text-xs flex items-center justify-center font-bold">2</span>
            {t('q_what_verified', 'What did we verify?')}
          </h2>
          <p className="text-xs text-slate-700 leading-relaxed pl-7">
            {status === 'VERIFIED'
              ? 'Product formulation, registered manufacturer name, and date consistency match public catalog records. No active regulator recall was found.'
              : status === 'NEEDS_VERIFICATION'
              ? 'Certain critical packaging imprints (such as manufacturer name or batch code) could not be verified against the catalog due to wear or low visibility.'
              : 'Our system flagged an inconsistency or active recall notice associated with this batch number or expiration date.'}
          </p>
        </div>

        {/* Q3: What should you do next? */}
        <div className="space-y-1 border-t border-slate-100 pt-3">
          <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-teal-100 text-pran-dark text-xs flex items-center justify-center font-bold">3</span>
            {t('q_what_next', 'What should you do next?')}
          </h2>
          <p className="text-xs text-slate-700 leading-relaxed pl-7 font-medium">
            {status === 'SUSPICIOUS'
              ? 'Do not take this medicine. Keep the packaging and consult your pharmacist or physician immediately for replacement.'
              : status === 'NEEDS_VERIFICATION'
              ? 'Take a clearer photograph in brighter light, or ask your pharmacist to verify the batch code on the billing receipt.'
              : 'Safe to keep in your daily routine as prescribed by your doctor.'}
          </p>
        </div>
      </div>

      {/* DETECTED VS VERIFIED SPLIT LISTS */}
      <div className="grid grid-cols-2 gap-3">
        {/* Detected List */}
        <div className="pran-card p-4 border border-slate-200">
          <h3 className="text-xs font-bold text-slate-900 mb-2 flex items-center gap-1.5">
            <Camera className="w-3.5 h-3.5 text-pran-teal" />
            Detected
          </h3>
          <ul className="text-[11px] text-slate-600 space-y-1.5">
            <li className="flex items-start gap-1">
              <span className="text-pran-teal font-bold">•</span>
              <span>Name: {medicine.name || '—'}</span>
            </li>
            <li className="flex items-start gap-1">
              <span className="text-pran-teal font-bold">•</span>
              <span>Batch: {medicine.batchNumber || '—'}</span>
            </li>
            <li className="flex items-start gap-1">
              <span className="text-pran-teal font-bold">•</span>
              <span>Expiry: {medicine.expDate || '—'}</span>
            </li>
          </ul>
        </div>

        {/* Verified List */}
        <div className="pran-card p-4 border border-slate-200">
          <h3 className="text-xs font-bold text-slate-900 mb-2 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Verified
          </h3>
          <ul className="text-[11px] text-slate-600 space-y-1.5">
            <li className="flex items-start gap-1">
              <span className="text-emerald-600 font-bold">✓</span>
              <span>Catalog match: {status === 'VERIFIED' ? 'Found' : 'Unconfirmed'}</span>
            </li>
            <li className="flex items-start gap-1">
              <span className="text-emerald-600 font-bold">✓</span>
              <span>Recall DB: {primaryReason === 'RECALLED_BATCH' ? 'ALERT' : 'Clear'}</span>
            </li>
            <li className="flex items-start gap-1">
              <span className="text-emerald-600 font-bold">✓</span>
              <span>Dates: {primaryReason === 'EXPIRED_PRODUCT' ? 'Expired' : 'Valid range'}</span>
            </li>
          </ul>
        </div>
      </div>

      {/* EXPANDABLE "Why did we get this result?" */}
      <div className="pran-card border border-teal-100 overflow-hidden">
        <button
          onClick={() => setShowWhyDetails(!showWhyDetails)}
          className="w-full p-4 text-left flex items-center justify-between font-bold text-xs text-slate-900 hover:bg-slate-50 transition-colors"
        >
          <span className="flex items-center gap-2">
            <Info className="w-4 h-4 text-pran-teal" />
            {t('why_result_title', 'Why did we get this result? (Detailed Check Rules)')}
          </span>
          {showWhyDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showWhyDetails && (
          <div className="p-4 pt-0 border-t border-slate-100 space-y-2 text-xs">
            {checks && checks.map((c: any) => (
              <div key={c.id} className="flex items-start justify-between py-1.5 border-b border-slate-100 last:border-none">
                <div>
                  <span className="font-bold text-slate-800">{c.id}: {c.label}</span>
                  {c.detail && <p className="text-[11px] text-slate-500">{c.detail}</p>}
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  c.outcome === 'pass' || c.outcome === 'ok'
                    ? 'bg-emerald-100 text-emerald-800'
                    : c.outcome === 'recalled' || c.outcome === 'expired'
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  {c.outcome}
                </span>
              </div>
            ))}

            <div className="pt-2 text-[11px] text-slate-500 font-medium">
              Data sources: {sources?.map((s: any) => s.name).join(', ') || 'Demo Catalog, Regulator Recall Alert DB'}
            </div>
          </div>
        )}
      </div>

      {/* ACTION BUTTONS */}
      <div className="space-y-2.5 pt-2">
        <div className="grid grid-cols-2 gap-2.5">
          <button
            onClick={handleShare}
            className="min-h-[50px] rounded-xl border border-teal-200 bg-white font-bold text-xs text-slate-800 flex items-center justify-center gap-2 hover:bg-teal-50 transition-colors"
          >
            <Share2 className="w-4 h-4 text-pran-teal" />
            <span>{copiedLink ? 'Link Copied!' : t('btn_share_report', 'Share Report')}</span>
          </button>

          <Link
            href={`/doctor-connect?scanId=${scanId}`}
            className="min-h-[50px] rounded-xl border border-teal-200 bg-white font-bold text-xs text-slate-800 flex items-center justify-center gap-2 hover:bg-teal-50 transition-colors"
          >
            <PhoneCall className="w-4 h-4 text-pran-teal" />
            <span>{t('btn_talk_doctor', 'Talk to Doctor')}</span>
          </Link>
        </div>

        <Link
          href="/scan"
          className="btn-primary w-full text-sm font-extrabold flex items-center justify-center gap-2"
        >
          <Camera className="w-4 h-4" />
          <span>Scan Another Medicine</span>
        </Link>
      </div>

      {/* STANDING LEGAL DISCLAIMERS */}
      <div className="p-4 rounded-2xl bg-slate-100 text-slate-600 text-[11px] leading-relaxed space-y-1">
        <p className="font-semibold text-slate-700">
          Important Consumer Guidance:
        </p>
        <p>{t('disclaimer_text', 'This check does not guarantee that a product is authentic. Buy medicines only from licensed pharmacies.')}</p>
        {status === 'SUSPICIOUS' && (
          <p className="text-rose-700 font-bold pt-1">
            {t('suspicious_disclaimer', 'Do not rely on this result alone. Please contact a pharmacist or the regulator for confirmation.')}
          </p>
        )}
      </div>
    </div>
  );
}
