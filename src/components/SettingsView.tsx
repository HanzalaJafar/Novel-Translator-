import React, { useState } from 'react';
import {
  Settings,
  Sparkles,
  Sliders,
  Cpu,
  Palette,
  CheckCircle2,
  RefreshCw,
  Sun,
  Moon,
  Laptop,
} from 'lucide-react';
import { AppSettings, TranslationConfig } from '../types';
import { SOURCE_LANGUAGE_OPTIONS, SUPPORTED_LANGUAGES, TRANSLATION_STYLES } from '../constants/languages';

interface SettingsViewProps {
  settings: AppSettings;
  setSettings: (settings: AppSettings) => void;
  config: TranslationConfig;
  setConfig: React.Dispatch<React.SetStateAction<TranslationConfig>>;
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
}

export function SettingsView({
  settings,
  setSettings,
  config,
  setConfig,
  theme,
  setTheme,
}: SettingsViewProps) {
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleUpdateSetting = <K extends keyof AppSettings>(field: K, value: AppSettings[K]) => {
    const updated: AppSettings = {
      ...settings,
      [field]: value,
    };
    setSettings(updated);

    // If config related, update active config as well
    if (field === 'defaultSourceLanguage') setConfig((c) => ({ ...c, sourceLanguage: value as string }));
    if (field === 'defaultTargetLanguage') setConfig((c) => ({ ...c, targetLanguage: value as string }));
    if (field === 'defaultStyle') setConfig((c) => ({ ...c, style: value as any }));
    if (field === 'preserveNames') setConfig((c) => ({ ...c, preserveNames: value as boolean }));
    if (field === 'preserveSpecialTerms') setConfig((c) => ({ ...c, preserveSpecialTerms: value as boolean }));
    if (field === 'preserveFormatting') setConfig((c) => ({ ...c, preserveFormatting: value as boolean }));
    if (field === 'contextMemory') setConfig((c) => ({ ...c, contextMemory: value as boolean }));
    if (field === 'translationConsistency') setConfig((c) => ({ ...c, translationConsistency: value as boolean }));

    showToast();
  };

  const showToast = () => {
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white font-display">
            Preferences & Configuration
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Configure default translation behavior, Gemini AI parameters, and interface appearance.
          </p>
        </div>

        {saveSuccess && (
          <div className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 animate-fade-in">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Settings Saved</span>
          </div>
        )}
      </div>

      {/* Section 1: AI Model & Inference Settings */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-5 shadow-xs">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
              Gemini AI Engine Parameters
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Control the model architecture, temperature, and chunk batching
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Model Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Gemini Model
            </label>
            <select
              value={settings.modelName}
              onChange={(e) => handleUpdateSetting('modelName', e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 text-xs font-medium text-slate-800 dark:text-slate-200"
            >
              <option value="gemini-3.8-flash">Gemini 3.8 Flash (Recommended — Fast & Literary)</option>
              <option value="gemini-3.6-flash">Gemini 3.6 Flash (High Performance)</option>
            </select>
          </div>

          {/* Target Words Per Chunk */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex justify-between">
              <span>Target Words per Intelligent Chunk</span>
              <span className="font-mono text-indigo-600">{settings.chunkSizeWords} words</span>
            </label>
            <input
              type="range"
              min="200"
              max="1000"
              step="50"
              value={settings.chunkSizeWords}
              onChange={(e) => handleUpdateSetting('chunkSizeWords', Number(e.target.value))}
              className="w-full accent-indigo-600 cursor-pointer"
            />
            <p className="text-[11px] text-slate-400">
              Smaller chunks preserve fine-grained nuances; larger chunks preserve wider paragraph flow.
            </p>
          </div>

          {/* Temperature Slider */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex justify-between">
              <span>Creativity / Temperature</span>
              <span className="font-mono text-indigo-600">{settings.temperature}</span>
            </label>
            <input
              type="range"
              min="0.0"
              max="1.0"
              step="0.05"
              value={settings.temperature}
              onChange={(e) => handleUpdateSetting('temperature', Number(e.target.value))}
              className="w-full accent-indigo-600 cursor-pointer"
            />
            <p className="text-[11px] text-slate-400">
              Lower (0.2–0.3) is more disciplined and consistent. Higher (0.6+) allows more lyrical phrasing.
            </p>
          </div>

          {/* Max Retries */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Max Automatic Retries on Failure
            </label>
            <select
              value={settings.retryLimit}
              onChange={(e) => handleUpdateSetting('retryLimit', Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 text-xs font-medium text-slate-800 dark:text-slate-200"
            >
              <option value="1">1 Retry</option>
              <option value="2">2 Retries</option>
              <option value="3">3 Retries (Default)</option>
              <option value="5">5 Retries</option>
            </select>
          </div>
        </div>
      </div>

      {/* Section 2: Default Translation Preferences */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-5 shadow-xs">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
              Default Translation Rules
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Pre-selected settings for every new document upload
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Default Source
            </label>
            <select
              value={settings.defaultSourceLanguage}
              onChange={(e) => handleUpdateSetting('defaultSourceLanguage', e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 text-xs font-medium text-slate-800 dark:text-slate-200"
            >
              {SOURCE_LANGUAGE_OPTIONS.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Default Target
            </label>
            <select
              value={settings.defaultTargetLanguage}
              onChange={(e) => handleUpdateSetting('defaultTargetLanguage', e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 text-xs font-medium text-slate-800 dark:text-slate-200"
            >
              {SUPPORTED_LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Default Style
            </label>
            <select
              value={settings.defaultStyle}
              onChange={(e) => handleUpdateSetting('defaultStyle', e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 text-xs font-medium text-slate-800 dark:text-slate-200"
            >
              {TRANSLATION_STYLES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Section 3: Appearance & Theme */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-5 shadow-xs">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Palette className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
              Appearance & Theme
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Choose your reading comfort preference
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => {
              setTheme('light');
              handleUpdateSetting('theme', 'light');
            }}
            className={`p-4 rounded-xl border text-center transition-all flex flex-col items-center gap-2 cursor-pointer ${
              theme === 'light'
                ? 'border-indigo-600 bg-indigo-50/40 text-indigo-900 dark:bg-indigo-950/20'
                : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <Sun className="w-5 h-5 text-amber-500" />
            <span className="text-xs font-semibold">Light Mode</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setTheme('dark');
              handleUpdateSetting('theme', 'dark');
            }}
            className={`p-4 rounded-xl border text-center transition-all flex flex-col items-center gap-2 cursor-pointer ${
              theme === 'dark'
                ? 'border-indigo-600 bg-indigo-50/40 text-indigo-900 dark:text-indigo-300 dark:bg-indigo-950/40'
                : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <Moon className="w-5 h-5 text-indigo-400" />
            <span className="text-xs font-semibold">Dark Mode</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setTheme('system');
              handleUpdateSetting('theme', 'system');
            }}
            className={`p-4 rounded-xl border text-center transition-all flex flex-col items-center gap-2 cursor-pointer ${
              theme === 'system'
                ? 'border-indigo-600 bg-indigo-50/40 text-indigo-900 dark:text-indigo-300 dark:bg-indigo-950/40'
                : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <Laptop className="w-5 h-5 text-slate-500" />
            <span className="text-xs font-semibold">System Default</span>
          </button>
        </div>
      </div>
    </div>
  );
}
