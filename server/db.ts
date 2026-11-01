import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  fullName: string;
  educationLevel?: string;
  geminiApiKey?: string;
  openRouterApiKey?: string;
  preferredProvider?: 'openrouter' | 'gemini';
  openRouterModel?: string;
  createdAt: string;
}

export interface Document {
  id: string;
  userId: string;
  title: string;
  originalFilename: string;
  mimetype: string;
  fileSize: number;
  wordCount: number;
  characterCount: number;
  pageCount?: number;
  extractedText: string;
  snippet: string;
  createdAt: string;
}

export interface Summary {
  id: string;
  userId: string;
  documentId?: string;
  title: string;
  summaryType: 'concise' | 'standard' | 'detailed' | 'very_detailed';
  content: string;
  keyPoints: string[];
  wordCount: number;
  createdAt: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  type: 'multiple_choice' | 'true_false';
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
  topic?: string;
}

export interface Quiz {
  id: string;
  userId: string;
  documentId?: string;
  summaryId?: string;
  title: string;
  difficulty: 'easy' | 'medium' | 'hard';
  questionCount: number;
  questionType: 'multiple_choice' | 'true_false' | 'mixed';
  questions: QuizQuestion[];
  createdAt: string;
}

export interface QuizAttempt {
  id: string;
  userId: string;
  quizId: string;
  quizTitle: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  userAnswers: Record<string, number>; // questionId -> selectedIndex
  timeSpentSeconds: number;
  completedAt: string;
}

interface DatabaseSchema {
  users: User[];
  documents: Document[];
  summaries: Summary[];
  quizzes: Quiz[];
  quizAttempts: QuizAttempt[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'studymate_db.json');

class Database {
  private data: DatabaseSchema = {
    users: [],
    documents: [],
    summaries: [],
    quizzes: [],
    quizAttempts: [],
  };
  private isLoaded = false;

  constructor() {
    this.init();
  }

