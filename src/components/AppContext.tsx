'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { SupportedLocale, VOICE_LOCALES, t as translateFn, SUPPORTED_LOCALES } from '@/lib/i18n';

export type TextSize = 'normal' | 'large' | 'extralarge';

interface AppContextType {
  locale: SupportedLocale;
  setLocale: (locale: SupportedLocale) => void;
  textSize: TextSize;
  setTextSize: (size: TextSize) => void;
  t: (key: string, fallback?: string) => string;
  speak: (text: string) => void;
  stopSpeaking: () => void;
  isSpeaking: boolean;
  supportedLocales: typeof SUPPORTED_LOCALES;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<SupportedLocale>('en');
  const [textSize, setTextSizeState] = useState<TextSize>('normal');
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    // Load persisted settings
    const savedLocale = localStorage.getItem('prancare_locale') as SupportedLocale;
    if (savedLocale && ['en', 'hi', 'bn', 'ta', 'te', 'mr'].includes(savedLocale)) {
      setLocaleState(savedLocale);
    }
    const savedSize = localStorage.getItem('prancare_text_size') as TextSize;
    if (savedSize && ['normal', 'large', 'extralarge'].includes(savedSize)) {
      setTextSizeState(savedSize);
      document.body.className = `text-size-${savedSize}`;
    }
  }, []);

  const setLocale = (newLocale: SupportedLocale) => {
    setLocaleState(newLocale);
    localStorage.setItem('prancare_locale', newLocale);
  };

  const setTextSize = (newSize: TextSize) => {
    setTextSizeState(newSize);
    localStorage.setItem('prancare_text_size', newSize);
    document.body.className = `text-size-${newSize}`;
  };

  const t = (key: string, fallback?: string) => {
    return translateFn(key, locale, fallback);
  };

  const stopSpeaking = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const speak = (text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported in this browser.');
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const targetVoiceLang = VOICE_LOCALES[locale] || 'en-IN';
    utterance.lang = targetVoiceLang;

    // Try to find matching voice
    const voices = window.speechSynthesis.getVoices();
    const matchedVoice = voices.find(v => v.lang === targetVoiceLang || v.lang.startsWith(locale));
    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }

    utterance.rate = 0.9; // Slightly slower for elderly comprehension
    utterance.pitch = 1.0;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  return (
    <AppContext.Provider
      value={{
        locale,
        setLocale,
        textSize,
        setTextSize,
        t,
        speak,
        stopSpeaking,
        isSpeaking,
        supportedLocales: SUPPORTED_LOCALES,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
