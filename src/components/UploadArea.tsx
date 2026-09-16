import React, { useState, useRef, ChangeEvent, DragEvent } from 'react';
import { Upload, FileText, X, AlertTriangle, CheckCircle2, Sparkles, BookOpen, Loader2 } from 'lucide-react';
import { DocumentData } from '../types';
import { extractPdf, detectLanguage } from '../services/api';
import { SAMPLE_DOCUMENTS, SampleDocument } from '../constants/samples';
import { createIntelligentChunks } from '../utils/chunker';

interface UploadAreaProps {
  document: DocumentData | null;
  setDocument: (doc: DocumentData | null) => void;
  onLanguageDetected?: (langCode: string) => void;
  targetWordsPerChunk?: number;
}

export function UploadArea({
  document,
  setDocument,
  onLanguageDetected,
  targetWordsPerChunk = 400,
}: UploadAreaProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    setErrorMessage(null);
    setIsLoading(true);

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'pdf' && ext !== 'txt') {
      setErrorMessage('Unsupported file format. Please upload a PDF or TXT document.');
      setIsLoading(false);
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      setErrorMessage('File exceeds the 50MB limit. Please upload a smaller document.');
      setIsLoading(false);
      return;
    }

    if (file.size === 0) {
      setErrorMessage('The uploaded file is empty.');
      setIsLoading(false);
      return;
    }

    try {
      if (ext === 'txt') {
        const text = await file.text();
        if (!text.trim()) {
          setErrorMessage('The TXT file contains no readable text content.');
          setIsLoading(false);
          return;
        }

        const chunks = createIntelligentChunks(text, { targetWordsPerChunk });

        // Auto-detect language
        let detectedLang = 'en';
        try {
          const res = await detectLanguage(text.slice(0, 1000));
          if (res.languageCode) {
            detectedLang = res.languageCode;
            onLanguageDetected?.(res.languageCode);
          }
        } catch (e) {
          console.warn('Language detection skipped:', e);
        }

        setDocument({
          id: `doc-${Date.now()}`,
          fileName: file.name,
          fileSize: file.size,
          fileType: 'txt',
          extractedText: text,
          detectedLanguage: detectedLang,
          chunks,
        });
      } else if (ext === 'pdf') {
        // Convert to base64
        const arrayBuffer = await file.arrayBuffer();
        const base64 = btoa(
          new Uint8Array(arrayBuffer).reduce(
            (data, byte) => data + String.fromCharCode(byte),
            ''
          )
        );

        const pdfResult = await extractPdf(base64, file.name);

        if (pdfResult.isScanned) {
          setDocument({
            id: `doc-${Date.now()}`,
            fileName: file.name,
            fileSize: file.size,
            fileType: 'pdf',
            pageCount: pdfResult.pageCount,
            isScanned: true,
            extractedText: '',
            chunks: [],
          });
          setErrorMessage(
            'This PDF appears to be scanned/image-based. OCR is required to extract and translate it.'
          );
          setIsLoading(false);
          return;
        }

        const chunks = createIntelligentChunks(pdfResult.extractedText, { targetWordsPerChunk });

        // Auto-detect language
        let detectedLang = 'en';
        try {
          const res = await detectLanguage(pdfResult.extractedText.slice(0, 1000));
          if (res.languageCode) {
            detectedLang = res.languageCode;
            onLanguageDetected?.(res.languageCode);
          }
        } catch (e) {
          console.warn('Language detection skipped:', e);
        }

        setDocument({
          id: `doc-${Date.now()}`,
          fileName: file.name,
          fileSize: file.size,
          fileType: 'pdf',
          pageCount: pdfResult.pageCount,
          isScanned: false,
          extractedText: pdfResult.extractedText,
          detectedLanguage: detectedLang,
          chunks,
        });
      }
    } catch (err: any) {
      console.error('File process error:', err);
      setErrorMessage(err.message || 'Failed to parse and extract text from document.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const loadSample = (sample: SampleDocument) => {
    const chunks = createIntelligentChunks(sample.text, { targetWordsPerChunk });
    setErrorMessage(null);
    setDocument({
      id: `doc-${sample.id}-${Date.now()}`,
      fileName: `${sample.title}.txt`,
      fileSize: new Blob([sample.text]).size,
      fileType: 'txt',
      extractedText: sample.text,
      detectedLanguage: sample.sourceLang,
      chunks,
    });
    onLanguageDetected?.(sample.sourceLang);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="w-full space-y-4">
      {/* Upload Box */}
      {!document ? (
        <div
          id="upload-dropzone"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !isLoading && fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all cursor-pointer ${
            isDragging
              ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 scale-[1.005]'
              : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/60 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-slate-50/50 dark:hover:bg-slate-800/30'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.txt,text/plain,application/pdf"
            onChange={handleFileInput}
            className="hidden"
            id="file-upload-input"
          />

          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-xs">
              {isLoading ? (
                <Loader2 className="w-8 h-8 animate-spin" />
              ) : (
                <Upload className="w-8 h-8" />
              )}
            </div>

            <div className="space-y-1.5 max-w-md">
              <h3 className="text-base sm:text-lg font-semibold text-slate-800 dark:text-slate-100 font-display">
                {isLoading ? 'Extracting text and structure...' : 'Drop your PDF or TXT file here'}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Supports books, novels, short stories, chapters, and articles up to 50MB
              </p>
            </div>

            {!isLoading && (
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  id="btn-browse-files"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm transition-all shadow-sm shadow-indigo-600/20 active:scale-95"
                >
                  Browse Files
                </button>
              </div>
            )}

            <div className="flex items-center gap-4 text-xs text-slate-400 dark:text-slate-500 pt-3">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                PDF (Formatted & Digital)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                TXT (Plain Text & Markdown)
              </span>
              <span>Max 50MB</span>
            </div>
          </div>
        </div>
      ) : (
        /* Uploaded Document Info Card */
        <div
          id="uploaded-document-card"
          className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 flex-shrink-0">
                <FileText className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-semibold text-slate-900 dark:text-white text-base">
                    {document.fileName}
                  </h4>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 uppercase">
                    {document.fileType}
                  </span>
                  {document.detectedLanguage && (
                    <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Detected: {document.detectedLanguage.toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                  <span>{formatFileSize(document.fileSize)}</span>
                  <span>•</span>
                  {document.pageCount && <span>{document.pageCount} Pages •</span>}
                  <span>{document.chunks.length} Intelligent Chunks</span>
                  <span>•</span>
                  <span>{document.extractedText.length.toLocaleString()} Characters</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                id="btn-remove-document"
                onClick={() => {
                  setDocument(null);
                  setErrorMessage(null);
                }}
                className="px-3.5 py-2 rounded-xl text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 transition-colors flex items-center gap-1.5"
              >
                <X className="w-3.5 h-3.5" />
                Remove File
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error / Scanned Warning Message */}
      {errorMessage && (
        <div className="rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 p-4 flex items-start gap-3 text-sm text-rose-800 dark:text-rose-200">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
          <div className="space-y-1">
            <p className="font-medium">{errorMessage}</p>
            {document?.isScanned && (
              <p className="text-xs text-rose-700 dark:text-rose-300">
                This document does not have an embedded text layer. Please use a text-based PDF or convert it with an OCR tool before uploading.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Quick Test with Sample Novels */}
      {!document && !isLoading && (
        <div className="pt-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Or try a sample novel chapter:
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {SAMPLE_DOCUMENTS.map((sample) => (
              <button
                key={sample.id}
                id={`btn-sample-${sample.id}`}
                onClick={() => loadSample(sample)}
                className="text-left p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-white dark:hover:bg-slate-900 transition-all group"
              >
                <div className="flex items-center justify-between text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                  <span className="truncate">{sample.title}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                    {sample.category}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                  English → Urdu • Characters: Alex, Kael • Powers & Lore
                </p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
