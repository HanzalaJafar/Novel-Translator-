import { AppSettings, HistoryRecord, TerminologyItem, TranslationSession } from '../types';

const STORAGE_KEYS = {
  SETTINGS: 'lingonovel_settings',
  HISTORY: 'lingonovel_history',
  TERMINOLOGY: 'lingonovel_terminology',
  ACTIVE_SESSION: 'lingonovel_active_session',
};

export const DEFAULT_SETTINGS: AppSettings = {
  defaultSourceLanguage: 'auto',
  defaultTargetLanguage: 'ur',
  defaultStyle: 'natural',
  preserveNames: true,
  preserveSpecialTerms: true,
  preserveFormatting: true,
  contextMemory: true,
  translationConsistency: true,
  modelName: 'gemini-3.8-flash',
  temperature: 0.3,
  chunkSizeWords: 400,
  retryLimit: 3,
  theme: 'dark',
};

export const DEFAULT_TERMINOLOGY: TerminologyItem[] = [
  { id: 'term-1', original: 'Kael', preferredTranslation: 'Kael', type: 'character', locked: true },
  { id: 'term-2', original: 'Alex', preferredTranslation: 'Alex', type: 'character', locked: true },
  { id: 'term-3', original: 'Eldoria', preferredTranslation: 'Eldoria', type: 'place', locked: true },
  { id: 'term-4', original: 'Shadow Burst', preferredTranslation: 'Shadow Burst', type: 'ability', locked: true },
  { id: 'term-5', original: 'Nightfang', preferredTranslation: 'Nightfang', type: 'object', locked: true },
];

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.warn('Failed to save settings to localStorage:', e);
  }
}

export const getAppSettings = loadSettings;
export const saveAppSettings = saveSettings;

export function saveHistory(records: HistoryRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(records));
  } catch (e) {
    console.warn('Failed to save history to localStorage:', e);
  }
}

export function loadHistory(): HistoryRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.HISTORY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveHistoryRecord(record: HistoryRecord): void {
  try {
    const history = loadHistory();
    // Prepend new record or update existing
    const existingIndex = history.findIndex((h) => h.id === record.id);
    let updated: HistoryRecord[];
    if (existingIndex >= 0) {
      updated = [...history];
      updated[existingIndex] = record;
    } else {
      updated = [record, ...history].slice(0, 40); // keep up to 40 records
    }
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Failed to save history record:', e);
  }
}

export function deleteHistoryRecord(id: string): HistoryRecord[] {
  try {
    const history = loadHistory().filter((h) => h.id !== id);
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
    return history;
  } catch {
    return [];
  }
}

export function clearAllHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.HISTORY);
  } catch (e) {
    console.warn('Failed to clear history:', e);
  }
}

export function loadTerminology(): TerminologyItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TERMINOLOGY);
    if (!raw) return DEFAULT_TERMINOLOGY;
    return JSON.parse(raw);
  } catch {
    return DEFAULT_TERMINOLOGY;
  }
}

export function saveTerminology(items: TerminologyItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.TERMINOLOGY, JSON.stringify(items));
  } catch (e) {
    console.warn('Failed to save terminology:', e);
  }
}

export function loadActiveSession(): TranslationSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ACTIVE_SESSION);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveActiveSession(session: TranslationSession | null): void {
  try {
    if (!session) {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_SESSION);
    } else {
      // Store session safely without blowing up storage
      localStorage.setItem(STORAGE_KEYS.ACTIVE_SESSION, JSON.stringify(session));
    }
  } catch (e) {
    console.warn('Session save warning:', e);
  }
}

export function clearActiveSession(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_SESSION);
  } catch (e) {
    console.warn('Failed to clear active session:', e);
  }
}
