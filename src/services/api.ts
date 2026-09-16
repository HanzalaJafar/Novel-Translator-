import { TerminologyItem, TranslationConfig } from '../types';

export interface HealthResponse {
  status: string;
  hasApiKey: boolean;
  defaultModel: string;
}

export interface ExtractPdfResponse {
  success: boolean;
  fileName: string;
  pageCount: number;
  extractedText: string;
  isScanned: boolean;
  charCount: number;
  message?: string;
  error?: string;
}

export interface DetectLanguageResponse {
  success: boolean;
  languageCode: string;
  languageName: string;
}

export interface TranslateChunkParams {
  currentChunkText: string;
  previousContextText?: string;
  sourceLanguage: string;
  targetLanguage: string;
  style: string;
  terminology: TerminologyItem[];
  config: TranslationConfig;
  modelName?: string;
  temperature?: number;
}

export interface TranslateChunkResponse {
  success: boolean;
  translatedText?: string;
  error?: string;
}

export async function checkHealth(): Promise<HealthResponse> {
  const res = await fetch('/api/health');
  if (!res.ok) throw new Error('Failed to reach backend server');
  return res.json();
}

export async function extractPdf(base64Data: string, fileName: string): Promise<ExtractPdfResponse> {
  const res = await fetch('/api/extract-pdf', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ base64Data, fileName }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to extract text from PDF');
  }
  return data;
}

export async function detectLanguage(textSample: string): Promise<DetectLanguageResponse> {
  const res = await fetch('/api/detect-language', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ textSample }),
  });
  return res.json();
}

export async function extractEntities(
  textSample: string,
  targetLanguage: string
): Promise<TerminologyItem[]> {
  const res = await fetch('/api/extract-entities', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ textSample, targetLanguage }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) return [];
  return (data.entities || []).map((e: any, idx: number) => ({
    id: `term-${Date.now()}-${idx}`,
    original: e.original || '',
    preferredTranslation: e.preferredTranslation || '',
    type: e.type || 'other',
    locked: !!e.locked,
  }));
}

export async function translateChunk(params: TranslateChunkParams): Promise<string> {
  const res = await fetch('/api/translate-chunk', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  const data: TranslateChunkResponse = await res.json();
  if (!res.ok || !data.success || !data.translatedText) {
    throw new Error(data.error || `Server translation failed (HTTP ${res.status})`);
  }

  return data.translatedText;
}
