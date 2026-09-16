export type TranslationStyle =
  | 'natural'
  | 'literal'
  | 'literary'
  | 'professional'
  | 'casual'
  | 'formal';

export type EntityType =
  | 'character'
  | 'place'
  | 'ability'
  | 'object'
  | 'organization'
  | 'title'
  | 'other';

export interface Language {
  code: string;
  name: string;
  nativeName: string;
  dir: 'ltr' | 'rtl';
}

export interface TerminologyItem {
  id: string;
  original: string;
  preferredTranslation: string;
  type: EntityType;
  locked: boolean;
  notes?: string;
}

export interface TranslationConfig {
  sourceLanguage: string; // 'auto' or language code
  targetLanguage: string; // language code
  style: TranslationStyle;
  preserveNames: boolean;
  preserveSpecialTerms: boolean;
  preserveFormatting: boolean;
  contextMemory: boolean;
  translationConsistency: boolean;
  customInstructions: string;
}

export interface DocumentChunk {
  id: string;
  sequence: number;
  chapterIndex?: number;
  chapterTitle?: string;
  originalText: string;
  translatedText?: string;
  status: 'pending' | 'translating' | 'completed' | 'failed';
  error?: string;
  wordCount: number;
  retryCount?: number;
}

export interface DocumentData {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: 'pdf' | 'txt';
  pageCount?: number;
  isScanned?: boolean;
  extractedText: string;
  detectedLanguage?: string;
  chunks: DocumentChunk[];
}

export interface TranslationSession {
  id: string;
  document: DocumentData;
  config: TranslationConfig;
  terminology: TerminologyItem[];
  status: 'idle' | 'analyzing' | 'translating' | 'paused' | 'completed' | 'failed' | 'cancelled';
  currentChunkIndex: number;
  completedChunksCount: number;
  totalChunksCount: number;
  startTime?: number;
  endTime?: number;
  liveStatusMessage: string;
}

export interface HistoryRecord {
  id: string;
  fileName: string;
  fileType: 'pdf' | 'txt';
  sourceLanguage: string;
  targetLanguage: string;
  date: string;
  status: 'Completed' | 'In Progress' | 'Paused' | 'Failed' | 'Cancelled';
  totalChunks: number;
  completedChunks: number;
  originalTextPreview: string;
  translatedTextPreview: string;
  fullTranslatedText?: string;
  fullOriginalText?: string;
  terminologyCount: number;
}

export interface AppSettings {
  defaultSourceLanguage: string;
  defaultTargetLanguage: string;
  defaultStyle: TranslationStyle;
  preserveNames: boolean;
  preserveSpecialTerms: boolean;
  preserveFormatting: boolean;
  contextMemory: boolean;
  translationConsistency: boolean;
  modelName: string;
  temperature: number;
  chunkSizeWords: number;
  retryLimit: number;
  theme: 'light' | 'dark' | 'system';
}

export interface TranslationValidationResult {
  isValid: boolean;
  totalChunks: number;
  completedChunks: number;
  missingChunks: number[];
  failedChunks: number[];
  hasApiErrors: boolean;
  hasAccidentalSummary: boolean;
  warnings: string[];
}
