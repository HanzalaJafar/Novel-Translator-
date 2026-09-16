import React, { useState, useEffect, useRef } from 'react';
import {
  DocumentData,
  TranslationConfig,
  TranslationSession,
  TerminologyItem,
  HistoryRecord,
  AppSettings,
  TranslationValidationResult,
  DocumentChunk,
} from './types';
import {
  loadTerminology,
  saveTerminology,
  loadHistory,
  saveHistory,
  getAppSettings,
  saveAppSettings,
  loadActiveSession,
  saveActiveSession,
  clearActiveSession,
} from './services/storage';
import { translateChunk, extractEntities } from './services/api';
import { Header } from './components/Header';
import { UploadArea } from './components/UploadArea';
import { ConfigPanel } from './components/ConfigPanel';
import { TerminologyManager } from './components/TerminologyManager';
import { TranslationProgress } from './components/TranslationProgress';
import { TranslationPreview } from './components/TranslationPreview';
import { HistoryView } from './components/HistoryView';
import { SettingsView } from './components/SettingsView';
import { QualityControlModal } from './components/QualityControlModal';
import { runQualityControlCheck } from './utils/qualityControl';
import { SUPPORTED_LANGUAGES } from './constants/languages';

export default function App() {
  // Navigation & Settings
  const [activeTab, setActiveTab] = useState<'dashboard' | 'terminology' | 'history' | 'settings'>('dashboard');
  const [settings, setSettingsState] = useState<AppSettings>(getAppSettings);
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(() => {
    try {
      const stored = localStorage.getItem('lingonovel_theme');
      if (stored === 'light' || stored === 'dark' || stored === 'system') return stored;
    } catch {}
    return settings.theme || 'dark';
  });

  // Application Data States
  const [document, setDocument] = useState<DocumentData | null>(null);
  const [config, setConfig] = useState<TranslationConfig>(() => ({
    sourceLanguage: settings.defaultSourceLanguage,
    targetLanguage: settings.defaultTargetLanguage,
    style: settings.defaultStyle,
    preserveNames: settings.preserveNames,
    preserveSpecialTerms: settings.preserveSpecialTerms,
    preserveFormatting: settings.preserveFormatting,
    contextMemory: settings.contextMemory,
    translationConsistency: settings.translationConsistency,
    customInstructions: '',
  }));

  const [terminology, setTerminology] = useState<TerminologyItem[]>(loadTerminology);
  const [session, setSession] = useState<TranslationSession | null>(loadActiveSession);
  const [history, setHistory] = useState<HistoryRecord[]>(loadHistory);

  // Translation Runtime Control
  const [isTranslating, setIsTranslating] = useState(false);
  const pauseRequestedRef = useRef(false);
  const cancelRequestedRef = useRef(false);

  // Quality Control Modal
  const [validationResult, setValidationResult] = useState<TranslationValidationResult | null>(null);
  const [isQcModalOpen, setIsQcModalOpen] = useState(false);
  const [isScanningActiveDoc, setIsScanningActiveDoc] = useState(false);

  // Theme synchronization with html and body elements
  useEffect(() => {
    const root = window.document.documentElement;
    const body = window.document.body;

    const applyDark = (isDark: boolean) => {
      if (isDark) {
        root.classList.add('dark');
        body.classList.add('dark');
        root.style.colorScheme = 'dark';
      } else {
        root.classList.remove('dark');
        body.classList.remove('dark');
        root.style.colorScheme = 'light';
      }
    };

    if (theme === 'dark') {
      applyDark(true);
    } else if (theme === 'light') {
      applyDark(false);
    } else {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      applyDark(mediaQuery.matches);
      const listener = (e: MediaQueryListEvent) => applyDark(e.matches);
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, [theme]);

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    try {
      localStorage.setItem('lingonovel_theme', newTheme);
    } catch {}
    handleUpdateSettings({ ...settings, theme: newTheme });
  };

  // Persist Terminology
  useEffect(() => {
    saveTerminology(terminology);
  }, [terminology]);

  // Persist History
  useEffect(() => {
    saveHistory(history);
  }, [history]);

  // Update App Settings
  const handleUpdateSettings = (newSettings: AppSettings) => {
    setSettingsState(newSettings);
    saveAppSettings(newSettings);
  };

  // Restore session if exists
  useEffect(() => {
    if (session && !document) {
      setDocument(session.document);
      setConfig(session.config);
    }
  }, []);

  // Compute aggregated translation text from current chunks
  const currentAggregatedTranslation = (
    session?.document.chunks || document?.chunks || []
  )
    .filter((c) => c.translatedText)
    .map((c) => c.translatedText)
    .join('\n\n');

  // Trigger auto entity scanning from document
  const handleAutoScanTerminology = async () => {
    if (!document?.extractedText || isScanningActiveDoc) return;
    setIsScanningActiveDoc(true);
    try {
      const targetLangName =
        SUPPORTED_LANGUAGES.find((l) => l.code === config.targetLanguage)?.name || 'Urdu';
      const detected = await extractEntities(
        document.extractedText.slice(0, 4500),
        targetLangName
      );
      if (detected.length > 0) {
        setTerminology((prev) => {
          const existing = new Set(prev.map((p) => p.original.toLowerCase().trim()));
          const fresh = detected.filter(
            (d) => !existing.has(d.original.toLowerCase().trim())
          );
          return [...prev, ...fresh];
        });
      }
    } catch (e) {
      console.warn('Scan entities error:', e);
    } finally {
      setIsScanningActiveDoc(false);
    }
  };

  // Start Translation Workflow
  const handleStartTranslation = async () => {
    if (!document || document.chunks.length === 0 || isTranslating) return;

    pauseRequestedRef.current = false;
    cancelRequestedRef.current = false;

    const totalChunks = document.chunks.length;
    const initialChunks: DocumentChunk[] = document.chunks.map((c, idx) => ({
      ...c,
      status: c.status === 'completed' ? 'completed' : 'pending',
      sequence: idx + 1,
      error: undefined,
    }));

    const workingDoc: DocumentData = {
      ...document,
      chunks: initialChunks,
    };

    const newSession: TranslationSession = {
      id: session?.id || `sess-${Date.now()}`,
      document: workingDoc,
      config,
      terminology,
      status: 'translating',
      currentChunkIndex: 0,
      completedChunksCount: initialChunks.filter((c) => c.status === 'completed').length,
      totalChunksCount: totalChunks,
      startTime: Date.now(),
      liveStatusMessage: 'Initializing literary translation engine...',
    };

    setSession(newSession);
    saveActiveSession(newSession);
    setIsTranslating(true);

    await executeTranslationPipeline(newSession, initialChunks);
  };

  // Pipeline Execution Loop
  const executeTranslationPipeline = async (
    currentSession: TranslationSession,
    workingChunks: DocumentChunk[]
  ) => {
    let rollingContext = '';
    const maxRetries = settings.retryLimit || 3;

    // Find the last completed chunk to seed rolling context
    for (let i = workingChunks.length - 1; i >= 0; i--) {
      if (workingChunks[i].status === 'completed' && workingChunks[i].translatedText) {
        rollingContext = workingChunks[i].translatedText!.slice(-400);
        break;
      }
    }

    for (let i = 0; i < workingChunks.length; i++) {
      // Check for pause
      if (pauseRequestedRef.current) {
        const pausedSession: TranslationSession = {
          ...currentSession,
          status: 'paused',
          currentChunkIndex: i,
          liveStatusMessage: `Paused at chunk ${i + 1} of ${workingChunks.length}`,
          document: {
            ...currentSession.document,
            chunks: [...workingChunks],
          },
        };
        setSession(pausedSession);
        saveActiveSession(pausedSession);
        setIsTranslating(false);
        return;
      }

      // Check for cancel
      if (cancelRequestedRef.current) {
        const cancelledSession: TranslationSession = {
          ...currentSession,
          status: 'cancelled',
          liveStatusMessage: 'Translation cancelled by user.',
          document: {
            ...currentSession.document,
            chunks: [...workingChunks],
          },
        };
        setSession(cancelledSession);
        saveActiveSession(cancelledSession);
        setIsTranslating(false);
        return;
      }

      const chunk = workingChunks[i];
      if (chunk.status === 'completed' && chunk.translatedText) {
        continue;
      }

      workingChunks[i] = { ...chunk, status: 'translating' };
      const activeStatusMsg = chunk.chapterTitle
        ? `Translating ${chunk.chapterTitle} (Chunk ${chunk.sequence}/${workingChunks.length})...`
        : `Translating Chunk ${chunk.sequence} of ${workingChunks.length}...`;

      setSession((prev) =>
        prev
          ? {
              ...prev,
              currentChunkIndex: i,
              liveStatusMessage: activeStatusMsg,
              document: {
                ...prev.document,
                chunks: [...workingChunks],
              },
            }
          : prev
      );

      let translationSuccess = false;
      let translatedTextResult = '';
      let attempt = 0;

      while (attempt < maxRetries && !translationSuccess) {
        attempt++;
        try {
          const translatedString = await translateChunk({
            currentChunkText: chunk.originalText,
            previousContextText: config.contextMemory ? rollingContext : '',
            sourceLanguage: currentSession.config.sourceLanguage,
            targetLanguage: currentSession.config.targetLanguage,
            style: config.style,
            terminology,
            config,
            modelName: settings.modelName,
            temperature: settings.temperature,
          });

          if (translatedString && translatedString.trim()) {
            translatedTextResult = translatedString.trim();
            translationSuccess = true;
          } else {
            throw new Error('Received empty response from translation model');
          }
        } catch (err: any) {
          console.warn(`Attempt ${attempt} for chunk ${chunk.sequence} failed:`, err);
          if (attempt < maxRetries) {
            await new Promise((r) => setTimeout(r, 1000 * attempt));
          }
        }
      }

      if (translationSuccess) {
        workingChunks[i] = {
          ...chunk,
          status: 'completed',
          translatedText: translatedTextResult,
        };
        rollingContext = translatedTextResult.slice(-400);

        const updatedCompleted = workingChunks.filter((c) => c.status === 'completed').length;
        const updatedSession: TranslationSession = {
          ...currentSession,
          completedChunksCount: updatedCompleted,
          document: {
            ...currentSession.document,
            chunks: [...workingChunks],
          },
          liveStatusMessage: `Completed chunk ${chunk.sequence} of ${workingChunks.length}`,
        };
        setSession(updatedSession);
        saveActiveSession(updatedSession);
      } else {
        workingChunks[i] = {
          ...chunk,
          status: 'failed',
          error: 'Transient API rate limit or network error',
        };
        const failedSession: TranslationSession = {
          ...currentSession,
          document: {
            ...currentSession.document,
            chunks: [...workingChunks],
          },
          liveStatusMessage: `Chunk ${chunk.sequence} failed after ${maxRetries} retries`,
        };
        setSession(failedSession);
        saveActiveSession(failedSession);
      }
    }

    // Complete loop
    const anyFailed = workingChunks.some((c) => c.status === 'failed');
    const finalCompletedCount = workingChunks.filter((c) => c.status === 'completed').length;
    const finalFullTranslation = workingChunks
      .filter((c) => c.translatedText)
      .map((c) => c.translatedText)
      .join('\n\n');

    const qcResult = runQualityControlCheck(workingChunks, terminology, finalFullTranslation);
    setValidationResult(qcResult);

    const finalStatus: TranslationSession['status'] = anyFailed ? 'failed' : 'completed';
    const finishedSession: TranslationSession = {
      ...currentSession,
      status: finalStatus,
      completedChunksCount: finalCompletedCount,
      endTime: Date.now(),
      document: {
        ...currentSession.document,
        chunks: [...workingChunks],
      },
      liveStatusMessage: anyFailed
        ? 'Translation completed with some failed chunks. You can retry them.'
        : 'Translation completed successfully!',
    };

    setSession(finishedSession);
    saveActiveSession(finishedSession);
    setIsTranslating(false);

    // Save to History
    const historyItem: HistoryRecord = {
      id: `hist-${Date.now()}`,
      fileName: currentSession.document.fileName,
      fileType: currentSession.document.fileType,
      sourceLanguage: currentSession.config.sourceLanguage,
      targetLanguage: currentSession.config.targetLanguage,
      date: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      status: anyFailed ? 'Failed' : 'Completed',
      totalChunks: workingChunks.length,
      completedChunks: finalCompletedCount,
      terminologyCount: terminology.length,
      originalTextPreview: currentSession.document.extractedText.slice(0, 100),
      translatedTextPreview: finalFullTranslation.slice(0, 120),
      fullTranslatedText: finalFullTranslation,
      fullOriginalText: currentSession.document.extractedText,
    };

    setHistory((prev) => [historyItem, ...prev.filter((h) => h.fileName !== currentSession.document.fileName)]);
  };

  // Pause
  const handlePauseTranslation = () => {
    pauseRequestedRef.current = true;
  };

  // Resume
  const handleResumeTranslation = () => {
    if (!session || isTranslating) return;
    pauseRequestedRef.current = false;
    cancelRequestedRef.current = false;
    setIsTranslating(true);
    const updated: TranslationSession = {
      ...session,
      status: 'translating',
      liveStatusMessage: 'Resuming translation...',
    };
    setSession(updated);
    saveActiveSession(updated);
    executeTranslationPipeline(updated, [...session.document.chunks]);
  };

  // Cancel
  const handleCancelTranslation = () => {
    cancelRequestedRef.current = true;
    clearActiveSession();
    setIsTranslating(false);
    if (session) {
      setSession({
        ...session,
        status: 'cancelled',
        liveStatusMessage: 'Translation cancelled.',
      });
    }
  };

  // Retry failed chunks
  const handleRetryFailedChunks = () => {
    if (!session || isTranslating) return;
    const workingChunks = session.document.chunks.map((c) =>
      c.status === 'failed' ? { ...c, status: 'pending' as const, error: undefined } : c
    );

    pauseRequestedRef.current = false;
    cancelRequestedRef.current = false;
    setIsTranslating(true);

    const updatedSession: TranslationSession = {
      ...session,
      status: 'translating',
      document: {
        ...session.document,
        chunks: workingChunks,
      },
      liveStatusMessage: 'Retrying failed chunks...',
    };
    setSession(updatedSession);
    saveActiveSession(updatedSession);
    executeTranslationPipeline(updatedSession, workingChunks);
  };

  // History Reopen
  const handleReopenHistory = (record: HistoryRecord) => {
    if (record.fullTranslatedText) {
      const restoredDoc: DocumentData = {
        id: `doc-${record.id}`,
        fileName: record.fileName,
        fileSize: record.fullTranslatedText.length,
        fileType: record.fileType,
        extractedText: record.fullOriginalText || record.fullTranslatedText,
        detectedLanguage: record.sourceLanguage,
        chunks: [
          {
            id: 'c-1',
            sequence: 1,
            originalText: record.fullOriginalText || record.fullTranslatedText,
            translatedText: record.fullTranslatedText,
            status: 'completed',
            wordCount: record.fullTranslatedText.split(/\s+/).length,
          },
        ],
      };

      setDocument(restoredDoc);
      setConfig((p) => ({
        ...p,
        sourceLanguage: record.sourceLanguage,
        targetLanguage: record.targetLanguage,
      }));

      setSession({
        id: `sess-${Date.now()}`,
        document: restoredDoc,
        config: {
          ...config,
          sourceLanguage: record.sourceLanguage,
          targetLanguage: record.targetLanguage,
        },
        terminology,
        status: 'completed',
        currentChunkIndex: 0,
        totalChunksCount: record.totalChunks,
        completedChunksCount: record.completedChunks,
        liveStatusMessage: 'Reopened session from history.',
      });
      setActiveTab('dashboard');
    }
  };

  const handleDeleteHistory = (id: string) => {
    setHistory((prev) => prev.filter((h) => h.id !== id));
  };

  const handleClearAllHistory = () => {
    setHistory([]);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Top Application Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isTranslating={isTranslating}
        theme={theme}
        setTheme={handleThemeChange}
        termCount={terminology.length}
        historyCount={history.length}
      />

      {/* Main Tab Views */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            {/* Document Upload Area */}
            <section aria-label="Document Upload Area">
              <UploadArea
                document={document}
                setDocument={(doc) => {
                  setDocument(doc);
                  if (!doc) {
                    setSession(null);
                    clearActiveSession();
                  }
                }}
                onLanguageDetected={(langCode) => {
                  setConfig((prev) => ({
                    ...prev,
                    sourceLanguage: langCode,
                  }));
                }}
                targetWordsPerChunk={settings.chunkSizeWords}
              />
            </section>

            {/* Translation Configuration & Terminology Scan */}
            <section aria-label="Translation Configuration">
              <ConfigPanel
                config={config}
                setConfig={setConfig}
                onStartTranslation={handleStartTranslation}
                isTranslating={isTranslating}
                disabled={!document}
                extractedText={document?.extractedText || ''}
                terminology={terminology}
                setTerminology={setTerminology}
                chunkCount={document?.chunks.length || 0}
              />
            </section>

            {/* Translation Progress Bar & Chunk Pipeline */}
            {session && (
              <section aria-label="Translation Progress">
                <TranslationProgress
                  session={session}
                  chunks={session.document.chunks}
                  onPause={handlePauseTranslation}
                  onResume={handleResumeTranslation}
                  onCancel={handleCancelTranslation}
                  onRetryFailed={handleRetryFailedChunks}
                  onViewPreview={() => {
                    window.document
                      .getElementById('translation-preview-card')
                      ?.scrollIntoView({ behavior: 'smooth' });
                  }}
                />
              </section>
            )}

            {/* Translation Preview Studio */}
            {(currentAggregatedTranslation || session?.status === 'completed') && (
              <section aria-label="Translation Studio & Output">
                <TranslationPreview
                  documentTitle={document?.fileName || session?.document.fileName || 'novel_translated'}
                  originalText={
                    document?.extractedText ||
                    session?.document.chunks.map((c) => c.originalText).join('\n\n') ||
                    ''
                  }
                  translatedText={currentAggregatedTranslation}
                  chunks={session?.document.chunks || []}
                  targetLangCode={config.targetLanguage}
                  onOpenQualityCheck={() => setIsQcModalOpen(true)}
                  validationResult={validationResult}
                />
              </section>
            )}
          </div>
        )}

        {/* Terminology Dictionary Manager */}
        {activeTab === 'terminology' && (
          <TerminologyManager
            terminology={terminology}
            setTerminology={setTerminology}
            onScanFromDoc={document?.extractedText ? handleAutoScanTerminology : undefined}
            isScanning={isScanningActiveDoc}
          />
        )}

        {/* Translation History */}
        {activeTab === 'history' && (
          <HistoryView
            history={history}
            onReopen={handleReopenHistory}
            onDelete={handleDeleteHistory}
            onClearAll={handleClearAllHistory}
          />
        )}

        {/* Settings View */}
        {activeTab === 'settings' && (
          <SettingsView
            settings={settings}
            setSettings={handleUpdateSettings}
            config={config}
            setConfig={setConfig}
            theme={theme}
            setTheme={handleThemeChange}
          />
        )}
      </main>

      {/* Quality Control Audit Modal */}
      <QualityControlModal
        isOpen={isQcModalOpen}
        onClose={() => setIsQcModalOpen(false)}
        result={validationResult}
        onRetryFailed={handleRetryFailedChunks}
      />

      {/* Subtle Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-6 text-center text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            <strong>LingoNovel AI</strong> • Intelligent Long-Form & Literary Translation Engine
          </span>
          <span>Powered by Google Gemini 3.8 Flash • English → Urdu Literary Specialist</span>
        </div>
      </footer>
    </div>
  );
}
