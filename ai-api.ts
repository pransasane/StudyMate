/**
 * ==============================================================================
 * StudyMate AI API - Google Gemini Integration Module
 * ==============================================================================
 *
 * This file provides a complete, standalone, production-grade interface for
 * Google's modern `@google/genai` TypeScript SDK using the official `gemini-3.6-flash`
 * model.
 *
 * Designed for immediate use in GitHub repositories, local development,
 * and production deployments (Cloud Run, Vercel, Docker, VPS).
 *
 * SETUP INSTRUCTIONS:
 * 1. Ensure `@google/genai` and `dotenv` are installed:
 *      npm install @google/genai dotenv
 * 2. Set your Google Gemini API key:
 *      - In .env file:
 *          GEMINI_API_KEY="AIzaSy..."
 *      - Or in terminal:
 *          export GEMINI_API_KEY="AIzaSy..."
 * 3. Run standalone test:
 *      npx tsx ai-api.ts
 * ==============================================================================
 */

import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

// Load environment variables (.env file)
dotenv.config();

/**
 * Standard AI Model Configuration
 * Uses 'gemini-3.6-flash' as recommended by the Google GenAI SDK for high-speed,
 * high-accuracy text summarization, reasoning, and quiz generation.
 */
export const AI_MODELS = {
  PRIMARY: 'gemini-3.6-flash',
  FAST: 'gemini-3.6-flash',
  LITE: 'gemini-3.1-flash-lite',
} as const;

/**
 * Resolves the active Gemini API key from environment or an optional per-request override.
 */
export function getGeminiApiKey(customKey?: string): string {
  const key = customKey?.trim() || process.env.GEMINI_API_KEY?.trim() || '';
  return key;
}

/**
 * Initialize a GoogleGenAI client instance with the resolved API key.
 */
export function createGeminiClient(customApiKey?: string): GoogleGenAI {
  const apiKey = getGeminiApiKey(customApiKey);
  if (!apiKey) {
    throw new Error(
      'Google Gemini API Key is missing. Please set GEMINI_API_KEY in your .env file or environment variables.'
    );
  }
  return new GoogleGenAI({ apiKey });
}

// -----------------------------------------------------------------------------
// Type Definitions
// -----------------------------------------------------------------------------

export type SummaryTier = 'concise' | 'standard' | 'detailed' | 'very_detailed';

export interface GenerateSummaryParams {
  text: string;
  title: string;
  summaryType?: SummaryTier;
  customApiKey?: string;
}

export interface SummaryOutput {
  content: string;
  keyPoints: string[];
  wordCount: number;
  model: string;
}

export type QuizDifficulty = 'easy' | 'medium' | 'hard';
export type QuestionType = 'multiple_choice' | 'true_false' | 'mixed';

export interface QuizQuestionItem {
  id: string;
  question: string;
  type: 'multiple_choice' | 'true_false';
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
  topic?: string;
}

export interface GenerateQuizParams {
  text: string;
  title: string;
  questionCount?: number;
  difficulty?: QuizDifficulty;
  questionType?: QuestionType;
  customApiKey?: string;
}

export interface QuizOutput {
  title: string;
  questions: QuizQuestionItem[];
  model: string;
}

export interface FlashcardItem {
  front: string;
  back: string;
  tag: string;
}

// -----------------------------------------------------------------------------
// Helper: Clean JSON Output
// -----------------------------------------------------------------------------

