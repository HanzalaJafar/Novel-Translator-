import { HistoryRecord } from '../types';
import {
  History,
  FileText,
  Download,
  Printer,
  ExternalLink,
  Trash2,
  Calendar,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { downloadTxtFile, openPrintablePdfView } from '../utils/export';
import { SUPPORTED_LANGUAGES } from '../constants/languages';

interface HistoryViewProps {
  history: HistoryRecord[];
  onReopen: (record: HistoryRecord) => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
}

export function HistoryView({ history, onReopen, onDelete, onClearAll }: HistoryViewProps) {
  const getStatusBadge = (status: HistoryRecord['status']) => {
    switch (status) {
      case 'Completed':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      case 'In Progress':
        return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 animate-pulse';
      case 'Paused':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      case 'Failed':
        return 'bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300 border-rose-200 dark:border-rose-800';
      case 'Cancelled':
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  };

  const getLangName = (code: string) => {
    return SUPPORTED_LANGUAGES.find((l) => l.code === code)?.name || code.toUpperCase();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white font-display">
              Translation History
            </h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 font-semibold">
              {history.length} Records
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Review previous book and document translation sessions, reopen results, or export.
          </p>
        </div>

        {history.length > 0 && (
          <button
            type="button"
            onClick={onClearAll}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 transition-colors flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear History</span>
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 space-y-3">
          <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mx-auto">
            <History className="w-6 h-6" />
          </div>
          <h4 className="text-base font-semibold text-slate-700 dark:text-slate-300">
            No translation history yet
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Uploaded and translated books and documents will automatically be saved here for offline review and export.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {history.map((record) => {
            const isUrdu = record.targetLanguage === 'ur';

            return (
              <div
                key={record.id}
                className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <h4 className="font-semibold text-slate-900 dark:text-white text-sm truncate">
                      {record.fileName}
                    </h4>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getStatusBadge(
                        record.status
                      )}`}
                    >
                      {record.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                    <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                      {getLangName(record.sourceLanguage)}
                      <ArrowRight className="w-3 h-3 text-slate-400" />
                      {getLangName(record.targetLanguage)}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {record.date}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Layers className="w-3 h-3" />
                      {record.completedChunks}/{record.totalChunks} Chunks
                    </span>
                    {record.terminologyCount > 0 && (
                      <>
                        <span>•</span>
                        <span>{record.terminologyCount} Terminology entries</span>
                      </>
                    )}
                  </div>

                  {record.translatedTextPreview && (
                    <p
                      dir={isUrdu ? 'rtl' : 'ltr'}
                      className={`text-xs text-slate-600 dark:text-slate-400 line-clamp-1 italic pt-1 ${
                        isUrdu ? 'font-urdu text-sm' : 'font-novel'
                      }`}
                    >
                      "{record.translatedTextPreview}..."
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-wrap self-end md:self-auto flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => onReopen(record)}
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Reopen Session</span>
                  </button>

                  {record.fullTranslatedText && (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          downloadTxtFile(
                            `${record.fileName.replace(/\.[^/.]+$/, '')}_translated`,
                            record.fullTranslatedText!
                          )
                        }
                        className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition-colors"
                        title="Download TXT"
                      >
                        <Download className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          openPrintablePdfView(
                            record.fileName,
                            record.fullTranslatedText!,
                            isUrdu,
                            getLangName(record.targetLanguage)
                          )
                        }
                        className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition-colors"
                        title="Print / Save PDF"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                    </>
                  )}

                  <button
                    type="button"
                    onClick={() => onDelete(record.id)}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                    title="Delete Record"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
