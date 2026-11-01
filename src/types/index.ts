export interface User {
  id: string;
  email: string;
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
  userAnswers: Record<string, number>;
  timeSpentSeconds: number;
  completedAt: string;
}

export interface UserStats {
  totalDocuments: number;
  totalSummaries: number;
  totalQuizzes: number;
  totalAttempts: number;
  averageScore: number;
  latestAttempts: QuizAttempt[];
}

export interface ConfigStatus {
  geminiAvailable: boolean;
  openRouterEnvAvailable: boolean;
  port: number;
  timestamp: string;
}
