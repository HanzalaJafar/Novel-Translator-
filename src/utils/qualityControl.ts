import { DocumentChunk, TerminologyItem, TranslationValidationResult } from '../types';

export function runQualityControlCheck(
  chunks: DocumentChunk[],
  terminology: TerminologyItem[],
  combinedTranslation: string
): TranslationValidationResult {
  const totalChunks = chunks.length;
  const completedChunks = chunks.filter((c) => c.status === 'completed' && c.translatedText).length;
  const missingChunks: number[] = [];
  const failedChunks: number[] = [];
  const warnings: string[] = [];
  let hasApiErrors = false;
  let hasAccidentalSummary = false;

  // Check sequence numbers and missing chunks
  for (let i = 1; i <= totalChunks; i++) {
    const chunk = chunks.find((c) => c.sequence === i);
    if (!chunk || !chunk.translatedText) {
      missingChunks.push(i);
    }
  }

  // Check failed chunks
  chunks.forEach((c) => {
    if (c.status === 'failed') {
      failedChunks.push(c.sequence);
    }
  });

  // Check API error strings in translated text
  const errorIndicators = [
    'internal server error',
    'rate limit exceeded',
    'gemini api error',
    'quota exceeded',
    'bad request',
    'unauthorized',
  ];

  const lowerTranslation = combinedTranslation.toLowerCase();
  for (const err of errorIndicators) {
    if (lowerTranslation.includes(err)) {
      hasApiErrors = true;
      warnings.push(`Detected potential API error text in translation: "${err}"`);
      break;
    }
  }

  // Check accidental summary indicators
  const summaryPhrases = [
    'in summary,',
    'here is a summary',
    'summary of the chapter',
    'this excerpt discusses',
    'the story summarizes',
  ];
  for (const phrase of summaryPhrases) {
    if (lowerTranslation.includes(phrase)) {
      hasAccidentalSummary = true;
      warnings.push(`Detected potential summary marker: "${phrase}"`);
      break;
    }
  }

  // Check Terminology consistency
  let unpreservedLockedCount = 0;
  terminology
    .filter((t) => t.locked && t.preferredTranslation)
    .forEach((t) => {
      // Check if term was in source
      const termAppearedInOriginal = chunks.some((c) =>
        c.originalText.toLowerCase().includes(t.original.toLowerCase())
      );
      if (termAppearedInOriginal) {
        const termFoundInOutput =
          combinedTranslation.toLowerCase().includes(t.preferredTranslation.toLowerCase()) ||
          combinedTranslation.includes(t.original);
        if (!termFoundInOutput) {
          unpreservedLockedCount++;
        }
      }
    });

  if (unpreservedLockedCount > 0) {
    warnings.push(
      `${unpreservedLockedCount} locked terminology terms were not found in expected form.`
    );
  }

  if (missingChunks.length > 0) {
    warnings.push(`${missingChunks.length} chunks are missing translation.`);
  }

  if (failedChunks.length > 0) {
    warnings.push(`${failedChunks.length} chunks failed and require retry.`);
  }

  const isValid =
    missingChunks.length === 0 &&
    failedChunks.length === 0 &&
    !hasApiErrors &&
    !hasAccidentalSummary;

  return {
    isValid,
    totalChunks,
    completedChunks,
    missingChunks,
    failedChunks,
    hasApiErrors,
    hasAccidentalSummary,
    warnings,
  };
}
