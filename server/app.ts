import express from 'express';
import path from 'path';
import crypto from 'crypto';
import multer from 'multer';
import dotenv from 'dotenv';
import { requireAuth, AuthenticatedRequest } from './auth.js';
import { extractTextFromBuffer } from './extractor.js';
import { generateSummary, generateQuiz, testGeminiConnection, testOpenRouterConnection } from './ai.js';
import { AI_CONFIG, getActiveGeminiApiKey, getActiveOpenRouterApiKey } from './config.js';

dotenv.config();

const app = express();
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowedExtensions = ['.pdf', '.txt', '.docx', '.doc', '.md'];
    const extension = path.extname(file.originalname).toLowerCase();
    if (
      allowedExtensions.includes(extension) ||
      file.mimetype.includes('pdf') ||
      file.mimetype.includes('text') ||
      file.mimetype.includes('word')
    ) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file format. Please upload a PDF, TXT, or DOCX document.'));
    }
  },
});

const api = express.Router();
const MAX_FIRESTORE_DOCUMENT_BYTES = 700 * 1024;
const MAX_AI_SOURCE_CHARACTERS = 120000;

function getAISettings(body: any) {
  return {
    geminiApiKey: typeof body.geminiApiKey === 'string' ? body.geminiApiKey : undefined,
    openRouterApiKey: typeof body.openRouterApiKey === 'string' ? body.openRouterApiKey : undefined,
    preferredProvider: body.preferredProvider === 'openrouter' ? 'openrouter' as const : 'gemini' as const,
    openRouterModel: typeof body.openRouterModel === 'string' ? body.openRouterModel : undefined,
  };
}

function ensureSourceText(rawText: unknown): string {
  if (typeof rawText !== 'string' || rawText.trim().length < 20) {
    throw new Error('Please choose a saved document or summary containing at least 20 characters.');
  }
  return rawText.trim().slice(0, MAX_AI_SOURCE_CHARACTERS);
}

function makeDocument(input: {
  userId: string;
  title: string;
  originalFilename: string;
  mimetype: string;
  fileSize: number;
  text: string;
  pageCount?: number;
}) {
  const text = input.text.trim();
  const document = {
    id: crypto.randomUUID(),
    userId: input.userId,
    title: input.title.trim().slice(0, 256) || 'Study Notes',
    originalFilename: input.originalFilename.slice(0, 256),
    mimetype: input.mimetype.slice(0, 128),
    fileSize: input.fileSize,
    wordCount: text.split(/\s+/).filter(Boolean).length,
    characterCount: text.length,
    pageCount: input.pageCount,
    extractedText: text,
    snippet: text.slice(0, 300).replace(/\s+/g, ' ') + (text.length > 300 ? '...' : ''),
    createdAt: new Date().toISOString(),
  };

  // Firestore documents are limited to 1 MiB. Keep headroom for UTF-8
  // expansion and the document metadata/security-rule fields.
  if (Buffer.byteLength(JSON.stringify(document), 'utf8') > MAX_FIRESTORE_DOCUMENT_BYTES) {
    throw new Error('This document contains too much extracted text to store safely in Firestore. Please split it into smaller chapters and upload them separately.');
  }

  return document;
}

api.get('/health', (_req, res) => {
  res.json({ success: true, service: 'studymate-api', timestamp: new Date().toISOString() });
});

api.get('/config/status', (_req, res) => {
  res.json({
    geminiAvailable: Boolean(getActiveGeminiApiKey()),
    openRouterEnvAvailable: Boolean(getActiveOpenRouterApiKey()),
    port: AI_CONFIG.PORT,
    timestamp: new Date().toISOString(),
  });
});

api.post('/config/test-gemini', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const result = await testGeminiConnection(req.body.apiKey);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Gemini connection failed.' });
  }
});

api.post('/config/test-openrouter', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const apiKey = req.body.apiKey || process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return res.status(400).json({ error: 'Please provide an OpenRouter API key to test.' });
    }
    const result = await testOpenRouterConnection(apiKey, req.body.model);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'OpenRouter connection failed.' });
  }
});

// Extract document text only. The client writes the returned document to
// users/{uid}/documents/{documentId} in Firestore under the user's Firebase Auth.
api.post('/documents/upload', requireAuth, (req: AuthenticatedRequest, res) => {
  upload.single('file')(req, res, async (uploadError) => {
    if (uploadError) {
      return res.status(400).json({ error: uploadError.message || 'File upload failed.' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'Please choose a document to upload.' });
    }

    try {
      const extracted = await extractTextFromBuffer(
        req.file.buffer,
        req.file.mimetype,
        req.file.originalname
      );
      const document = makeDocument({
        userId: req.user!.id,
        title: req.body.title?.trim() || req.file.originalname.replace(/\.[^/.]+$/, ''),
        originalFilename: req.file.originalname,
        mimetype: req.file.mimetype,
        fileSize: req.file.size,
        text: extracted.text,
        pageCount: extracted.pageCount,
      });
      res.status(201).json({ document });
    } catch (error: any) {
      const tooLarge = String(error.message || '').includes('too much extracted text');
      res.status(tooLarge ? 413 : 422).json({ error: error.message || 'Could not extract document text.' });
    }
  });
});

