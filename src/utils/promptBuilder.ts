import { TerminologyItem, TranslationConfig } from '../types';

export interface PromptPayloadOptions {
  currentChunkText: string;
  previousContextText?: string;
  sourceLanguage: string;
  targetLanguage: string;
  style: string;
  terminology: TerminologyItem[];
  config: TranslationConfig;
}

export function buildSystemPrompt(options: PromptPayloadOptions): string {
  const isUrdu = options.targetLanguage.toLowerCase() === 'ur' || options.targetLanguage.toLowerCase() === 'urdu';

  let prompt = `You are an elite, award-winning professional literary translator specializing in novels, books, and long-form fiction.

Translate the provided source text into ${options.targetLanguage}.

YOUR HIGHEST PRIORITIES:
1. Preserve meaning faithfully without distortion.
2. Preserve narrative context and continuity from previous paragraphs.
3. Preserve emotional tone, psychological tension, suspense, and scene atmosphere.
4. Preserve exact paragraph structure, line breaks, and indentation.
5. Preserve dialogue structure, punctuation marks, quotation styles, and distinct character voices.
6. Maintain terminology and entity consistency throughout the story.
7. Preserve names, titles, and protected terms as instructed.
8. NEVER invent new events or add external information.
9. NEVER summarize or compress text.
10. NEVER omit any sentences, phrases, or dialogue.

LITERARY AND FICTION CRAFT:
- The translation must read fluidly and naturally as if originally penned by a master storyteller fluent in ${options.targetLanguage}.
- Translation Style: ${options.style.toUpperCase()}.
- Maintain pacing: Fast-paced action scenes must retain punchy tempo; contemplative scenes must preserve lyrical depth.
- Do NOT provide commentary, prefaces, transliteration guides, footnotes, or translator notes.
- Output ONLY the translated content, preserving paragraph divisions.`;

  if (isUrdu) {
    prompt += `

SPECIFIC URDU NOVEL TRANSLATION RULES:
- Produce idiomatic, authentic, and evocative Urdu (بامحاورہ اور شگفتہ اردو) rather than awkward literal translation.
- Maintain character personality and conversational Urdu dialogue.
- Use standard Urdu punctuation (۔ ، ! ؟) while respecting quotation conventions.
- When character names or fictional locations/abilities appear (e.g. "Alex", "Kael", "Eldoria"), keep the English script or standard transliteration as locked in the terminology rules.
- Example: "Alex looked toward the dark forest. 'We need to leave now.'" -> "Alex نے اندھیرے جنگل کی طرف دیکھا۔ 'ہمیں ابھی یہاں سے نکلنا ہوگا۔'"
- Do not add artificial flowery Urdu where the original is gritty, and do not make poetic passages dry.`;
  }

  return prompt;
}

export function buildUserPrompt(options: PromptPayloadOptions): string {
  const { currentChunkText, previousContextText, terminology, config } = options;

  let content = `Target Language: ${options.targetLanguage}\n`;
  if (options.sourceLanguage && options.sourceLanguage !== 'auto') {
    content += `Source Language: ${options.sourceLanguage}\n`;
  }
  content += `Translation Style: ${config.style}\n\n`;

  // Constraints from toggles
  const guidelines: string[] = [];
  if (config.preserveNames) {
    guidelines.push('- Keep personal names and character names in their original Latin/English form or transliteration.');
  }
  if (config.preserveSpecialTerms) {
    guidelines.push('- Keep fictional abilities, magic powers, fantasy locations, weaponry, and unique lore terms in their original Latin/English form or locked terms.');
  }
  if (config.preserveFormatting) {
    guidelines.push('- Preserve exact paragraph breaks, headings, dialogue dashes/quotes, and spacing.');
  }
  if (config.translationConsistency) {
    guidelines.push('- Maintain strict terminology consistency across repeated names and phrases.');
  }
  if (config.customInstructions && config.customInstructions.trim()) {
    guidelines.push(`- Additional User Directive: ${config.customInstructions.trim()}`);
  }

  if (guidelines.length > 0) {
    content += `MANDATORY TRANSLATION GUIDELINES:\n${guidelines.join('\n')}\n\n`;
  }

  // Terminology memory
  if (terminology && terminology.length > 0) {
    content += `LOCKED TERMINOLOGY & ENTITY DICTIONARY:\n`;
    terminology.forEach((t) => {
      content += `• "${t.original}" [${t.type}] => "${t.preferredTranslation}"${t.locked ? ' (STRICT - DO NOT ALTER)' : ''}\n`;
    });
    content += `\n`;
  }

  // Previous context
  if (config.contextMemory && previousContextText && previousContextText.trim()) {
    content += `PREVIOUS TRANSLATED CONTEXT (For reference and continuous narrative flow only; do not re-translate this):\n"""\n${previousContextText.trim().slice(-600)}\n"""\n\n`;
  }

  // Current chunk to translate
  content += `TEXT TO TRANSLATE (Translate the following text completely without omitting any words):\n"""\n${currentChunkText}\n"""`;

  return content;
}
