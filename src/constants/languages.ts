import { Language } from '../types';

export const SUPPORTED_LANGUAGES: Language[] = [
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', dir: 'rtl' },
  { code: 'en', name: 'English', nativeName: 'English', dir: 'ltr' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', dir: 'rtl' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', dir: 'ltr' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', dir: 'ltr' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', dir: 'ltr' },
  { code: 'fr', name: 'French', nativeName: 'Français', dir: 'ltr' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', dir: 'ltr' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', dir: 'ltr' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', dir: 'ltr' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', dir: 'ltr' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', dir: 'ltr' },
  { code: 'zh', name: 'Chinese (Simplified)', nativeName: '简体中文', dir: 'ltr' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', dir: 'ltr' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', dir: 'ltr' },
  { code: 'fa', name: 'Persian (Farsi)', nativeName: 'فارسی', dir: 'rtl' },
  { code: 'ps', name: 'Pashto', nativeName: 'پښتو', dir: 'rtl' },
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', dir: 'ltr' },
];

export const SOURCE_LANGUAGE_OPTIONS = [
  { code: 'auto', name: 'Auto Detect', nativeName: 'Automatic Detection', dir: 'ltr' as const },
  ...SUPPORTED_LANGUAGES,
];

export const TRANSLATION_STYLES = [
  { id: 'natural', label: 'Natural', desc: 'Fluent, idiomatic expression preserving tone and native flow' },
  { id: 'literary', label: 'Literary', desc: 'Poetic, evocative phrasing tailored for fiction and novels' },
  { id: 'formal', label: 'Formal', desc: 'Polite, respectful and dignified phrasing' },
  { id: 'professional', label: 'Professional', desc: 'Clear, crisp and precise for articles and technical docs' },
  { id: 'casual', label: 'Casual', desc: 'Conversational, modern spoken tone for dialogue' },
  { id: 'literal', label: 'Literal', desc: 'Close grammatical translation adhering strictly to original syntax' },
];
