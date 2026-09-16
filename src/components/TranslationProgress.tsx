import { useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Square,
  AlertCircle,
  CheckCircle2,
  Clock,
  Layers,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
} from 'lucide-react';
import { DocumentChunk, TranslationSession } from '../types';

interface TranslationProgressProps {
  session: TranslationSession;
  chunks: DocumentChunk[];
  onPause: () => void;
  onResume: () => void;
  onCancel: () => void;
  onRetryFailed: () => void;
  onViewPreview: () => void;
}

export function TranslationProgress({
  session,
  chunks,
  onPause,
  onResume,
  onCancel,
  onRetryFailed,
  onViewPreview,
}: TranslationProgressProps) {
  const [showConfirmCancel, setShowConfirmCancel] = useState(false);
  const [showChunkList, setShowChunkList] = useState(false);

  const completedCount = chunks.filter((c) => c.status === 'completed').length;
  const failedCount = chunks.filter((c) => c.status === 'failed').length;
  const totalCount = chunks.length;
  const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Estimate remaining time (assuming ~2.5s per chunk on average)
  const remainingChunks = totalCount - completedCount;
  const estimatedSeconds = remainingChunks * 2.5;
  const formatEstimatedTime = (sec: number) => {
    if (sec <= 0) return 'Complete';
    if (sec < 60) return `~${Math.ceil(sec)}s remaining`;
    const min = Math.floor(sec / 60);
    const s = Math.ceil(sec % 60);
    return `~${min}m ${s}s remaining`;
  };

  return (
    <div
      id="translation-progress-card"
      className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-6 shadow-xs"
    >
      {/* Top Status & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                session.status === 'translating'
                  ? 'bg-emerald-500 animate-pulse'
                  : session.status === 'paused'
                  ? 'bg-amber-500'
                  : session.status === 'completed'
                  ? 'bg-indigo-500'
                  : 'bg-rose-500'
              }`}
            />
            <h3 className="font-semibold text-slate-900 dark:text-white text-base font-display">
              {session.status === 'translating'
                ? 'Translating Document...'
                : session.status === 'paused'
                ? 'Translation Paused'
                : session.status === 'completed'
                ? 'Translation Finished'
                : 'Translation Interrupted'}
            </h3>
            <span className="text-xs px-2 py-0.5 rounded font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {percentage}%
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
            {session.liveStatusMessage || `Chunk ${completedCount + 1} of ${totalCount}`}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {session.status === 'translating' && (
            <button
              type="button"
              id="btn-pause-translation"
              onClick={onPause}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40 border border-amber-200 dark:border-amber-800/80 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Pause className="w-3.5 h-3.5" />
              <span>Pause</span>
            </button>
          )}

          {session.status === 'paused' && (
            <button
              type="button"
              id="btn-resume-translation"
              onClick={onResume}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Resume</span>
            </button>
          )}

          {failedCount > 0 && session.status !== 'translating' && (
            <button
              type="button"
              id="btn-retry-failed-chunks"
              onClick={onRetryFailed}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 border border-indigo-200 dark:border-indigo-800/80 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retry {failedCount} Failed</span>
            </button>
          )}

          {session.status === 'completed' && (
            <button
              type="button"
              id="btn-view-preview-completed"
              onClick={onViewPreview}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>View & Export Result</span>
            </button>
          )}

          {session.status !== 'completed' && (
            <button
              type="button"
              id="btn-cancel-translation"
              onClick={() => setShowConfirmCancel(true)}
              className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Square className="w-3.5 h-3.5" />
              <span>Cancel</span>
            </button>
          )}
        </div>
      </div>

      {/* Cancel Confirmation Dialog */}
      {showConfirmCancel && (
        <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 space-y-3">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-600 mt-0.5" />
            <div>
              <h5 className="text-xs font-bold text-rose-800 dark:text-rose-200">
                Cancel Translation Session?
              </h5>
              <p className="text-xs text-rose-700 dark:text-rose-300">
                Are you sure? You will preserve already completed chunks in your History, but new chunk processing will halt.
              </p>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowConfirmCancel(false)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
            >
              Keep Translating
            </button>
            <button
              type="button"
              id="btn-confirm-cancel"
              onClick={() => {
                setShowConfirmCancel(false);
                onCancel();
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white"
            >
              Confirm Cancel
            </button>
          </div>
        </div>
      )}

      {/* Visual Progress Bar */}
      <div className="space-y-2">
        <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-200/60 dark:border-slate-700/60">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              session.status === 'failed'
                ? 'bg-rose-500'
                : 'bg-gradient-to-r from-indigo-500 via-blue-500 to-emerald-400'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span className="font-mono">
            {completedCount} of {totalCount} chunks processed
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {session.status === 'completed'
              ? 'All chunks finished'
              : formatEstimatedTime(estimatedSeconds)}
          </span>
        </div>
      </div>

      {/* Failed Chunk Warning */}
      {failedCount > 0 && (
        <div className="rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-950/40 p-3.5 flex items-center justify-between text-xs text-amber-800 dark:text-amber-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>
              {failedCount} {failedCount === 1 ? 'chunk' : 'chunks'} encountered transient API delays. You can retry them without losing completed work.
            </span>
          </div>
          <button
            type="button"
            onClick={onRetryFailed}
            className="font-semibold underline text-amber-900 dark:text-amber-100 ml-3"
          >
            Retry Now
          </button>
        </div>
      )}

      {/* Expandable Chunk Inspection */}
      <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4">
        <button
          type="button"
          onClick={() => setShowChunkList((v) => !v)}
          className="w-full flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5" />
            <span>Chunk Details & Pipeline Stream ({chunks.length} chunks)</span>
          </span>
          {showChunkList ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showChunkList && (
          <div className="mt-3 max-h-60 overflow-y-auto space-y-2 pr-1">
            {chunks.map((chunk) => (
              <div
                key={chunk.id}
                className={`p-2.5 rounded-xl border text-xs flex items-center justify-between gap-3 ${
                  chunk.status === 'completed'
                    ? 'border-emerald-200 dark:border-emerald-950 bg-emerald-50/30 dark:bg-emerald-950/10'
                    : chunk.status === 'translating'
                    ? 'border-indigo-300 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/30 animate-pulse'
                    : chunk.status === 'failed'
                    ? 'border-rose-200 dark:border-rose-950 bg-rose-50/50 dark:bg-rose-950/20'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/40'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      chunk.status === 'completed'
                        ? 'bg-emerald-500'
                        : chunk.status === 'translating'
                        ? 'bg-indigo-500'
                        : chunk.status === 'failed'
                        ? 'bg-rose-500'
                        : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                  />
                  <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                    Chunk #{chunk.sequence}
                  </span>
                  {chunk.chapterTitle && (
                    <span className="truncate text-slate-500 dark:text-slate-400 font-medium">
                      ({chunk.chapterTitle})
                    </span>
                  )}
                  <span className="text-[11px] text-slate-400">
                    • {chunk.wordCount} words
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-medium capitalize ${
                      chunk.status === 'completed'
                        ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                        : chunk.status === 'translating'
                        ? 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300'
                        : chunk.status === 'failed'
                        ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                    }`}
                  >
                    {chunk.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
