import express, { Request, Response } from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";
import { createRequire } from "module";
import { buildSystemPrompt, buildUserPrompt } from "./src/utils/promptBuilder.ts";

const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");

dotenv.config();

const app = express();
const PORT = 3000;

// Body parser with 50mb limit for large documents
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Lazy initialize Gemini client
function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not configured. Please check Settings > Secrets.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// 1. Health check
app.get("/api/health", (_req: Request, res: Response) => {
  const hasKey = !!process.env.GEMINI_API_KEY;
  res.json({
    status: "ok",
    hasApiKey: hasKey,
    defaultModel: "gemini-3.8-flash",
  });
});

// 2. Extract PDF text
app.post("/api/extract-pdf", async (req: Request, res: Response) => {
  try {
    const { base64Data, fileName } = req.body;
    if (!base64Data) {
      return res.status(400).json({ success: false, error: "No base64 document data provided." });
    }

    const pdfBuffer = Buffer.from(base64Data, "base64");
    const data = await pdfParse(pdfBuffer);

    const extractedText = (data.text || "").trim();
    const pageCount = data.numpages || 1;

    // Check if PDF has virtually no extractable text (e.g. image-only / scanned PDF)
    const isScanned = extractedText.length < 30;

    return res.json({
      success: true,
      fileName,
      pageCount,
      extractedText,
      isScanned,
      charCount: extractedText.length,
      message: isScanned
        ? "This PDF appears to be scanned/image-based. OCR is required to translate it."
        : `Extracted ${extractedText.length.toLocaleString()} characters across ${pageCount} pages.`,
    });
  } catch (err: any) {
    console.error("PDF Extraction error:", err);
    return res.status(500).json({
      success: false,
      error: err.message || "Failed to extract text from PDF document.",
    });
  }
});

// 3. Detect Language
app.post("/api/detect-language", async (req: Request, res: Response) => {
  try {
    const { textSample } = req.body;
    if (!textSample || !textSample.trim()) {
      return res.json({ success: true, languageCode: "en", languageName: "English" });
    }

    const ai = getGeminiClient();
    const prompt = `Analyze this text excerpt from a document and identify its primary language.
Return a clean JSON object with keys:
- "languageCode": ISO 639-1 code (e.g. "en", "ur", "fr", "ar", "es", "hi", "zh", "ja", "de", "ru")
- "languageName": standard English name of the language (e.g. "English", "Urdu", "French")

Text excerpt:
"""
${textSample.slice(0, 1500)}
"""`;

    let response;
    try {
      response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });
    } catch {
      response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });
    }

    let detected = { languageCode: "en", languageName: "English" };
    try {
      if (response.text) {
        detected = JSON.parse(response.text);
      }
    } catch {
      // Fallback
    }

    return res.json({
      success: true,
      ...detected,
    });
  } catch (err: any) {
    console.error("Language detection error:", err);
    return res.json({ success: true, languageCode: "en", languageName: "English" });
  }
});

// 4. Extract Entities for Terminology Dictionary
app.post("/api/extract-entities", async (req: Request, res: Response) => {
  try {
    const { textSample, targetLanguage } = req.body;
    if (!textSample || !textSample.trim()) {
      return res.json({ success: true, entities: [] });
    }

    const ai = getGeminiClient();
    const prompt = `You are an expert novel editor preparing a terminology glossary for translation into ${targetLanguage || 'Urdu'}.
Scan the following text excerpt and identify recurring named entities:
- Characters / People names
- Fictional or real places / locations
- Special abilities, powers, spells, martial arts techniques
- Important fictional objects, artifacts, weapons
- Organizations, clans, guilds
- Titles or ranks

For each entity, determine the preferred translation or whether it should be kept in original Latin script. For Urdu fiction translation, character names, abilities, and unique fantasy locations are normally preserved in English or transliterated cleanly.

Text excerpt:
"""
${textSample.slice(0, 4000)}
"""`;

    const entityConfig = {
      responseMimeType: "application/json",
      responseSchema: {
        type: "ARRAY" as any,
        items: {
          type: "OBJECT" as any,
          properties: {
            original: { type: "STRING" as any, description: "Original name or term in source text" },
            preferredTranslation: { type: "STRING" as any, description: "Preferred translation or transliteration" },
            type: {
              type: "STRING" as any,
              enum: ["character", "place", "ability", "object", "organization", "title", "other"],
            },
            locked: { type: "BOOLEAN" as any, description: "True if term must be preserved strictly" },
          },
          required: ["original", "preferredTranslation", "type", "locked"],
        },
      },
    };

    let response;
    try {
      response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
        config: entityConfig,
      });
    } catch {
      response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: entityConfig,
      });
    }

    let entities: any[] = [];
    try {
      if (response.text) {
        entities = JSON.parse(response.text);
      }
    } catch (e) {
      console.error("Entity parse error:", e);
    }

    return res.json({ success: true, entities });
  } catch (err: any) {
    console.error("Entity extraction error:", err);
    return res.status(500).json({ success: false, error: err.message, entities: [] });
  }
});

