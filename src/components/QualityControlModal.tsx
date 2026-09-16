import { ShieldCheck, AlertTriangle, CheckCircle2, XCircle, X } from 'lucide-react';
import { TranslationValidationResult } from '../types';

interface QualityControlModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: TranslationValidationResult | null;
  onRetryFailed?: () => void;
}

export function QualityControlModal({
  isOpen,
  onClose,
  result,
  onRetryFailed,
}: QualityControlModalProps) {
  if (!isOpen || !result) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div
        id="modal-quality-control"
        className="relative w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-5"
      >
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                result.isValid
                  ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400'
                  : 'bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400'
              }`}
            >
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Quality Control Validation
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Automated document integrity and fidelity audit
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Audit Status Banner */}
        <div
          className={`p-4 rounded-xl border flex items-start gap-3 ${
            result.isValid
              ? 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-100'
              : 'border-amber-200 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-100'
          }`}
        >
          {result.isValid ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          )}
          <div className="text-xs space-y-1">
            <p className="font-bold text-sm">
              {result.isValid ? 'Document Passed Integrity Checks' : 'Attention Recommended'}
            </p>
            <p className="opacity-90">
              {result.isValid
                ? `All ${result.totalChunks} chunks accounted for, sequence verified, and no error strings detected.`
                : `We detected ${result.warnings.length} items to review before final publishing.`}
            </p>
          </div>
        </div>

        {/* Checklist */}
        <div className="space-y-2.5 text-xs">
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50">
            <span className="text-slate-700 dark:text-slate-300">
              Chunk Completeness ({result.completedChunks}/{result.totalChunks})
            </span>
            {result.missingChunks.length === 0 ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> 100% Complete
              </span>
            ) : (
              <span className="text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1">
                <XCircle className="w-3.5 h-3.5" /> {result.missingChunks.length} Missing
              </span>
            )}
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50">
            <span className="text-slate-700 dark:text-slate-300">Accidental Summary Detection</span>
            {!result.hasAccidentalSummary ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> None (Full prose preserved)
              </span>
            ) : (
              <span className="text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> Summary marker found
              </span>
            )}
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50">
            <span className="text-slate-700 dark:text-slate-300">API Error String Scrubbing</span>
            {!result.hasApiErrors ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Clean text output
              </span>
            ) : (
              <span className="text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1">
                <XCircle className="w-3.5 h-3.5" /> Error text detected
              </span>
            )}
          </div>
        </div>

        {/* Warnings list if any */}
        {result.warnings.length > 0 && (
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Specific Warnings:
            </span>
            <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-400 max-h-32 overflow-y-auto">
              {result.warnings.map((w, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="text-amber-500 mt-0.5">•</span>
                  <span>{w}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          {result.failedChunks.length > 0 && onRetryFailed && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onRetryFailed();
              }}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              Retry Failed Chunks
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
