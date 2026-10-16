import express from 'express';
import path from 'path';
import multer from 'multer';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { db } from './server/db.js';
import { requireAuth, hashPassword, verifyPassword, generateToken, sanitizeUser, AuthenticatedRequest } from './server/auth.js';
import { extractTextFromBuffer } from './server/extractor.js';
import { generateSummary, generateQuiz, testGeminiConnection, testOpenRouterConnection } from './server/ai.js';
import { seedDemoDataIfEmpty } from './server/seed.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isProduction = process.env.NODE_ENV === 'production';
const PORT = 3000;

// Multer memory storage for clean in-memory buffer text extraction
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024, // 25 MB
  },
  fileFilter: (_req, file, cb) => {
    const allowedExts = ['.pdf', '.txt', '.docx', '.doc', '.md'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExts.includes(ext) || file.mimetype.includes('pdf') || file.mimetype.includes('text') || file.mimetype.includes('word')) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file format. Please upload a PDF, TXT, or DOCX file.'));
    }
  },
});

async function startServer() {
  const app = express();

  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true, limit: '15mb' }));

  // Seed demo data on start
  try {
    seedDemoDataIfEmpty();
  } catch (err) {
    console.error('Error seeding demo data:', err);
  }

  // --- API Routes ---

  // Health / Config status
  app.get('/api/config/status', async (req: AuthenticatedRequest, res) => {
    const hasGemini = Boolean(process.env.GEMINI_API_KEY);
    const hasOpenRouterEnv = Boolean(process.env.OPENROUTER_API_KEY);
    res.json({
      geminiAvailable: hasGemini,
      openRouterEnvAvailable: hasOpenRouterEnv,
      port: PORT,
      timestamp: new Date().toISOString(),
    });
  });

  // Test Gemini connection
  app.post('/api/config/test-gemini', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const customKey = req.body.apiKey || req.user?.geminiApiKey;
      const result = await testGeminiConnection(customKey);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Gemini connection failed' });
    }
  });

  // Test OpenRouter connection
  app.post('/api/config/test-openrouter', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const apiKey = req.body.apiKey || req.user?.openRouterApiKey || process.env.OPENROUTER_API_KEY;
      if (!apiKey) {
        return res.status(400).json({ error: 'Please provide an OpenRouter API key to test.' });
      }
      const result = await testOpenRouterConnection(apiKey, req.body.model || req.user?.openRouterModel);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'OpenRouter connection failed' });
    }
  });

  // Auth: Register
  app.post('/api/auth/register', async (req: AuthenticatedRequest, res) => {
    try {
      const { email, password, fullName, educationLevel } = req.body;
      if (!email || !password || !fullName) {
        return res.status(400).json({ error: 'Please provide full name, email, and password.' });
      }
      if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
      }

      const existing = await db.getUserByEmail(email);
      if (existing) {
        return res.status(400).json({ error: 'An account with this email already exists. Please log in.' });
      }

      const user = await db.createUser({
        email: email.trim().toLowerCase(),
        passwordHash: hashPassword(password),
        fullName: fullName.trim(),
        educationLevel: educationLevel ? educationLevel.trim() : undefined,
        preferredProvider: process.env.GEMINI_API_KEY ? 'gemini' : 'openrouter',
        openRouterModel: 'google/gemini-2.0-flash-001',
      });

      const token = generateToken(user);
      res.status(201).json({
        token,
        user: sanitizeUser(user),
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Registration failed' });
    }
  });

  // Auth: Login
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
      }

      const user = await db.getUserByEmail(email);
      if (!user || !verifyPassword(password, user.passwordHash)) {
        return res.status(401).json({ error: 'Invalid email or password. Please try again.' });
      }

      const token = generateToken(user);
      res.json({
        token,
        user: sanitizeUser(user),
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Login failed' });
    }
  });

  // Auth: Me
  app.get('/api/auth/me', requireAuth, async (req: AuthenticatedRequest, res) => {
    res.json({ user: sanitizeUser(req.user!) });
  });

  // Auth: Password Reset
  app.post('/api/auth/reset-password', async (req, res) => {
    try {
      const { email, newPassword } = req.body;
      if (!email || !newPassword) {
        return res.status(400).json({ error: 'Email and new password are required.' });
      }
      if (newPassword.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
      }

      const user = await db.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ error: 'No account found with this email address.' });
      }

      await db.updateUser(user.id, {
        passwordHash: hashPassword(newPassword),
      });

      res.json({ success: true, message: 'Password has been reset successfully. You can now log in.' });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Password reset failed' });
    }
  });

  // Auth: User Settings (Gemini Key, OpenRouter Key, Model, Preferences)
  app.put('/api/auth/settings', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { fullName, educationLevel, geminiApiKey, openRouterApiKey, preferredProvider, openRouterModel } = req.body;
      const updates: any = {};

      if (fullName !== undefined) updates.fullName = fullName.trim();
      if (educationLevel !== undefined) updates.educationLevel = educationLevel.trim();
      if (geminiApiKey !== undefined) updates.geminiApiKey = geminiApiKey.trim();
      if (openRouterApiKey !== undefined) updates.openRouterApiKey = openRouterApiKey.trim();
      if (preferredProvider !== undefined) updates.preferredProvider = preferredProvider;
      if (openRouterModel !== undefined) updates.openRouterModel = openRouterModel.trim();

      const updated = await db.updateUser(req.user!.id, updates);
      res.json({ user: sanitizeUser(updated!) });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to update settings' });
    }
  });

  // Dashboard Stats
  app.get('/api/dashboard/stats', requireAuth, async (req: AuthenticatedRequest, res) => {
    const stats = await db.getUserStats(req.user!.id);
    res.json(stats);
  });

  // Document Upload
  app.post('/api/documents/upload', requireAuth, async (req: AuthenticatedRequest, res) => {
    upload.single('file')(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ error: err.message || 'File upload error.' });
      }

      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded. Please select a PDF, TXT, or DOCX file.' });
      }

      try {
        const extracted = await extractTextFromBuffer(
          req.file.buffer,
          req.file.mimetype,
          req.file.originalname
        );

        const customTitle = req.body.title?.trim() || req.file.originalname.replace(/\.[^/.]+$/, '');

        const doc = await db.createDocument({
          userId: req.user!.id,
          title: customTitle,
          originalFilename: req.file.originalname,
          mimetype: req.file.mimetype,
          fileSize: req.file.size,
          wordCount: extracted.wordCount,
          characterCount: extracted.characterCount,
          pageCount: extracted.pageCount,
          extractedText: extracted.text,
          snippet: extracted.snippet,
        });

        res.status(201).json({ document: doc });
      } catch (extractErr: any) {
        res.status(422).json({ error: extractErr.message || 'Failed to process document content.' });
      }
    });
  });

  // Direct Text Paste Document
  app.post('/api/documents/paste', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { title, text } = req.body;
      if (!text || text.trim().length < 20) {
        return res.status(400).json({ error: 'Please enter at least 20 characters of study notes or text.' });
      }

      const cleanText = text.trim();
      const words = cleanText.split(/\s+/).filter(Boolean);
      const snippet = cleanText.slice(0, 300).replace(/\s+/g, ' ') + (cleanText.length > 300 ? '...' : '');

      const doc = await db.createDocument({
        userId: req.user!.id,
        title: title?.trim() || 'Pasted Notes ' + new Date().toLocaleDateString(),
        originalFilename: 'pasted_notes.txt',
        mimetype: 'text/plain',
        fileSize: Buffer.byteLength(cleanText, 'utf8'),
        wordCount: words.length,
        characterCount: cleanText.length,
        extractedText: cleanText,
        snippet,
      });

      res.status(201).json({ document: doc });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to create document' });
    }
  });

  // List Documents
  app.get('/api/documents', requireAuth, async (req: AuthenticatedRequest, res) => {
    const docs = await db.getDocuments(req.user!.id);
    res.json({ documents: docs });
  });

  // Get Document
  app.get('/api/documents/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
    const doc = await db.getDocumentById(req.params.id, req.user!.id);
    if (!doc) {
      return res.status(404).json({ error: 'Document not found.' });
    }
    res.json({ document: doc });
  });

  // Delete Document
  app.delete('/api/documents/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
    const success = await db.deleteDocument(req.params.id, req.user!.id);
    if (!success) {
      return res.status(404).json({ error: 'Document not found or already deleted.' });
    }
    res.json({ success: true, message: 'Document deleted successfully.' });
  });

  // Generate Summary
  app.post('/api/summaries/generate', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { documentId, rawText, title, summaryType } = req.body;
      let textToSummarize = '';
      let effectiveTitle = title || 'Study Summary';

      if (documentId) {
        const doc = await db.getDocumentById(documentId, req.user!.id);
        if (!doc) {
          return res.status(404).json({ error: 'Source document not found.' });
        }
        textToSummarize = doc.extractedText;
        if (!title) effectiveTitle = doc.title;
      } else if (rawText && rawText.trim().length >= 20) {
        textToSummarize = rawText.trim();
      } else {
        return res.status(400).json({ error: 'Please select a document or provide text to summarize.' });
      }

      const validSummaryType = ['concise', 'standard', 'detailed', 'very_detailed'].includes(summaryType)
        ? summaryType
        : 'standard';

      const user = req.user!;
      const result = await generateSummary({
        text: textToSummarize,
        title: effectiveTitle,
        summaryType: validSummaryType,
        geminiApiKey: user.geminiApiKey,
        openRouterApiKey: user.openRouterApiKey,
        preferredProvider: user.preferredProvider,
        openRouterModel: user.openRouterModel,
      });

      const summary = await db.createSummary({
        userId: user.id,
        documentId: documentId || undefined,
        title: `${effectiveTitle} (${validSummaryType.replace('_', ' ').toUpperCase()})`,
        summaryType: validSummaryType,
        content: result.content,
        keyPoints: result.keyPoints,
        wordCount: result.wordCount,
      });

      res.status(201).json({
        summary,
        providerUsed: result.providerUsed,
        modelUsed: result.modelUsed,
      });
    } catch (err: any) {
      console.error('Summary generation error:', err);
      res.status(500).json({
        error: err.message || 'Failed to generate summary. Please check your API configuration.',
      });
    }
  });

  // List Summaries
  app.get('/api/summaries', requireAuth, async (req: AuthenticatedRequest, res) => {
    const summaries = await db.getSummaries(req.user!.id);
    res.json({ summaries });
  });

  // Get Summary
  app.get('/api/summaries/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
    const summary = await db.getSummaryById(req.params.id, req.user!.id);
    if (!summary) {
      return res.status(404).json({ error: 'Summary not found.' });
    }
    res.json({ summary });
  });

  // Delete Summary
  app.delete('/api/summaries/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
    const success = await db.deleteSummary(req.params.id, req.user!.id);
    if (!success) {
      return res.status(404).json({ error: 'Summary not found.' });
    }
    res.json({ success: true, message: 'Summary deleted successfully.' });
  });

  // Generate Quiz
  app.post('/api/quizzes/generate', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { documentId, summaryId, rawText, title, questionCount, difficulty, questionType } = req.body;
      let textForQuiz = '';
      let effectiveTitle = title || 'Subject Mastery Quiz';

      if (documentId) {
        const doc = await db.getDocumentById(documentId, req.user!.id);
        if (!doc) return res.status(404).json({ error: 'Document not found.' });
        textForQuiz = doc.extractedText;
        if (!title) effectiveTitle = doc.title.endsWith('Quiz') ? doc.title : `${doc.title} Quiz`;
      } else if (summaryId) {
        const summary = await db.getSummaryById(summaryId, req.user!.id);
        if (!summary) return res.status(404).json({ error: 'Summary not found.' });
        textForQuiz = summary.content;
        if (!title) effectiveTitle = summary.title.endsWith('Quiz') ? summary.title : `${summary.title} Quiz`;
      } else if (rawText && rawText.trim().length >= 20) {
        textForQuiz = rawText.trim();
      } else {
        return res.status(400).json({ error: 'Please choose a document, summary, or provide study text.' });
      }

      const numQuestions = [5, 10, 15, 20].includes(Number(questionCount)) ? Number(questionCount) : 5;
      const diff = ['easy', 'medium', 'hard'].includes(difficulty) ? difficulty : 'medium';
      const qType = ['multiple_choice', 'true_false', 'mixed'].includes(questionType) ? questionType : 'multiple_choice';

      const user = req.user!;
      const result = await generateQuiz({
        text: textForQuiz,
        title: effectiveTitle,
        questionCount: numQuestions,
        difficulty: diff,
        questionType: qType,
        geminiApiKey: user.geminiApiKey,
        openRouterApiKey: user.openRouterApiKey,
        preferredProvider: user.preferredProvider,
        openRouterModel: user.openRouterModel,
      });

      const quiz = await db.createQuiz({
        userId: user.id,
        documentId: documentId || undefined,
        summaryId: summaryId || undefined,
        title: result.title || effectiveTitle,
        difficulty: diff,
        questionCount: result.questions.length,
        questionType: qType,
        questions: result.questions,
      });

      res.status(201).json({
        quiz,
        providerUsed: result.providerUsed,
        modelUsed: result.modelUsed,
      });
    } catch (err: any) {
      console.error('Quiz generation error:', err);
      res.status(500).json({
        error: err.message || 'Failed to generate quiz. Please check your API configuration.',
      });
    }
  });

  // List Quizzes
  app.get('/api/quizzes', requireAuth, async (req: AuthenticatedRequest, res) => {
    const quizzes = await db.getQuizzes(req.user!.id);
    res.json({ quizzes });
  });

  // Get Quiz
  app.get('/api/quizzes/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
    const quiz = await db.getQuizById(req.params.id, req.user!.id);
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found.' });
    }
    res.json({ quiz });
  });

  // Delete Quiz
  app.delete('/api/quizzes/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
    const success = await db.deleteQuiz(req.params.id, req.user!.id);
    if (!success) {
      return res.status(404).json({ error: 'Quiz not found.' });
    }
    res.json({ success: true, message: 'Quiz deleted successfully.' });
  });

  // Submit Quiz Attempt
  app.post('/api/quizzes/:id/submit', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const quiz = await db.getQuizById(req.params.id, req.user!.id);
      if (!quiz) {
        return res.status(404).json({ error: 'Quiz not found.' });
      }

      const { userAnswers, timeSpentSeconds } = req.body;
      if (!userAnswers || typeof userAnswers !== 'object') {
        return res.status(400).json({ error: 'Missing user answers.' });
      }

      let score = 0;
      const totalQuestions = quiz.questions.length;
      const detailedFeedback: Array<{
        questionId: string;
        question: string;
        options: string[];
        userSelected: number | undefined;
        correctAnswerIndex: number;
        isCorrect: boolean;
        explanation: string;
      }> = [];

      quiz.questions.forEach((q) => {
        const userChoice = userAnswers[q.id];
        const isCorrect = userChoice === q.correctAnswerIndex;
        if (isCorrect) score += 1;

        detailedFeedback.push({
          questionId: q.id,
          question: q.question,
          options: q.options,
          userSelected: userChoice,
          correctAnswerIndex: q.correctAnswerIndex,
          isCorrect,
          explanation: q.explanation,
        });
      });

      const percentage = Math.round((score / totalQuestions) * 100);

      const attempt = await db.createQuizAttempt({
        userId: req.user!.id,
        quizId: quiz.id,
        quizTitle: quiz.title,
        score,
        totalQuestions,
        percentage,
        userAnswers,
        timeSpentSeconds: Number(timeSpentSeconds) || 0,
      });

      res.status(201).json({
        attempt,
        score,
        totalQuestions,
        percentage,
        detailedFeedback,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to submit quiz attempt.' });
    }
  });

  // Get Attempts for Quiz
  app.get('/api/quizzes/:id/attempts', requireAuth, async (req: AuthenticatedRequest, res) => {
    const attempts = await db.getAttemptsForQuiz(req.params.id, req.user!.id);
    res.json({ attempts });
  });

  // Get All Attempts
  app.get('/api/attempts', requireAuth, async (req: AuthenticatedRequest, res) => {
    const attempts = await db.getQuizAttempts(req.user!.id);
    res.json({ attempts });
  });

  // --- Frontend Integration ---
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`StudyMate server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
