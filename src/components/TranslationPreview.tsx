import React, { useState, useMemo } from 'react';
import {
  Download,
  Copy,
  Check,
  Search,
  Replace,
  Printer,
  FileText,
  BookOpen,
  ArrowUpDown,
  ShieldCheck,
  Globe,
  Sliders,
  ExternalLink,
} from 'lucide-react';
import { DocumentChunk, TranslationValidationResult } from '../types';
import { downloadTxtFile, downloadHtmlBook, openPrintablePdfView } from '../utils/export';
import { SUPPORTED_LANGUAGES } from '../constants/languages';

interface TranslationPreviewProps {
  documentTitle: string;
  originalText: string;
  translatedText: string;
  chunks: DocumentChunk[];
  targetLangCode: string;
  onOpenQualityCheck?: () => void;
  validationResult?: TranslationValidationResult | null;
}

export function TranslationPreview({
  documentTitle,
  originalText,
  translatedText,
  chunks,
  targetLangCode,
  onOpenQualityCheck,
  validationResult,
}: TranslationPreviewProps) {
  const [activeMobileTab, setActiveMobileTab] = useState<'translation' | 'original'>('translation');
  const [searchQuery, setSearchQuery] = useState('');
  const [replaceQuery, setReplaceQuery] = useState('');
  const [showReplaceBar, setShowReplaceBar] = useState(false);
  const [copied, setCopied] = useState(false);
  const [editableTranslation, setEditableTranslation] = useState(translatedText);

  // Sync state if incoming text changes
  React.useEffect(() => {
    setEditableTranslation(translatedText);
  }, [translatedText]);

  const targetLang = SUPPORTED_LANGUAGES.find((l) => l.code === targetLangCode) || {
    name: 'Urdu',
    dir: 'rtl' as const,
  };
  const isRtl = targetLang.dir === 'rtl';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(editableTranslation);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Copy failed:', e);
    }
  };

  const handleDownloadTxt = () => {
    const name = `${documentTitle.replace(/\.[^/.]+$/, '')}_${targetLang.name}`;
    downloadTxtFile(name, editableTranslation);
  };

  const handleDownloadHtml = () => {
    const name = `${documentTitle.replace(/\.[^/.]+$/, '')}_${targetLang.name}`;
    downloadHtmlBook(name, documentTitle, editableTranslation, isRtl, targetLang.name);
  };

  const handlePrintPdf = () => {
    openPrintablePdfView(documentTitle, editableTranslation, isRtl, targetLang.name);
  };

  const handleSearchReplace = () => {
    if (!searchQuery) return;
    const regex = new RegExp(escapeRegExp(searchQuery), 'g');
    const updated = editableTranslation.replace(regex, replaceQuery);
    setEditableTranslation(updated);
  };

  function escapeRegExp(string: string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  return (
    <div
      id="translation-preview-card"
      className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-5 shadow-xs"
    >
      {/* Top Action Bar */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-slate-900 dark:text-white text-base font-display">
              Translation Studio & Output
            </h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 font-semibold flex items-center gap-1">
              <Globe className="w-3 h-3" />
              Target: {targetLang.name} {isRtl ? '(RTL Native)' : ''}
            </span>

            {/* Quality Control Button / Indicator */}
            {onOpenQualityCheck && (
              <button
                type="button"
                id="btn-quality-control"
                onClick={onOpenQualityCheck}
                className={`text-xs px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  validationResult?.isValid
                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200'
                    : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 hover:bg-amber-200'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>
                  {validationResult?.isValid ? '✓ QC Verified' : '! Review QC'}
                </span>
              </button>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Side-by-side comparison, fine-tuning search & replace, and high-fidelity novel exports.
          </p>
        </div>

        {/* Export & Utility Buttons */}
        <div className="flex items-center gap-2 flex-wrap w-full lg:w-auto justify-start lg:justify-end">
          <button
            type="button"
            id="btn-toggle-replace"
            onClick={() => setShowReplaceBar((v) => !v)}
            className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Replace className="w-3.5 h-3.5" />
            <span>Search & Replace</span>
          </button>

          <button
            type="button"
            id="btn-copy-translation"
            onClick={handleCopy}
            className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-emerald-600 dark:text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>

          <button
            type="button"
            id="btn-download-txt"
            onClick={handleDownloadTxt}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download .TXT</span>
          </button>

          <button
            type="button"
            id="btn-download-html"
            onClick={handleDownloadHtml}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Download offline-readable eBook format with embedded Nastaliq Urdu styling"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>HTML eBook</span>
          </button>

          <button
            type="button"
            id="btn-download-pdf"
            onClick={handlePrintPdf}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print / Save PDF</span>
          </button>
        </div>
      </div>

      {/* Search and Replace Tool Drawer */}
      {showReplaceBar && (
        <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              id="input-search-term"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Find text..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div className="relative flex-1 min-w-[180px]">
            <Replace className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              id="input-replace-term"
              value={replaceQuery}
              onChange={(e) => setReplaceQuery(e.target.value)}
              placeholder="Replace with..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <button
            type="button"
            id="btn-execute-replace"
            onClick={handleSearchReplace}
            className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold cursor-pointer"
          >
            Replace All
          </button>
        </div>
      )}

      {/* Mobile Tab Switcher */}
      <div className="flex md:hidden border-b border-slate-200 dark:border-slate-800 mb-2">
        <button
          onClick={() => setActiveMobileTab('translation')}
          className={`flex-1 py-2 text-xs font-semibold text-center border-b-2 ${
            activeMobileTab === 'translation'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500'
          }`}
        >
          Translated Document ({targetLang.name})
        </button>
        <button
          onClick={() => setActiveMobileTab('original')}
          className={`flex-1 py-2 text-xs font-semibold text-center border-b-2 ${
            activeMobileTab === 'original'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500'
          }`}
        >
          Original Source
        </button>
      </div>

      {/* Main Dual Editor Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[550px]">
        {/* Left: Original Text */}
        <div
          className={`flex flex-col rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 p-4 overflow-hidden ${
            activeMobileTab === 'original' ? 'block' : 'hidden md:flex'
          }`}
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800/80 mb-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              Original Source Text
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              {originalText.length.toLocaleString()} chars
            </span>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 space-y-4 font-novel text-sm leading-relaxed text-slate-700 dark:text-slate-300 select-text">
            {originalText.split('\n\n').map((para, i) => (
              <p key={i} className="whitespace-pre-wrap">
                {para}
              </p>
            ))}
          </div>
        </div>

        {/* Right: Translated Text (With native RTL / Urdu font shaping) */}
        <div
          className={`flex flex-col rounded-xl border border-indigo-200/80 dark:border-indigo-950 bg-white dark:bg-slate-900 p-4 overflow-hidden shadow-xs ${
            activeMobileTab === 'translation' ? 'block' : 'hidden md:flex'
          }`}
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-3">
            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" />
              {targetLang.name} Translation Output
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              {editableTranslation.length.toLocaleString()} chars
            </span>
          </div>

          <textarea
            id="textarea-translation-output"
            value={editableTranslation}
            onChange={(e) => setEditableTranslation(e.target.value)}
            dir={isRtl ? 'rtl' : 'ltr'}
            className={`flex-1 w-full p-2 rounded-lg bg-transparent border-none outline-none resize-none overflow-y-auto ${
              isRtl
                ? 'font-urdu text-lg text-slate-900 dark:text-slate-100 leading-[2.4] text-right'
                : 'font-novel text-sm text-slate-800 dark:text-slate-200 leading-relaxed'
            }`}
            placeholder="Translation will appear here..."
          />
        </div>
      </div>
    </div>
  );
}
