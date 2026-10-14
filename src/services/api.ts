import {
  User,
  Document,
  Summary,
  Quiz,
  QuizAttempt,
  UserStats,
  ConfigStatus,
} from '../types/index.js';

const TOKEN_KEY = 'studymate_auth_token';

export const authStorage = {
  getToken: (): string | null => localStorage.getItem(TOKEN_KEY),
  setToken: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clearToken: () => localStorage.removeItem(TOKEN_KEY),
};

async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = authStorage.getToken();
  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Only set Content-Type if body is not FormData
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  const contentType = response.headers.get('content-type');
  let data: any = null;
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const errorMsg = data?.error || (typeof data === 'string' ? data : 'An unexpected error occurred.');
    throw new Error(errorMsg);
  }

  return data as T;
}

export const api = {
  // Config & Status
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

  // Auth
  register: (payload: { email: string; password: string; fullName: string; educationLevel?: string }) =>
    apiRequest<{ token: string; user: User }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  login: (payload: { email: string; password: string }) =>
    apiRequest<{ token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getCurrentUser: () => apiRequest<{ user: User }>('/api/auth/me'),

  resetPassword: (payload: { email: string; newPassword: string }) =>
    apiRequest<{ success: boolean; message: string }>('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateSettings: (payload: Partial<User>) =>
    apiRequest<{ user: User }>('/api/auth/settings', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  // Dashboard stats
  getDashboardStats: () => apiRequest<UserStats>('/api/dashboard/stats'),

  // Documents
  getDocuments: () => apiRequest<{ documents: Document[] }>('/api/documents'),
  getDocument: (id: string) => apiRequest<{ document: Document }>(`/api/documents/${id}`),
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
  deleteDocument: (id: string) =>
    apiRequest<{ success: boolean }>(`/api/documents/${id}`, {
      method: 'DELETE',
    }),

  // Summaries
  getSummaries: () => apiRequest<{ summaries: Summary[] }>('/api/summaries'),
  getSummary: (id: string) => apiRequest<{ summary: Summary }>(`/api/summaries/${id}`),
  generateSummary: (payload: {
    documentId?: string;
    rawText?: string;
    title?: string;
    summaryType: 'concise' | 'standard' | 'detailed' | 'very_detailed';
  }) =>
    apiRequest<{ summary: Summary; providerUsed: string; modelUsed: string }>('/api/summaries/generate', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  deleteSummary: (id: string) =>
    apiRequest<{ success: boolean }>(`/api/summaries/${id}`, {
      method: 'DELETE',
    }),

  // Quizzes
  getQuizzes: () => apiRequest<{ quizzes: Quiz[] }>('/api/quizzes'),
  getQuiz: (id: string) => apiRequest<{ quiz: Quiz }>(`/api/quizzes/${id}`),
  generateQuiz: (payload: {
    documentId?: string;
    summaryId?: string;
    rawText?: string;
    title?: string;
    questionCount: number;
    difficulty: 'easy' | 'medium' | 'hard';
    questionType: 'multiple_choice' | 'true_false' | 'mixed';
  }) =>
    apiRequest<{ quiz: Quiz; providerUsed: string; modelUsed: string }>('/api/quizzes/generate', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  deleteQuiz: (id: string) =>
    apiRequest<{ success: boolean }>(`/api/quizzes/${id}`, {
      method: 'DELETE',
    }),
  submitQuizAttempt: (
    quizId: string,
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
    }>(`/api/quizzes/${quizId}/submit`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getQuizAttempts: (quizId: string) =>
    apiRequest<{ attempts: QuizAttempt[] }>(`/api/quizzes/${quizId}/attempts`),
  getAllAttempts: () => apiRequest<{ attempts: QuizAttempt[] }>('/api/attempts'),
};
