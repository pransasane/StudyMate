import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../services/api.js';
import {
  X,
  Settings,
  KeyRound,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Cpu,
  User,
  GraduationCap,
  ExternalLink,
  Zap,
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { user, updateSettings, configStatus } = useAuth();

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [educationLevel, setEducationLevel] = useState(user?.educationLevel || 'College / University');
  const [geminiApiKey, setGeminiApiKey] = useState(user?.geminiApiKey || '');
  const [openRouterApiKey, setOpenRouterApiKey] = useState(user?.openRouterApiKey || '');
  const [preferredProvider, setPreferredProvider] = useState<'openrouter' | 'gemini'>(
    user?.preferredProvider || (configStatus?.geminiAvailable ? 'gemini' : 'openrouter')
  );
  const [openRouterModel, setOpenRouterModel] = useState(
    user?.openRouterModel || 'google/gemini-2.0-flash-001'
  );

  // Testing states
  const [testingGemini, setTestingGemini] = useState(false);
  const [geminiTestMsg, setGeminiTestMsg] = useState<{ success: boolean; text: string } | null>(null);

  const [testingOpenRouter, setTestingOpenRouter] = useState(false);
  const [openRouterTestMsg, setOpenRouterTestMsg] = useState<{ success: boolean; text: string } | null>(null);

  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !user) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSavedSuccess(false);

    try {
      await updateSettings({
        fullName,
        educationLevel,
        geminiApiKey,
        openRouterApiKey,
        preferredProvider,
        openRouterModel,
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (err: any) {
      setError(err.message || 'Failed to update settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleTestGemini = async () => {
    setTestingGemini(true);
    setGeminiTestMsg(null);
    try {
      const res = await api.testGemini(geminiApiKey || undefined);
      setGeminiTestMsg({
        success: true,
        text: `Connected! Response model: ${res.model}`,
      });
    } catch (err: any) {
      setGeminiTestMsg({
        success: false,
        text: err.message || 'Gemini connection failed.',
      });
    } finally {
      setTestingGemini(false);
    }
  };

  const handleTestOpenRouter = async () => {
    if (!openRouterApiKey && !configStatus?.openRouterEnvAvailable) {
      setOpenRouterTestMsg({
        success: false,
        text: 'Please enter an OpenRouter API key first.',
      });
      return;
    }
    setTestingOpenRouter(true);
    setOpenRouterTestMsg(null);
    try {
      const res = await api.testOpenRouter(openRouterApiKey || undefined, openRouterModel);
      setOpenRouterTestMsg({
        success: true,
        text: res.message || 'Connected to OpenRouter!',
      });
    } catch (err: any) {
      setOpenRouterTestMsg({
        success: false,
        text: err.message || 'OpenRouter connection failed.',
      });
    } finally {
      setTestingOpenRouter(false);
    }
  };

  const openRouterModels = [
    { id: 'google/gemini-2.0-flash-001', name: 'Google: Gemini 2.0 Flash (Fast & Highly structured)' },
    { id: 'meta-llama/llama-3.3-70b-instruct', name: 'Meta: Llama 3.3 70B Instruct (Academic reasoning)' },
    { id: 'anthropic/claude-3.5-sonnet', name: 'Anthropic: Claude 3.5 Sonnet' },
    { id: 'deepseek/deepseek-chat', name: 'DeepSeek: DeepSeek-V3' },
    { id: 'mistralai/mistral-large-2407', name: 'Mistral: Mistral Large' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">AI Engines & Settings</h3>
              <p className="text-xs text-slate-600">
                Configure Gemini AI API and OpenRouter for real summaries & quizzes
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {savedSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>Settings and API configurations updated successfully!</span>
            </div>
          )}

          {/* Engine Provider Toggle */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Active AI Generation Provider
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPreferredProvider('gemini')}
                className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                  preferredProvider === 'gemini'
                    ? 'border-blue-600 bg-blue-50/70 text-blue-900 shadow-2xs'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold">Google Gemini AI</span>
                  {preferredProvider === 'gemini' && (
                    <span className="w-2 h-2 rounded-full bg-blue-600" />
                  )}
                </div>
                <div className="text-[11px] text-slate-600 mt-0.5">
                  High-speed academic synthesis
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPreferredProvider('openrouter')}
                className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                  preferredProvider === 'openrouter'
                    ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 shadow-2xs'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold">OpenRouter API</span>
                  {preferredProvider === 'openrouter' && (
                    <span className="w-2 h-2 rounded-full bg-indigo-600" />
                  )}
                </div>
                <div className="text-[11px] text-slate-600 mt-0.5">
                  Multi-model open gateway
                </div>
              </button>
            </div>
          </div>

          {/* SECTION 1: GEMINI AI API */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-600" />
                <span className="text-xs font-bold text-slate-900">Google Gemini AI API</span>
              </div>
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-blue-600 hover:underline inline-flex items-center gap-1 font-semibold"
              >
                <span>Get Free Key</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Gemini API Key (Optional Override)
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="password"
                  value={geminiApiKey}
                  onChange={(e) => setGeminiApiKey(e.target.value)}
                  placeholder={configStatus?.geminiAvailable ? 'Default system key active (or paste your custom key)' : 'AIzaSy...'}
                  className="w-full pl-9 pr-3 py-1.5 text-xs font-mono rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <p className="text-[10px] text-slate-600 mt-1">
                {configStatus?.geminiAvailable
                  ? 'System key is active. You can optionally paste your own key above.'
                  : 'Get a free API key at aistudio.google.com/apikey to enable Gemini AI.'}
              </p>
            </div>

            {/* Test Gemini Button */}
            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={handleTestGemini}
                disabled={testingGemini}
                className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-[11px] font-semibold text-slate-700 inline-flex items-center gap-1.5 cursor-pointer shadow-2xs disabled:opacity-50"
              >
                <Zap className="w-3 h-3 text-blue-600" />
                <span>{testingGemini ? 'Testing Connection...' : 'Test Gemini Connection'}</span>
              </button>

              {geminiTestMsg && (
                <span
                  className={`text-[11px] font-semibold ${
                    geminiTestMsg.success ? 'text-emerald-700' : 'text-rose-600'
                  }`}
                >
                  {geminiTestMsg.text}
                </span>
              )}
            </div>
          </div>

          {/* SECTION 2: OPENROUTER API */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-600" />
                <span className="text-xs font-bold text-slate-900">OpenRouter API</span>
              </div>
              <a
                href="https://openrouter.ai/keys"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-indigo-600 hover:underline inline-flex items-center gap-1 font-semibold"
              >
                <span>Get OpenRouter Key</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                OpenRouter API Key
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="password"
                  value={openRouterApiKey}
                  onChange={(e) => setOpenRouterApiKey(e.target.value)}
                  placeholder="sk-or-v1-..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs font-mono rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                OpenRouter Model
              </label>
              <select
                value={openRouterModel}
                onChange={(e) => setOpenRouterModel(e.target.value)}
                className="w-full p-2 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-blue-500"
              >
                {openRouterModels.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Test OpenRouter Button */}
            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={handleTestOpenRouter}
                disabled={testingOpenRouter}
                className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-[11px] font-semibold text-slate-700 inline-flex items-center gap-1.5 cursor-pointer shadow-2xs disabled:opacity-50"
              >
                <Zap className="w-3 h-3 text-indigo-600" />
                <span>{testingOpenRouter ? 'Testing Connection...' : 'Test OpenRouter Connection'}</span>
              </button>

              {openRouterTestMsg && (
                <span
                  className={`text-[11px] font-semibold ${
                    openRouterTestMsg.success ? 'text-emerald-700' : 'text-rose-600'
                  }`}
                >
                  {openRouterTestMsg.text}
                </span>
              )}
            </div>
          </div>

          {/* Student Profile Information */}
          <div className="pt-2 border-t border-slate-100 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Student Profile
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Education Level</label>
                <div className="relative">
                  <GraduationCap className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <select
                    value={educationLevel}
                    onChange={(e) => setEducationLevel(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 bg-white"
                  >
                    <option value="High School">High School</option>
                    <option value="College / University">College / Undergraduate</option>
                    <option value="Graduate / Medical / Law">Graduate / Master's / PhD</option>
                    <option value="Professional / Self-Taught">Professional / Lifelong Learner</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors shadow-md shadow-blue-500/20 disabled:opacity-50 cursor-pointer"
            >
              {saving ? 'Saving Configurations...' : 'Save Settings & API Keys'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