  private init() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
      } else {
        this.persist();
      }
      this.isLoaded = true;
    } catch (e) {
      console.error('Error initializing database:', e);
      this.persist();
    }
  }

  private persist() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const tmpFile = `${DB_FILE}.tmp.${Date.now()}`;
      fs.writeFileSync(tmpFile, JSON.stringify(this.data, null, 2), 'utf-8');
      fs.renameSync(tmpFile, DB_FILE);
    } catch (e) {
      console.error('Error persisting database:', e);
    }
  }

  // --- Users ---
  getUserById(id: string): User | undefined {
    return this.data.users.find(u => u.id === id);
  }

  getUserByEmail(email: string): User | undefined {
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  createUser(user: Omit<User, 'id' | 'createdAt'>): User {
    const newUser: User = {
      id: crypto.randomUUID(),
      ...user,
      createdAt: new Date().toISOString(),
    };
    this.data.users.push(newUser);
    this.persist();
    return newUser;
  }

  upsertUser(user: Partial<User> & { id: string; email: string; fullName: string }): User {
    const existingIdx = this.data.users.findIndex(
      (u) => u.id === user.id || u.email.toLowerCase() === user.email.toLowerCase()
    );
    if (existingIdx !== -1) {
      this.data.users[existingIdx] = {
        ...this.data.users[existingIdx],
        ...user,
      };
      this.persist();
      return this.data.users[existingIdx];
    }
    const newUser: User = {
      id: user.id,
      email: user.email.toLowerCase(),
      fullName: user.fullName,
      passwordHash: user.passwordHash || '',
      educationLevel: user.educationLevel,
      geminiApiKey: user.geminiApiKey,
      openRouterApiKey: user.openRouterApiKey,
      preferredProvider: user.preferredProvider || 'gemini',
      openRouterModel: user.openRouterModel,
      createdAt: user.createdAt || new Date().toISOString(),
    };
    this.data.users.push(newUser);
    this.persist();
    return newUser;
  }

  updateUser(id: string, updates: Partial<User>): User | undefined {
    const idx = this.data.users.findIndex(u => u.id === id);
    if (idx === -1) return undefined;
    this.data.users[idx] = { ...this.data.users[idx], ...updates };
    this.persist();
    return this.data.users[idx];
  }

  // --- Documents ---
  getDocuments(userId: string): Document[] {
    return this.data.documents
      .filter(d => d.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getDocumentById(id: string, userId: string): Document | undefined {
    return this.data.documents.find(d => d.id === id && d.userId === userId);
  }

  createDocument(doc: Omit<Document, 'id' | 'createdAt'>): Document {
    const newDoc: Document = {
      id: crypto.randomUUID(),
      ...doc,
      createdAt: new Date().toISOString(),
    };
    this.data.documents.push(newDoc);
    this.persist();
    return newDoc;
  }

  deleteDocument(id: string, userId: string): boolean {
    const initialLen = this.data.documents.length;
    this.data.documents = this.data.documents.filter(d => !(d.id === id && d.userId === userId));
    const deleted = this.data.documents.length < initialLen;
    if (deleted) this.persist();
    return deleted;
  }

  // --- Summaries ---
  getSummaries(userId: string): Summary[] {
    return this.data.summaries
      .filter(s => s.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getSummaryById(id: string, userId: string): Summary | undefined {
    return this.data.summaries.find(s => s.id === id && s.userId === userId);
  }

  createSummary(summary: Omit<Summary, 'id' | 'createdAt'>): Summary {
    const newSummary: Summary = {
      id: crypto.randomUUID(),
      ...summary,
      createdAt: new Date().toISOString(),
    };
    this.data.summaries.push(newSummary);
    this.persist();
    return newSummary;
  }

  deleteSummary(id: string, userId: string): boolean {
    const initialLen = this.data.summaries.length;
    this.data.summaries = this.data.summaries.filter(s => !(s.id === id && s.userId === userId));
    const deleted = this.data.summaries.length < initialLen;
    if (deleted) this.persist();
    return deleted;
  }

  // --- Quizzes ---
  getQuizzes(userId: string): Quiz[] {
    return this.data.quizzes
      .filter(q => q.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getQuizById(id: string, userId: string): Quiz | undefined {
    return this.data.quizzes.find(q => q.id === id && q.userId === userId);
  }

  createQuiz(quiz: Omit<Quiz, 'id' | 'createdAt'>): Quiz {
    const newQuiz: Quiz = {
      id: crypto.randomUUID(),
      ...quiz,
      createdAt: new Date().toISOString(),
    };
    this.data.quizzes.push(newQuiz);
    this.persist();
    return newQuiz;
  }

  deleteQuiz(id: string, userId: string): boolean {
    const initialLen = this.data.quizzes.length;
    this.data.quizzes = this.data.quizzes.filter(q => !(q.id === id && q.userId === userId));
    const deleted = this.data.quizzes.length < initialLen;
    if (deleted) this.persist();
    return deleted;
  }

  // --- Quiz Attempts ---
  getQuizAttempts(userId: string): QuizAttempt[] {
    return this.data.quizAttempts
      .filter(a => a.userId === userId)
      .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
  }

  getAttemptsForQuiz(quizId: string, userId: string): QuizAttempt[] {
    return this.data.quizAttempts
      .filter(a => a.quizId === quizId && a.userId === userId)
      .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
  }

  createQuizAttempt(attempt: Omit<QuizAttempt, 'id' | 'completedAt'>): QuizAttempt {
    const newAttempt: QuizAttempt = {
      id: crypto.randomUUID(),
      ...attempt,
      completedAt: new Date().toISOString(),
    };
    this.data.quizAttempts.push(newAttempt);
    this.persist();
    return newAttempt;
  }

  // --- Stats ---
  getUserStats(userId: string) {
    const docs = this.data.documents.filter(d => d.userId === userId);
    const summaries = this.data.summaries.filter(s => s.userId === userId);
    const quizzes = this.data.quizzes.filter(q => q.userId === userId);
    const attempts = this.data.quizAttempts.filter(a => a.userId === userId);

    const totalScore = attempts.reduce((acc, a) => acc + a.score, 0);
    const totalPossible = attempts.reduce((acc, a) => acc + a.totalQuestions, 0);
    const avgScore = totalPossible > 0 ? Math.round((totalScore / totalPossible) * 100) : 0;

    return {
      totalDocuments: docs.length,
      totalSummaries: summaries.length,
      totalQuizzes: quizzes.length,
      totalAttempts: attempts.length,
      averageScore: avgScore,
      latestAttempts: attempts.slice(0, 5),
    };
  }
}

export const db = new Database();
