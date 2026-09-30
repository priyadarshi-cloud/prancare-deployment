'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  PhoneCall,
  Video,
  MessageSquare,
  AlertTriangle,
  ArrowLeft,
  FileText,
  Send,
} from 'lucide-react';

function DoctorConnectContent() {
  const searchParams = useSearchParams();
  const scanId = searchParams.get('scanId');
  const refSource = searchParams.get('ref');

  const [callState, setCallState] = useState<'idle' | 'calling' | 'connected'>('idle');
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'doctor'; text: string }>>([
    {
      sender: 'doctor',
      text: 'Namaste. I am Dr. Sharma (Consultant Physician). I have access to your PranCare verification summary. How can I assist you today?'
    }
  ]);
  const [chatInput, setChatInput] = useState('');

  const handleStartCall = () => {
    setCallState('calling');
    setTimeout(() => {
      setCallState('connected');
    }, 2000);
  };

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput.trim();
    setMessages((prev) => [...prev, { sender: 'user', text: userMsg }]);
    setChatInput('');

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'doctor',
          text: `Thank you for sharing. For suspected package irregularities or herb-drug combinations, I recommend holding the unverified dose and bringing the blister pack to your nearest pharmacy for physical inspection.`
        }
      ]);
    }, 1200);
  };

  return (
    <div className="space-y-4">
      {/* Prototype Disclaimer Banner */}
      <div className="p-3.5 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-900 text-xs flex items-center gap-2.5">
        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
        <div>
          <span className="font-extrabold uppercase tracking-wide block">
            Telehealth Prototype Mode
          </span>
          <span className="text-[11px] text-amber-800">
            This is a demonstration interface. No real doctor, telemedicine provider, or emergency service is connected.
          </span>
        </div>
      </div>

      {/* Top Header */}
      <div className="flex items-center justify-between">
        <Link href="/" className="inline-flex items-center gap-1 text-xs font-bold text-pran-teal">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
        <span className="demo-badge">PROTOTYPE</span>
      </div>

      {/* Doctor Profile Card */}
      <div className="pran-card p-5 border border-teal-100 bg-white">
        <div className="flex items-center gap-3.5">
          <div className="w-14 h-14 rounded-2xl bg-teal-100 border border-teal-300 flex items-center justify-center text-pran-dark font-black text-xl">
            👨‍⚕️
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-slate-900">Dr. V. Sharma</h2>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Available
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">MBBS, MD · Senior Family Physician</p>
            <p className="text-[11px] text-pran-teal font-semibold mt-0.5">Apollo / Max Partner Clinic Network</p>
          </div>
        </div>

        {/* Attached Report Pill */}
        {(scanId || refSource) && (
          <div className="mt-4 p-2.5 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-between text-xs text-pran-dark">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-pran-teal" />
              <span className="font-bold">
                {scanId ? `Safety Report #${scanId.substring(0, 10)} Attached` : 'SafeMix Analysis Attached'}
              </span>
            </div>
            <span className="text-[10px] bg-teal-200/70 font-bold px-2 py-0.5 rounded">
              Ready for Review
            </span>
          </div>
        )}

        {/* Video / Voice Call Actions */}
        <div className="grid grid-cols-2 gap-2 mt-4">
          <button
            onClick={handleStartCall}
            disabled={callState !== 'idle'}
            className="min-h-[50px] rounded-xl bg-pran-dark text-white font-bold text-xs flex items-center justify-center gap-2 hover:bg-pran-deep transition-all active:scale-95 disabled:opacity-80"
          >
            <PhoneCall className="w-4 h-4" />
            <span>
              {callState === 'idle'
                ? 'Voice Call'
                : callState === 'calling'
                ? 'Connecting...'
                : 'Connected (Demo)'}
            </span>
          </button>

          <button
            onClick={handleStartCall}
            disabled={callState !== 'idle'}
            className="min-h-[50px] rounded-xl bg-pran-turquoise text-pran-dark font-extrabold text-xs flex items-center justify-center gap-2 hover:bg-[#0ea5a0] transition-all active:scale-95 disabled:opacity-80"
          >
            <Video className="w-4 h-4" />
            <span>
              {callState === 'idle'
                ? 'Video Consult'
                : callState === 'calling'
                ? 'Connecting...'
                : 'Live Video (Demo)'}
            </span>
          </button>
        </div>
      </div>

      {/* Simulated Chat Interface */}
      <div className="pran-card p-4 border border-teal-100 bg-white space-y-3">
        <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
          <MessageSquare className="w-4 h-4 text-pran-teal" />
          Clinical Consultation Chat
        </h3>

        <div className="space-y-2.5 max-h-56 overflow-y-auto p-1 text-xs">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`p-3 rounded-2xl max-w-[85%] leading-relaxed ${
                  m.sender === 'user'
                    ? 'bg-pran-dark text-white rounded-tr-none'
                    : 'bg-teal-50 text-slate-800 border border-teal-200 rounded-tl-none'
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}
        </div>

        {/* Chat Input */}
        <div className="flex gap-2 pt-2 border-t border-slate-100">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Type your health or medicine question..."
            className="flex-1 min-h-[44px] px-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-pran-teal"
          />
          <button
            type="button"
            onClick={handleSendMessage}
            className="min-h-[44px] px-4 rounded-xl bg-pran-turquoise text-pran-dark font-extrabold text-xs flex items-center justify-center hover:bg-[#0ea5a0]"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DoctorConnectPage() {
  return (
    <Suspense fallback={
      <div className="pran-card p-6 text-center text-xs text-slate-500">
        Loading doctor consultation...
      </div>
    }>
      <DoctorConnectContent />
    </Suspense>
  );
}
