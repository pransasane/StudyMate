import {
  User,
  Document,
  Summary,
  Quiz,
  QuizAttempt,
  ConfigStatus,
} from '../types/index.js';
import { auth } from './firebase.js';

type AISettings = {
  geminiApiKey?: string;
  openRouterApiKey?: string;
  preferredProvider?: 'openrouter' | 'gemini';
  openRouterModel?: string;
};

async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  const isPublicEndpoint = endpoint === '/api/config/status' || endpoint === '/api/health';
  const firebaseUser = auth.currentUser;

  if (firebaseUser) {
    // Firebase refreshes an expired ID token automatically before returning it.
    headers.set('Authorization', `Bearer ${await firebaseUser.getIdToken()}`);
  } else if (!isPublicEndpoint) {
    throw new Error('Please sign in to StudyMate before using this feature.');
  }

  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(endpoint, { ...options, headers });
  const contentType = response.headers.get('content-type');
  const data: any = contentType?.includes('application/json')
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message = data?.error || (typeof data === 'string' ? data : 'An unexpected server error occurred.');
    throw new Error(message);
  }

  return data as T;
}

export const api = {
  getConfigStatus: () => apiRequest<ConfigStatus>('/api/config/status'),

  testGemini: (apiKey?: string) =>
    apiRequest<{ success: boolean; model: string; message: string }>('/api/config/test-gemini', {
      method: 'POST',
      body: JSON.stringify({ apiKey }),
    }),

  testOpenRouter: (apiKey?: string, model?: string) =>
    apiRequest<{ success: boolean; message: string }>('/api/config/test-openrouter', {
      method: 'POST',
      body: JSON.stringify({ apiKey, model }),
    }),

  uploadDocument: (file: File, title?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    if (title) formData.append('title', title);
    return apiRequest<{ document: Document }>('/api/documents/upload', {
      method: 'POST',
      body: formData,
    });
  },

  pasteDocument: (payload: { title: string; text: string }) =>
    apiRequest<{ document: Document }>('/api/documents/paste', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  generateSummary: (payload: {
    documentId?: string;
    rawText: string;
    title?: string;
    summaryType: 'concise' | 'standard' | 'detailed' | 'very_detailed';
  } & AISettings) =>
    apiRequest<{ summary: Summary; providerUsed: string; modelUsed: string }>('/api/summaries/generate', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  generateQuiz: (payload: {
    documentId?: string;
    summaryId?: string;
    rawText: string;
    title?: string;
    questionCount: number;
    difficulty: 'easy' | 'medium' | 'hard';
    questionType: 'multiple_choice' | 'true_false' | 'mixed';
  } & AISettings) =>
    apiRequest<{ quiz: Quiz; providerUsed: string; modelUsed: string }>('/api/quizzes/generate', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  submitQuizAttempt: (
    quiz: Quiz,
    payload: { userAnswers: Record<string, number>; timeSpentSeconds: number }
  ) =>
    apiRequest<{
      attempt: QuizAttempt;
      score: number;
      totalQuestions: number;
      percentage: number;
      detailedFeedback: Array<{
        questionId: string;
        question: string;
        options: string[];
        userSelected?: number;
        correctAnswerIndex: number;
        isCorrect: boolean;
        explanation: string;
      }>;
    }>(`/api/quizzes/${quiz.id}/submit`, {
      method: 'POST',
      body: JSON.stringify({ quiz, ...payload }),
    }),
};
