'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/components/AppContext';
import VoiceButton from '@/components/VoiceButton';
import {
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Phone,
  Bell,
  BellOff,
  AlertCircle,
  Plus,
  Pill,
  Sparkles,
  CalendarCheck
} from 'lucide-react';

interface FamilyMember {
  id: string;
  name: string;
  relation: string;
  avatar?: string;
  next_dose_time: string;
  medicine_name: string;
  status: 'taken' | 'missed' | 'pending';
  stock_count: number;
  refill_status: string;
  alert_on_missed: number;
}

export default function FamilyPage() {
  const { t } = useApp();
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [nudgeMessage, setNudgeMessage] = useState<string | null>(null);

  const fetchMembers = () => {
    fetch('/api/family')
      .then((res) => res.json())
      .then((data) => {
        if (data.members) {
          setMembers(data.members);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Family fetch error:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const toggleStatus = async (member: FamilyMember) => {
    const nextStatus = member.status === 'taken' ? 'missed' : 'taken';
    try {
      await fetch('/api/family', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: member.id, status: nextStatus })
      });
      fetchMembers();
    } catch (err) {
      console.error('Toggle status error:', err);
    }
  };

  const toggleAlert = async (member: FamilyMember) => {
    const nextAlert = member.alert_on_missed ? 0 : 1;
    try {
      await fetch('/api/family', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: member.id, alert_on_missed: nextAlert })
      });
      fetchMembers();
    } catch (err) {
      console.error('Toggle alert error:', err);
    }
  };

  const handleSendNudge = (name: string) => {
    setNudgeMessage(`Voice nudge sent to ${name}'s phone.`);
    setTimeout(() => setNudgeMessage(null), 3000);
  };

  const audioSummary = `Family care status. Dadi has taken her 8:00 AM Glycomet medicine. 5 pills remaining. Dada missed his morning Telma H medicine. Please give him a call or send a gentle reminder.`;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-bold text-pran-teal uppercase tracking-wide flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-pran-turquoise" />
            Live Care Adherence
          </span>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {t('family_heading', 'Family Care Monitor')}
          </h1>
          <p className="text-xs text-slate-600 font-medium">
            Track daily doses and pill supplies for elderly family members.
          </p>
        </div>
        <VoiceButton textToRead={audioSummary} className="!min-h-[38px] !py-1 text-xs" />
      </div>

      {nudgeMessage && (
        <div className="p-3 rounded-xl bg-teal-50 border border-teal-300 text-pran-dark font-bold text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-pran-teal" />
          <span>{nudgeMessage}</span>
        </div>
      )}

      {loading ? (
        <div className="pran-card p-6 text-center text-xs text-slate-500 font-medium">
          Loading family members...
        </div>
      ) : (
        <div className="space-y-3.5">
          {members.map((member) => {
            const isTaken = member.status === 'taken';
            const isMissed = member.status === 'missed';
            const isLowStock = member.stock_count <= 5;

            return (
              <div
                key={member.id}
                className={`pran-card p-5 border transition-all ${
                  isMissed
                    ? 'border-rose-200 bg-rose-50/20 shadow-sm'
                    : 'border-teal-100 bg-white'
                }`}
              >
                {/* Member Identity & Dose Status */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center font-extrabold text-lg border ${
                        isTaken
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : isMissed
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      {member.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-extrabold text-slate-900">
                          {member.name}
                        </h2>
                        <span className="text-xs text-slate-500 font-medium">
                          ({member.relation})
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 font-semibold flex items-center gap-1.5 mt-0.5">
                        <Pill className="w-3.5 h-3.5 text-pran-teal" />
                        {member.medicine_name}
                      </p>
                    </div>
                  </div>

                  {/* Status Pill */}
                  <button
                    onClick={() => toggleStatus(member)}
                    title="Click to toggle taken/missed"
                    className={`px-3 py-1 rounded-full text-xs font-black flex items-center gap-1.5 border transition-transform active:scale-95 ${
                      isTaken
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : isMissed
                        ? 'bg-rose-100 text-rose-800 border-rose-300'
                        : 'bg-amber-100 text-amber-800 border-amber-300'
                    }`}
                  >
                    {isTaken ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 stroke-[2.5]" />
                        <span>Taken</span>
                      </>
                    ) : isMissed ? (
                      <>
                        <XCircle className="w-3.5 h-3.5 text-rose-700 stroke-[2.5]" />
                        <span>Missed</span>
                      </>
                    ) : (
                      <>
                        <Clock className="w-3.5 h-3.5 text-amber-700" />
                        <span>Pending</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Dose Time & Stock Level */}
                <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100 text-xs">
                  <div>
                    <span className="text-slate-400 font-medium block">Dose Time:</span>
                    <span className="font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      {member.next_dose_time}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 font-medium block">Stock Remaining:</span>
                    <span
                      className={`font-bold flex items-center gap-1 mt-0.5 ${
                        isLowStock ? 'text-rose-600' : 'text-slate-800'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${isLowStock ? 'bg-rose-600 animate-ping' : 'bg-emerald-500'}`}></span>
                      {member.stock_count} {t('family_pills_left', 'pills left')}
                    </span>
                  </div>
                </div>

                {/* Low Stock Warning Banner */}
                {isLowStock && (
                  <div className="mt-3 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 font-semibold flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                      {t('family_refill_scheduled', 'Refill reminder scheduled')}
                    </span>
                    <span className="text-[10px] bg-amber-200/70 text-amber-900 px-1.5 py-0.5 rounded">
                      Low Stock
                    </span>
                  </div>
                )}

                {/* Missed Dose Quick Actions (Matches Mockup) */}
                {isMissed && (
                  <div className="mt-3 pt-3 border-t border-rose-100 flex items-center gap-2">
                    <button
                      onClick={() => handleSendNudge(member.name)}
                      className="flex-1 min-h-[44px] rounded-xl bg-pran-dark text-white font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-pran-deep"
                    >
                      <Bell className="w-3.5 h-3.5" />
                      <span>Send Voice Nudge</span>
                    </button>
                    <a
                      href="tel:+919876543210"
                      className="min-h-[44px] px-3.5 rounded-xl border border-rose-300 bg-white text-rose-800 font-bold text-xs flex items-center justify-center gap-1.5"
                    >
                      <Phone className="w-3.5 h-3.5 text-rose-600" />
                      <span>Call Now</span>
                    </a>
                  </div>
                )}

                {/* Alert Toggle */}
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 font-medium">
                    {t('family_alert_toggle', 'Alert me if dose missed')}
                  </span>
                  <button
                    onClick={() => toggleAlert(member)}
                    className={`w-9 h-5 rounded-full transition-colors relative ${
                      member.alert_on_missed ? 'bg-pran-turquoise' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                        member.alert_on_missed ? 'right-0.5' : 'left-0.5'
                      }`}
                    ></span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Reminder CTA */}
      <div className="pt-2">
        <button
          onClick={() => alert('New member or reminder setup modal.')}
          className="w-full min-h-[52px] rounded-2xl border-2 border-dashed border-teal-300 text-pran-dark font-extrabold text-sm flex items-center justify-center gap-2 bg-teal-50/50 hover:bg-teal-50 transition-colors"
        >
          <Plus className="w-4 h-4 text-pran-teal" />
          <span>Add Family Member or Medicine</span>
        </button>
      </div>
    </div>
  );
}