function extractJsonFromModelResponse(rawText: string): string {
  let cleaned = rawText.trim();
  // Strip Markdown code fences
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/i, '').replace(/\s*```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }
  cleaned = cleaned.trim();

  // Extract from outer brackets if extra commentary exists
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return cleaned.slice(firstBrace, lastBrace + 1).trim();
  }

  const firstSquare = cleaned.indexOf('[');
  const lastSquare = cleaned.lastIndexOf(']');
  if (firstSquare !== -1 && lastSquare !== -1 && lastSquare > firstSquare) {
    return cleaned.slice(firstSquare, lastSquare + 1).trim();
  }

  return cleaned;
}

// -----------------------------------------------------------------------------
// Core AI API Functions
// -----------------------------------------------------------------------------

/**
 * 1. Test Gemini API Connectivity
 */
export async function testGeminiApi(customApiKey?: string): Promise<{ success: boolean; model: string; message: string }> {
  const ai = createGeminiClient(customApiKey);
  const model = AI_MODELS.PRIMARY;

  const response = await ai.models.generateContent({
    model,
    contents: 'Respond with exactly: OK_STUDYMATE',
  });

  const reply = response.text?.trim() || '';
  return {
    success: true,
    model,
    message: `Gemini API connected successfully using model ${model}. Response: ${reply}`,
  };
}

/**
 * 2. Generate Structured Multi-Tier Summary
 */
export async function generateSummaryWithGemini(params: GenerateSummaryParams): Promise<SummaryOutput> {
  const { text, title, summaryType = 'standard', customApiKey } = params;
  const ai = createGeminiClient(customApiKey);
  const model = AI_MODELS.PRIMARY;

  const lengthInstructions: Record<SummaryTier, string> = {
    concise: 'Generate a CONCISE, high-yield summary (~350 to 450 words) targeting core concepts and quick review.',
    standard: 'Generate a STANDARD, balanced academic summary (~700 to 950 words) with clear explanations and highlights.',
    detailed: 'Generate a DETAILED, rigorous academic breakdown (~1,100 to 1,500 words) covering topics in-depth, derivations, and applications.',
    very_detailed: 'Generate an EXHAUSTIVE, textbook-grade master study guide (~1,600 to 2,200 words) systematically dissecting every concept, formula, nuances, and edge cases.',
  };

  const systemInstruction = `You are StudyMate AI, an expert academic tutor.
Your mission is to convert the user's study material into an impeccably organized, accurate, and easy-to-learn study guide.
Rules:
1. Ground your summary strictly in the provided text. Do not invent facts.
2. Structure your summary with the exact following Markdown sections:
   ## 1. Introduction and Overview
   ## 2. Topic-Wise Explanations
   ## 3. Important Concepts and Definitions
   ## 4. Key Points & Takeaways
   ## 5. Examples and Formulas (Include relevant formulas, equations, or concrete scenarios from text; if none exist, state 'None provided in text')
   ## 6. Quick Revision Notes (High-yield bullet points for fast exam prep)
   ## 7. Conclusion
3. Highlight critical technical terms in **bold**.
4. At the very end, append a JSON block on a new line with 5-8 bullet takeaways in this format:
<!--KEY_POINTS_JSON
["takeaway 1", "takeaway 2", "takeaway 3", "takeaway 4", "takeaway 5"]
KEY_POINTS_JSON-->`;

  const prompt = `${lengthInstructions[summaryType]}

DOCUMENT TITLE: ${title}

STUDY MATERIAL:
${text.slice(0, 120000)}

Please generate the comprehensive study summary now.`;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      systemInstruction,
      temperature: 0.2,
    },
  });

  const fullText = response.text || '';

  // Extract key points from the tag
  let keyPoints: string[] = [];
  const keyPointsMatch = fullText.match(/<!--KEY_POINTS_JSON\s*([\s\S]*?)\s*KEY_POINTS_JSON-->/);
  if (keyPointsMatch && keyPointsMatch[1]) {
    try {
      keyPoints = JSON.parse(keyPointsMatch[1]);
    } catch {
      keyPoints = [];
    }
  }

  // Clean the main markdown content
  const cleanContent = fullText.replace(/<!--KEY_POINTS_JSON[\s\S]*?KEY_POINTS_JSON-->/, '').trim();
  const wordCount = cleanContent.split(/\s+/).filter(Boolean).length;

  return {
    content: cleanContent,
    keyPoints: keyPoints.length > 0 ? keyPoints : [
      `Review key definitions from ${title}`,
      `Understand core principles and their applications`,
      `Practice exam-style recall based on key formulas`,
    ],
    wordCount,
    model,
  };
}

/**
 * 3. Generate Interactive Mastery Quiz
 */
export async function generateQuizWithGemini(params: GenerateQuizParams): Promise<QuizOutput> {
  const {
    text,
    title,
    questionCount = 5,
    difficulty = 'medium',
    questionType = 'multiple_choice',
    customApiKey,
  } = params;

  const ai = createGeminiClient(customApiKey);
  const model = AI_MODELS.PRIMARY;

  const systemInstruction = `You are StudyMate AI Quiz Engine, an expert exam creator.
Your goal is to generate high-quality, pedagogically sound questions that test conceptual understanding, critical thinking, and factual recall.

CRITICAL INSTRUCTIONS:
1. Return ONLY a valid JSON object matching this schema:
{
  "title": "${title} Quiz",
  "questions": [
    {
      "id": "q_1",
      "question": "Clear, precise question text?",
      "type": "multiple_choice",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswerIndex": 0,
      "explanation": "Detailed explanation of why Option A is correct and why other choices are incorrect.",
      "topic": "Topic or Concept Name"
    }
  ]
}
2. For multiple_choice questions, provide exactly 4 realistic options with 1 unambiguous correct answer.
3. For true_false questions, options must be ["True", "False"], and correctAnswerIndex must be 0 (True) or 1 (False).
4. For mixed, provide a healthy balance of multiple_choice and true_false questions.
5. Difficulty level: ${difficulty}. Ground all questions strictly in the provided text.
6. Return JSON only, with no markdown code blocks and no surrounding commentary.`;

  const prompt = `Generate exactly ${questionCount} ${questionType} quiz questions (${difficulty} difficulty) based on this study text:

DOCUMENT TITLE: ${title}

STUDY MATERIAL:
${text.slice(0, 100000)}`;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      systemInstruction,
      responseMimeType: 'application/json',
      temperature: 0.2,
    },
  });

  const rawJson = response.text || '{}';
  const cleaned = extractJsonFromModelResponse(rawJson);
  const parsed = JSON.parse(cleaned);

  const formattedQuestions: QuizQuestionItem[] = (parsed.questions || []).map((q: any, idx: number) => ({
    id: q.id || `q_${idx + 1}`,
    question: q.question || 'Question text',
    type: q.type === 'true_false' ? 'true_false' : 'multiple_choice',
    options: Array.isArray(q.options) && q.options.length >= 2 ? q.options : ['True', 'False'],
    correctAnswerIndex: typeof q.correctAnswerIndex === 'number' ? q.correctAnswerIndex : 0,
    explanation: q.explanation || 'Refer to the source document for more details.',
    topic: q.topic || 'General Comprehension',
  }));

  return {
    title: parsed.title || `${title} Quiz`,
    questions: formattedQuestions,
    model,
  };
}

/**
 * 4. Generate Study Flashcards
 */
export async function generateFlashcardsWithGemini(
  text: string,
  count = 10,
  customApiKey?: string
): Promise<FlashcardItem[]> {
  const ai = createGeminiClient(customApiKey);
  const model = AI_MODELS.PRIMARY;

  const prompt = `Create exactly ${count} high-yield study flashcards from the text below.
Return ONLY a valid JSON array of objects with keys: "front" (question or concept), "back" (concise, clear answer or definition), and "tag" (subject/subtopic).

STUDY TEXT:
${text.slice(0, 60000)}`;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      temperature: 0.2,
    },
  });

  const raw = response.text || '[]';
  const cleaned = extractJsonFromModelResponse(raw);
  return JSON.parse(cleaned) as FlashcardItem[];
}

/**
 * 5. Interactive Document Q&A / Tutor Chat
 */
export async function askDocumentQuestion(
  documentText: string,
  userQuestion: string,
  chatHistory: Array<{ role: 'user' | 'model'; parts: string }> = [],
  customApiKey?: string
): Promise<string> {
  const ai = createGeminiClient(customApiKey);
  const model = AI_MODELS.PRIMARY;

  const systemInstruction = `You are StudyMate AI, a patient and knowledgeable tutor.
Answer the student's question based strictly on the provided study document text.
If the answer cannot be found in the document, clarify what is covered in the text and politely state what information is missing.

DOCUMENT CONTEXT:
${documentText.slice(0, 100000)}`;

  const contents = [
    ...chatHistory.map((msg) => ({
      role: msg.role,
      parts: [{ text: msg.parts }],
    })),
    {
      role: 'user',
      parts: [{ text: userQuestion }],
    },
  ];

  const response = await ai.models.generateContent({
    model,
    contents: contents as any,
    config: {
      systemInstruction,
      temperature: 0.3,
    },
  });

  return response.text?.trim() || 'No answer generated.';
}

// -----------------------------------------------------------------------------
// Standalone CLI Verification
// Run: npx tsx ai-api.ts
// -----------------------------------------------------------------------------
if (import.meta.url === `file://${process.argv[1]}`) {
  (async () => {
    console.log('----------------------------------------------------');
    console.log('  StudyMate AI API - Gemini Verification Runner     ');
    console.log('----------------------------------------------------');

    const key = getGeminiApiKey();
    if (!key) {
      console.warn('⚠️  Warning: GEMINI_API_KEY environment variable is not set.');
      console.log('👉 Please set GEMINI_API_KEY in your .env file or environment.');
      process.exit(0);
    }

    try {
      console.log('Connecting to Gemini API using model:', AI_MODELS.PRIMARY);
      const testResult = await testGeminiApi();
      console.log('✅ Connection test passed!', testResult.message);

      console.log('\nTesting Quick Summary generation...');
      const sampleText = `Photosynthesis is a biological process used by plants and other organisms to convert light energy into chemical energy that, through cellular respiration, can later be released to fuel the organism's activities. Some of this chemical energy is stored in carbohydrate molecules, such as sugars and starches, which are synthesized from carbon dioxide and water. In most cases, oxygen is also released as a waste product. Most plants, algae, and cyanobacteria perform photosynthesis; such organisms are called photoautotrophs. Photosynthesis is largely responsible for producing and maintaining the oxygen content of the Earth's atmosphere, and supplies most of the energy necessary for life on Earth.`;

      const summary = await generateSummaryWithGemini({
        text: sampleText,
        title: 'Photosynthesis Fundamentals',
        summaryType: 'concise',
      });

      console.log('✅ Summary generated successfully!');
      console.log('Word count:', summary.wordCount);
      console.log('Key points extracted:', summary.keyPoints);
      console.log('\nPreview:\n', summary.content.slice(0, 300), '...\n');

      console.log('✨ All AI API operations verified successfully.');
    } catch (err: any) {
      console.error('❌ AI API Verification Error:', err.message);
    }
  })();
}
