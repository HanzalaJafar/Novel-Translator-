import { DocumentChunk } from '../types';

// Regex to detect chapter headings (e.g. Chapter 1, Chapter One, CHAPTER IV, Prologue, Epilogue, Book 1, Part 2)
const CHAPTER_REGEX = /^(?:chapter\s+(?:\d+|[ivxlcdm]+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|[a-z]+)|prologue|epilogue|book\s+(?:\d+|[ivxlcdm]+)|part\s+(?:\d+|[ivxlcdm]+))\b[:\s\-—.]*(.*)$/im;

export interface ChunkingOptions {
  targetWordsPerChunk?: number;
  maxWordsPerChunk?: number;
}

export function detectChapters(text: string): { title: string; startIndex: number }[] {
  const lines = text.split('\n');
  const chapters: { title: string; startIndex: number }[] = [];
  let currentIndex = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length > 0 && trimmed.length < 120 && CHAPTER_REGEX.test(trimmed)) {
      chapters.push({
        title: trimmed,
        startIndex: currentIndex,
      });
    }
    currentIndex += line.length + 1; // +1 for the newline
  }

  return chapters;
}

export function countWords(str: string): number {
  return (str.match(/\S+/g) || []).length;
}

export function createIntelligentChunks(
  text: string,
  options: ChunkingOptions = {}
): DocumentChunk[] {
  const targetWords = options.targetWordsPerChunk || 400;
  const maxWords = options.maxWordsPerChunk || 600;

  const normalized = text.replace(/\r\n/g, '\n').trim();
  if (!normalized) return [];

  // Split into raw paragraphs
  const rawParagraphs = normalized.split(/\n{2,}/);
  const chunks: DocumentChunk[] = [];
  let currentParagraphs: string[] = [];
  let currentWordCount = 0;
  let currentChapterTitle: string | undefined = undefined;
  let currentChapterIndex = 0;
  let sequence = 1;

  const flushChunk = () => {
    if (currentParagraphs.length === 0) return;
    const chunkText = currentParagraphs.join('\n\n').trim();
    if (chunkText.length > 0) {
      chunks.push({
        id: `chunk-${sequence}`,
        sequence,
        chapterIndex: currentChapterIndex,
        chapterTitle: currentChapterTitle,
        originalText: chunkText,
        status: 'pending',
        wordCount: countWords(chunkText),
      });
      sequence++;
    }
    currentParagraphs = [];
    currentWordCount = 0;
  };

  for (const para of rawParagraphs) {
    const trimmed = para.trim();
    if (!trimmed) continue;

    // Check if this paragraph itself is a chapter heading
    const firstLine = trimmed.split('\n')[0].trim();
    const isChapter = firstLine.length < 120 && CHAPTER_REGEX.test(firstLine);

    if (isChapter) {
      // Flush previous chunk before starting new chapter
      flushChunk();
      currentChapterIndex++;
      currentChapterTitle = firstLine;
    }

    const paraWords = countWords(trimmed);

    // If a single paragraph is larger than maxWords, break it by sentences
    if (paraWords > maxWords) {
      // Flush anything pending
      flushChunk();

      // Split large paragraph into sentences
      const sentences = trimmed.match(/[^.!?]+[.!?]+["']?|[^.!?]+$/g) || [trimmed];
      let subGroup: string[] = [];
      let subWords = 0;

      for (const sent of sentences) {
        const sentWords = countWords(sent);
        if (subWords + sentWords > targetWords && subGroup.length > 0) {
          chunks.push({
            id: `chunk-${sequence}`,
            sequence,
            chapterIndex: currentChapterIndex,
            chapterTitle: currentChapterTitle,
            originalText: subGroup.join(' ').trim(),
            status: 'pending',
            wordCount: subWords,
          });
          sequence++;
          subGroup = [sent];
          subWords = sentWords;
        } else {
          subGroup.push(sent);
          subWords += sentWords;
        }
      }

      if (subGroup.length > 0) {
        chunks.push({
          id: `chunk-${sequence}`,
          sequence,
          chapterIndex: currentChapterIndex,
          chapterTitle: currentChapterTitle,
          originalText: subGroup.join(' ').trim(),
          status: 'pending',
          wordCount: subWords,
        });
        sequence++;
      }
      continue;
    }

    // Check if adding this paragraph exceeds target words
    if (currentWordCount + paraWords > targetWords && currentParagraphs.length > 0) {
      flushChunk();
    }

    currentParagraphs.push(trimmed);
    currentWordCount += paraWords;
  }

  // Flush remaining
  flushChunk();

  return chunks;
}
