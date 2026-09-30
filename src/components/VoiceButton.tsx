'use client';

import React from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { useApp } from './AppContext';

interface VoiceButtonProps {
  textToRead: string;
  label?: string;
  className?: string;
}

export default function VoiceButton({ textToRead, label, className = '' }: VoiceButtonProps) {
  const { speak, stopSpeaking, isSpeaking, t } = useApp();

  const handleToggle = () => {
    if (isSpeaking) {
      stopSpeaking();
    } else {
      speak(textToRead);
    }
  };

  return (
    <button
      onClick={handleToggle}
      className={`min-h-[48px] px-4 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 border transition-all ${
        isSpeaking
          ? 'bg-amber-100 text-amber-900 border-amber-300 animate-pulse'
          : 'bg-teal-50 text-pran-dark border-teal-200 hover:bg-teal-100'
      } ${className}`}
      aria-label={isSpeaking ? 'Stop reading' : 'Read aloud'}
    >
      {isSpeaking ? (
        <>
          <VolumeX className="w-5 h-5 text-amber-700 stroke-[2.5]" />
          <span>Stop Audio</span>
        </>
      ) : (
        <>
          <Volume2 className="w-5 h-5 text-pran-teal stroke-[2.5]" />
          <span>{label || t('btn_read_aloud', 'Read Aloud')}</span>
        </>
      )}
    </button>
  );
}