api.post('/documents/paste', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const text = typeof req.body.text === 'string' ? req.body.text.trim() : '';
    if (text.length < 20) throw new Error('Please enter at least 20 characters of study notes.');
    const document = makeDocument({
      userId: req.user!.id,
      title: req.body.title || 'Pasted Study Notes',
      originalFilename: 'pasted_notes.txt',
      mimetype: 'text/plain',
      fileSize: Buffer.byteLength(text, 'utf8'),
      text,
    });
    res.status(201).json({ document });
  } catch (error: any) {
    const tooLarge = String(error.message || '').includes('too much extracted text');
    res.status(tooLarge ? 413 : 400).json({ error: error.message || 'Could not save pasted notes.' });
  }
});

api.post('/summaries/generate', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const rawText = ensureSourceText(req.body.rawText);
    const validTypes = ['concise', 'standard', 'detailed', 'very_detailed'];
    const summaryType: 'concise' | 'standard' | 'detailed' | 'very_detailed' = validTypes.includes(req.body.summaryType) ? req.body.summaryType : 'standard';
    const title = String(req.body.title || 'Study Summary').trim().slice(0, 256);
    const result = await generateSummary({
      text: rawText,
      title,
      summaryType,
      ...getAISettings(req.body),
    });

    const summary = {
      id: crypto.randomUUID(),
      userId: req.user!.id,
      documentId: typeof req.body.documentId === 'string' ? req.body.documentId : undefined,
      title: `${title} (${summaryType.replace('_', ' ').toUpperCase()})`,
      summaryType,
      content: result.content,
      keyPoints: result.keyPoints.slice(0, 8),
      wordCount: result.wordCount,
      createdAt: new Date().toISOString(),
    };

    res.status(201).json({
      summary,
      providerUsed: result.providerUsed,
      modelUsed: result.modelUsed,
    });
  } catch (error: any) {
    console.error('Summary generation failed:', error);
    res.status(400).json({ error: error.message || 'Could not generate the summary.' });
  }
});

api.post('/quizzes/generate', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const rawText = ensureSourceText(req.body.rawText);
    const questionCount = [5, 10, 15, 20].includes(Number(req.body.questionCount))
      ? Number(req.body.questionCount)
      : 5;
    const difficulty: 'easy' | 'medium' | 'hard' = ['easy', 'medium', 'hard'].includes(req.body.difficulty)
      ? req.body.difficulty
      : 'medium';
    const questionType: 'multiple_choice' | 'true_false' | 'mixed' = ['multiple_choice', 'true_false', 'mixed'].includes(req.body.questionType)
      ? req.body.questionType
      : 'multiple_choice';
    const title = String(req.body.title || 'Subject Mastery Quiz').trim().slice(0, 256);

    const result = await generateQuiz({
      text: rawText,
      title,
      questionCount,
      difficulty,
      questionType,
      ...getAISettings(req.body),
    });

    const quiz = {
      id: crypto.randomUUID(),
      userId: req.user!.id,
      documentId: typeof req.body.documentId === 'string' ? req.body.documentId : undefined,
      summaryId: typeof req.body.summaryId === 'string' ? req.body.summaryId : undefined,
      title: result.title || title,
      difficulty,
      questionCount: result.questions.length,
      questionType,
      questions: result.questions.slice(0, 50),
      createdAt: new Date().toISOString(),
    };

    res.status(201).json({
      quiz,
      providerUsed: result.providerUsed,
      modelUsed: result.modelUsed,
    });
  } catch (error: any) {
    console.error('Quiz generation failed:', error);
    res.status(400).json({ error: error.message || 'Could not generate the quiz.' });
  }
});

// Score against the quiz passed by the authenticated owner. The result is
// returned to the client and persisted in the owner's Firestore subcollection.
api.post('/quizzes/:id/submit', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const quiz = req.body.quiz;
    const userAnswers = req.body.userAnswers;
    if (!quiz || quiz.id !== req.params.id || quiz.userId !== req.user!.id || !Array.isArray(quiz.questions)) {
      return res.status(400).json({ error: 'The quiz data does not match the signed-in account.' });
    }
    if (quiz.questions.length < 1 || quiz.questions.length > 50 || !userAnswers || typeof userAnswers !== 'object') {
      return res.status(400).json({ error: 'Quiz submission data is invalid.' });
    }

    let score = 0;
    const detailedFeedback = quiz.questions.map((question: any) => {
      const selected = userAnswers[question.id];
      const isCorrect = Number.isInteger(selected) && selected === question.correctAnswerIndex;
      if (isCorrect) score += 1;
      return {
        questionId: question.id,
        question: question.question,
        options: question.options,
        userSelected: Number.isInteger(selected) ? selected : undefined,
        correctAnswerIndex: question.correctAnswerIndex,
        isCorrect,
        explanation: question.explanation,
      };
    });

    const totalQuestions = quiz.questions.length;
    const percentage = Math.round((score / totalQuestions) * 100);
    const attempt = {
      id: crypto.randomUUID(),
      userId: req.user!.id,
      quizId: quiz.id,
      quizTitle: String(quiz.title || 'StudyMate Quiz').slice(0, 256),
      score,
      totalQuestions,
      percentage,
      userAnswers,
      timeSpentSeconds: Math.max(0, Number(req.body.timeSpentSeconds) || 0),
      completedAt: new Date().toISOString(),
    };

    res.status(201).json({ attempt, score, totalQuestions, percentage, detailedFeedback });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Could not score this quiz attempt.' });
  }
});

app.use('/api', api);
app.use(api);

export default app;