// 5. Translate Single Chunk
app.post("/api/translate-chunk", async (req: Request, res: Response) => {
  try {
    const {
      currentChunkText,
      previousContextText,
      sourceLanguage = "en",
      targetLanguage = "ur",
      style = "natural",
      terminology = [],
      config = {},
      modelName = "gemini-3.8-flash",
      temperature = 0.3,
    } = req.body;

    if (!currentChunkText || !currentChunkText.trim()) {
      return res.status(400).json({ success: false, error: "Chunk text is empty." });
    }

    const ai = getGeminiClient();

    const options = {
      currentChunkText,
      previousContextText,
      sourceLanguage,
      targetLanguage,
      style,
      terminology,
      config: {
        sourceLanguage,
        targetLanguage,
        style,
        preserveNames: config.preserveNames ?? true,
        preserveSpecialTerms: config.preserveSpecialTerms ?? true,
        preserveFormatting: config.preserveFormatting ?? true,
        contextMemory: config.contextMemory ?? true,
        translationConsistency: config.translationConsistency ?? true,
        customInstructions: config.customInstructions || "",
      },
    };

    const systemPrompt = buildSystemPrompt(options);
    const userPrompt = buildUserPrompt(options);

    let response;
    try {
      response = await ai.models.generateContent({
        model: modelName || "gemini-3.8-flash",
        contents: userPrompt,
        config: {
          systemInstruction: systemPrompt,
          temperature: Math.min(Math.max(temperature, 0), 1),
        },
      });
    } catch (err: any) {
      const errStr = JSON.stringify(err || "");
      // If 503 high demand or quota spike, retry with gemini-2.5-flash
      if ((errStr.includes("503") || errStr.includes("high demand") || errStr.includes("UNAVAILABLE")) && modelName !== "gemini-3.6-flash") {
        console.warn("Primary model busy, falling back to gemini-3.6-flash...");
        response = await ai.models.generateContent({
          model: "gemini-3.6-flash",
          contents: userPrompt,
          config: {
            systemInstruction: systemPrompt,
            temperature: Math.min(Math.max(temperature, 0), 1),
          },
        });
      } else {
        throw err;
      }
    }

    let translated = response.text || "";

    // Clean any accidental markdown code fence wrap if model wrapped the entire output
    if (translated.startsWith("```") && translated.endsWith("```")) {
      const lines = translated.split("\n");
      if (lines.length > 2) {
        translated = lines.slice(1, -1).join("\n").trim();
      }
    }

    if (!translated.trim()) {
      throw new Error("Translation output returned an empty response from Gemini API.");
    }

    return res.json({
      success: true,
      translatedText: translated,
    });
  } catch (err: any) {
    console.error("Chunk translation error:", err);
    return res.status(500).json({
      success: false,
      error: err.message || "Failed to translate chunk with Gemini API.",
    });
  }
});

// Vite middleware setup
async function start() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`LingoNovel AI server running on http://localhost:${PORT}`);
  });
}

start();
