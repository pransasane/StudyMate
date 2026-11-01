import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

/**
 * Server and AI Engine Configuration
 *
 * For GitHub Repository deployments:
 * 1. Recommended: Set GEMINI_API_KEY in your environment or GitHub Secrets / .env file.
 * 2. If you are running locally or deploying private code, you can also set your default key below.
 */
export const AI_CONFIG = {
  // Google Gemini API Key: reads from process.env.GEMINI_API_KEY by default
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',

  // OpenRouter API Key (Optional multi-model gateway)
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY || '',

  // Default models
  DEFAULT_GEMINI_MODEL: 'gemini-3.6-flash',
  DEFAULT_OPENROUTER_MODEL: 'google/gemini-3.5-flash',

  // Application URL & Port
  APP_URL: process.env.APP_URL || 'http://localhost:3000',
  PORT: Number(process.env.PORT) || 3000,
};

/**
 * Resolves the active Gemini API key, giving precedence to any custom key passed per-request,
 * then falling back to the configured server environment key.
 */
export function getActiveGeminiApiKey(customKey?: string): string {
  const key = customKey?.trim() || AI_CONFIG.GEMINI_API_KEY?.trim() || process.env.GEMINI_API_KEY?.trim() || '';
  return key;
}

/**
 * Resolves the active OpenRouter API key.
 */
export function getActiveOpenRouterApiKey(customKey?: string): string {
  const key = customKey?.trim() || AI_CONFIG.OPENROUTER_API_KEY?.trim() || process.env.OPENROUTER_API_KEY?.trim() || '';
  return key;
}
