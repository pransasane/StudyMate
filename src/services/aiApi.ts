/**
 * ==============================================================================
 * StudyMate Client AI API Service
 * ==============================================================================
 *
 * Provides a clean client-side interface to the server-side AI API endpoints,
 * keeping API keys secure on the backend while allowing frontend components
 * to request summaries, quizzes, and connection testing.
 */

import { api } from './api.js';
import { Summary, Quiz } from '../types/index.js';

export interface ClientGenerateSummaryOptions {
  documentId?: string;
  rawText?: string;
  title?: string;
  summaryType: 'concise' | 'standard' | 'detailed' | 'very_detailed';
}

export interface ClientGenerateQuizOptions {
  documentId?: string;
  summaryId?: string;
  rawText?: string;
  title?: string;
  questionCount: number;
  difficulty: 'easy' | 'medium' | 'hard';
  questionType: 'multiple_choice' | 'true_false' | 'mixed';
}

export const aiApiService = {
  /**
   * Check if Gemini API is available and active on the backend
   */
  async checkStatus() {
    return api.getConfigStatus();
  },

  /**
   * Test the Google Gemini API connection
   */
  async testGemini(apiKey?: string) {
    return api.testGemini(apiKey);
  },

  /**
   * Test OpenRouter connection (optional multi-model gateway)
   */
  async testOpenRouter(apiKey?: string, model?: string) {
    return api.testOpenRouter(apiKey, model);
  },

  /**
   * Generate an AI Summary from document text
   */
  async generateSummary(options: ClientGenerateSummaryOptions): Promise<{
    summary: Summary;
    providerUsed: string;
    modelUsed: string;
  }> {
    return api.generateSummary(options);
  },

  /**
   * Generate an interactive AI Quiz from document or summary
   */
  async generateQuiz(options: ClientGenerateQuizOptions): Promise<{
    quiz: Quiz;
    providerUsed: string;
    modelUsed: string;
  }> {
    return api.generateQuiz(options);
  },
};

export default aiApiService;
