import en from './locales/en.json';
import hi from './locales/hi.json';
import bn from './locales/bn.json';
import ta from './locales/ta.json';
import te from './locales/te.json';
import mr from './locales/mr.json';

export type SupportedLocale = 'en' | 'hi' | 'bn' | 'ta' | 'te' | 'mr';

export const SUPPORTED_LOCALES: { code: SupportedLocale; label: string; nativeName: string }[] = [
  { code: 'en', label: 'English', nativeName: 'English' },
  { code: 'hi', label: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'bn', label: 'Bengali', nativeName: 'বাংলা' },
  { code: 'ta', label: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'te', label: 'Telugu', nativeName: 'తెలుగు' },
  { code: 'mr', label: 'Marathi', nativeName: 'मराठी' },
];

export const VOICE_LOCALES: Record<SupportedLocale, string> = {
  en: 'en-IN',
  hi: 'hi-IN',
  bn: 'bn-IN',
  ta: 'ta-IN',
  te: 'te-IN',
  mr: 'mr-IN',
};

export const dictionaries: Record<SupportedLocale, Record<string, string>> = {
  en,
  hi,
  bn,
  ta,
  te,
  mr,
};

export function t(key: string, locale: string = 'en', fallback?: string): string {
  const loc = (locale in dictionaries ? locale : 'en') as SupportedLocale;
  const dict = dictionaries[loc];
  if (dict && dict[key]) {
    return dict[key];
  }
  // Fallback to English
  if (dictionaries.en && dictionaries.en[key]) {
    return dictionaries.en[key];
  }
  return fallback || key;
}
