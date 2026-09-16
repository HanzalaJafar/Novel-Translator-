import React, { useState } from 'react';
import {
  Sliders,
  Sparkles,
  Play,
  Shield,
  FileCheck,
  Brain,
  Layers,
  ArrowRight,
  Database,
  Loader2,
  ChevronDown,
} from 'lucide-react';
import { TranslationConfig, TranslationStyle, TerminologyItem } from '../types';
import { SOURCE_LANGUAGE_OPTIONS, SUPPORTED_LANGUAGES, TRANSLATION_STYLES } from '../constants/languages';
import { extractEntities } from '../services/api';

interface ConfigPanelProps {
  config: TranslationConfig;
  setConfig: React.Dispatch<React.SetStateAction<TranslationConfig>>;
  onStartTranslation: () => void;
  isTranslating: boolean;
  disabled?: boolean;
  extractedText?: string;
  terminology: TerminologyItem[];
  setTerminology: React.Dispatch<React.SetStateAction<TerminologyItem[]>>;
  chunkCount: number;
}

export function ConfigPanel({
  config,
  setConfig,
  onStartTranslation,
  isTranslating,
  disabled = false,
  extractedText = '',
  terminology,
  setTerminology,
  chunkCount,
}: ConfigPanelProps) {
  const [isScanningEntities, setIsScanningEntities] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);

  const handleToggle = (key: keyof TranslationConfig) => {
    setConfig((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleScanEntities = async () => {
    if (!extractedText || isScanningEntities) return;
    setIsScanningEntities(true);
    setScanMessage(null);
    try {
      const targetLangObj = SUPPORTED_LANGUAGES.find((l) => l.code === config.targetLanguage);
      const entities = await extractEntities(
        extractedText.slice(0, 4500),
        targetLangObj?.name || 'Urdu'
      );

      if (entities.length > 0) {
        // Merge with existing terminology without duplicate original
        setTerminology((prev) => {
          const existingOriginals = new Set(prev.map((p) => p.original.toLowerCase().trim()));
          const novelEntities = entities.filter(
            (e) => !existingOriginals.has(e.original.toLowerCase().trim())
          );
          return [...prev, ...novelEntities];
        });
        setScanMessage(`Discovered and added ${entities.length} characters & lore terms to dictionary.`);
      } else {
        setScanMessage('No novel character names or special lore terms were detected.');
      }
    } catch (err: any) {
      console.warn('Entity extraction warning:', err);
      setScanMessage('Scan complete. You can also add terms manually in the Terminology tab.');
    } finally {
      setIsScanningEntities(false);
    }
  };

  return (
    <div
      id="translation-config-card"
      className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-6 shadow-xs"
    >
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white text-base font-display">
              Translation Configuration
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Customize language pairing, literary voice, and entity protection
            </p>
          </div>
        </div>

        {/* Start Translation Button */}
        <button
          type="button"
          id="btn-start-translation-top"
          onClick={onStartTranslation}
          disabled={disabled || isTranslating || chunkCount === 0}
          className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all flex items-center gap-2 shadow-sm ${
            disabled || isTranslating || chunkCount === 0
              ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
              : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/25 active:scale-95 cursor-pointer'
          }`}
        >
          {isTranslating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Translating...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              <span>Start Translation ({chunkCount} {chunkCount === 1 ? 'Chunk' : 'Chunks'})</span>
            </>
          )}
        </button>
      </div>

      {/* Row 1: Languages & Style */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Source Language */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Source Language
          </label>
          <div className="relative">
            <select
              id="select-source-language"
              value={config.sourceLanguage}
              onChange={(e) => setConfig((p) => ({ ...p, sourceLanguage: e.target.value }))}
              disabled={isTranslating}
              className="w-full appearance-none px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 pr-8"
            >
              {SOURCE_LANGUAGE_OPTIONS.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.name} ({lang.nativeName})
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
          </div>
        </div>

        {/* Target Language (Default: Urdu) */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
            <span>Target Language</span>
            <span className="text-[11px] font-normal text-indigo-600 dark:text-indigo-400">
              Default: Urdu
            </span>
          </label>
          <div className="relative">
            <select
              id="select-target-language"
              value={config.targetLanguage}
              onChange={(e) => setConfig((p) => ({ ...p, targetLanguage: e.target.value }))}
              disabled={isTranslating}
              className="w-full appearance-none px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 pr-8 font-medium"
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.name} ({lang.nativeName})
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
          </div>
        </div>

        {/* Translation Style */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Translation Style
          </label>
          <div className="relative">
            <select
              id="select-translation-style"
              value={config.style}
              onChange={(e) =>
                setConfig((p) => ({ ...p, style: e.target.value as TranslationStyle }))
              }
              disabled={isTranslating}
              className="w-full appearance-none px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 pr-8"
            >
              {TRANSLATION_STYLES.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.label} — {st.desc}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Row 2: Precision Toggles (All ON by default as required) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
            Context & Terminology Preservation
          </span>
          {extractedText && (
            <button
              type="button"
              id="btn-scan-entities"
              onClick={handleScanEntities}
              disabled={isScanningEntities || isTranslating}
              className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isScanningEntities ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Database className="w-3.5 h-3.5" />
              )}
              <span>Auto-Detect Lore & Characters</span>
            </button>
          )}
        </div>

        {scanMessage && (
          <p className="text-xs text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 p-2 rounded-lg border border-indigo-200 dark:border-indigo-800">
            {scanMessage}
          </p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* Preserve Names */}
          <div
            onClick={() => !isTranslating && handleToggle('preserveNames')}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
              config.preserveNames
                ? 'border-indigo-200 dark:border-indigo-800 bg-indigo-50/40 dark:bg-indigo-950/20'
                : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 opacity-70'
            }`}
          >
            <input
              type="checkbox"
              id="toggle-preserve-names"
              checked={config.preserveNames}
              onChange={() => {}}
              className="mt-1 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
            <div className="space-y-0.5">
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                Preserve Names
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                Keep character and person names in their original Latin/English form.
              </p>
            </div>
          </div>

          {/* Preserve Special Terms */}
          <div
            onClick={() => !isTranslating && handleToggle('preserveSpecialTerms')}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
              config.preserveSpecialTerms
                ? 'border-indigo-200 dark:border-indigo-800 bg-indigo-50/40 dark:bg-indigo-950/20'
                : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 opacity-70'
            }`}
          >
            <input
              type="checkbox"
              id="toggle-preserve-special-terms"
              checked={config.preserveSpecialTerms}
              onChange={() => {}}
              className="mt-1 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
            <div className="space-y-0.5">
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                Preserve Special Terms
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                Keep fictional abilities, powers, locations, objects, and terminology intact.
              </p>
            </div>
          </div>

          {/* Preserve Formatting */}
          <div
            onClick={() => !isTranslating && handleToggle('preserveFormatting')}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
              config.preserveFormatting
                ? 'border-indigo-200 dark:border-indigo-800 bg-indigo-50/40 dark:bg-indigo-950/20'
                : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 opacity-70'
            }`}
          >
            <input
              type="checkbox"
              id="toggle-preserve-formatting"
              checked={config.preserveFormatting}
              onChange={() => {}}
              className="mt-1 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
            <div className="space-y-0.5">
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                Preserve Formatting
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                Preserve paragraphs, headings, dialogue markers, and line breaks.
              </p>
            </div>
          </div>

          {/* Context Memory */}
          <div
            onClick={() => !isTranslating && handleToggle('contextMemory')}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
              config.contextMemory
                ? 'border-indigo-200 dark:border-indigo-800 bg-indigo-50/40 dark:bg-indigo-950/20'
                : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 opacity-70'
            }`}
          >
            <input
              type="checkbox"
              id="toggle-context-memory"
              checked={config.contextMemory}
              onChange={() => {}}
              className="mt-1 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
            <div className="space-y-0.5">
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                Context Memory
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                Use previous translated context to improve continuity throughout the book.
              </p>
            </div>
          </div>

          {/* Translation Consistency */}
          <div
            onClick={() => !isTranslating && handleToggle('translationConsistency')}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 sm:col-span-2 lg:col-span-2 ${
              config.translationConsistency
                ? 'border-indigo-200 dark:border-indigo-800 bg-indigo-50/40 dark:bg-indigo-950/20'
                : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 opacity-70'
            }`}
          >
            <input
              type="checkbox"
              id="toggle-translation-consistency"
              checked={config.translationConsistency}
              onChange={() => {}}
              className="mt-1 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
            <div className="space-y-0.5">
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                Translation Consistency
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                Enforce the exact same translation for recurring names, phrases, and locked terminology dictionary entries.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Custom Translation Instructions */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
          <span>Additional Translation Instructions</span>
          <span className="text-[11px] text-slate-400">Optional custom prompts for Gemini</span>
        </label>
        <textarea
          id="textarea-custom-instructions"
          rows={2}
          value={config.customInstructions}
          onChange={(e) => setConfig((p) => ({ ...p, customInstructions: e.target.value }))}
          disabled={isTranslating}
          placeholder="Example: Keep all character names in English and translate dialogue naturally with conversational Urdu flair."
          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-800 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-400"
        />
      </div>

      {/* Active Terminology Count Pill */}
      {terminology.length > 0 && (
        <div className="flex items-center justify-between text-xs px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
            <Shield className="w-3.5 h-3.5 text-indigo-500" />
            <span>
              <strong>{terminology.length}</strong> terms locked in terminology dictionary (
              {terminology.filter((t) => t.locked).length} strictly enforced).
            </span>
          </div>
          <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">
            View in Terminology tab
          </span>
        </div>
      )}
    </div>
  );
}
