import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.js';
import { firestoreService } from '../services/firebase.js';
import { Document, Summary, Quiz } from '../types/index.js';
import {
  X,
  HelpCircle,
  Sparkles,
  AlertCircle,
  CheckCircle,
  Settings,
  Layers,
  GraduationCap,
} from 'lucide-react';

interface QuizGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  documents: Document[];
  summaries: Summary[];
  defaultDocumentId?: string;
  defaultSummaryId?: string;
  onQuizGenerated: (quiz: Quiz) => void;
  onOpenSettings: () => void;
}

export const QuizGeneratorModal: React.FC<QuizGeneratorModalProps> = ({
  isOpen,
  onClose,
  documents,
  summaries,
  defaultDocumentId,
  defaultSummaryId,
  onQuizGenerated,
  onOpenSettings,
}) => {
  const { user } = useAuth();
  const [sourceType, setSourceType] = useState<'document' | 'summary'>(
    defaultSummaryId ? 'summary' : 'document'
  );
  const [selectedDocId, setSelectedDocId] = useState<string>(
    defaultDocumentId || documents[0]?.id || ''
  );
  const [selectedSummaryId, setSelectedSummaryId] = useState<string>(
    defaultSummaryId || summaries[0]?.id || ''
  );

  const [questionCount, setQuestionCount] = useState<number>(5);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [questionType, setQuestionType] = useState<'multiple_choice' | 'true_false' | 'mixed'>('multiple_choice');
  const [quizTitle, setQuizTitle] = useState('');

  // Status
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progressMsg, setProgressMsg] = useState('');

  useEffect(() => {
    if (defaultDocumentId) {
      setSelectedDocId(defaultDocumentId);
      setSourceType('document');
    } else if (!selectedDocId && documents.length > 0) {
      setSelectedDocId(documents[0].id);
    } else if (selectedDocId && documents.length > 0 && !documents.some((d) => d.id === selectedDocId)) {
      setSelectedDocId(documents[0].id);
    }
  }, [defaultDocumentId, isOpen, documents]);

  useEffect(() => {
    if (defaultSummaryId) {
      setSelectedSummaryId(defaultSummaryId);
      setSourceType('summary');
    } else if (!selectedSummaryId && summaries.length > 0) {
      setSelectedSummaryId(summaries[0].id);
    } else if (selectedSummaryId && summaries.length > 0 && !summaries.some((s) => s.id === selectedSummaryId)) {
      setSelectedSummaryId(summaries[0].id);
    }
  }, [defaultSummaryId, isOpen, summaries]);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setError(null);
    setLoading(true);
    setProgressMsg('Extracting syllabus concepts and generating assessment items...');

    const timer1 = setTimeout(() => {
      setProgressMsg('Crafting multiple plausible answer options and detailed explanations...');
    }, 2000);

    try {
      const payload: any = {
        questionCount,
        difficulty,
        questionType,
        title: quizTitle.trim() || undefined,
      };

      if (sourceType === 'document') {
        if (!selectedDocId && documents.length === 0) {
          throw new Error('Please select an uploaded document.');
        }
        payload.documentId = selectedDocId || documents[0]?.id;
      } else {
        if (!selectedSummaryId && summaries.length === 0) {
          throw new Error('Please select a study summary.');
        }
        payload.summaryId = selectedSummaryId || summaries[0]?.id;
      }

      const res = await api.generateQuiz(payload);

      if (user) {
        await firestoreService.saveQuiz(user.id, res.quiz).catch((e) =>
          console.warn('Firestore quiz save warning:', e)
        );
      }

      clearTimeout(timer1);
      onQuizGenerated(res.quiz);
      onClose();
    } catch (err: any) {
      clearTimeout(timer1);
      setError(err.message || 'Failed to generate quiz. Please check your API configuration.');
    } finally {
      setLoading(false);
      setProgressMsg('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">AI Quiz Generator</h3>
              <p className="text-xs text-slate-600">
                Generate tailored self-assessment tests with automated explanations
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
        <div className="p-6 overflow-y-auto space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex flex-col gap-2">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="leading-relaxed font-medium">{error}</div>
              </div>
              <div className="pl-6">
                <button
                  onClick={() => {
                    onClose();
                    onOpenSettings();
                  }}
                  className="text-xs font-semibold text-rose-800 hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Configure API Key in Settings</span>
                </button>
              </div>
            </div>
          )}

          {/* Source Selection Toggle */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Source Material
            </label>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <button
                type="button"
                onClick={() => setSourceType('document')}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                  sourceType === 'document'
                    ? 'border-blue-600 bg-blue-50/70 text-blue-800 shadow-2xs'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                From Uploaded Document ({documents.length})
              </button>
              <button
                type="button"
                onClick={() => setSourceType('summary')}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                  sourceType === 'summary'
                    ? 'border-blue-600 bg-blue-50/70 text-blue-800 shadow-2xs'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                From AI Summary ({summaries.length})
              </button>
            </div>

            {sourceType === 'document' ? (
              documents.length > 0 ? (
                <select
                  value={selectedDocId}
                  onChange={(e) => setSelectedDocId(e.target.value)}
                  className="w-full p-2.5 text-xs md:text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 bg-white"
                >
                  {documents.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.title} ({d.wordCount} words)
                    </option>
                  ))}
                </select>
              ) : (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
                  No documents found. Please upload a study material first.
                </div>
              )
            ) : summaries.length > 0 ? (
              <select
                value={selectedSummaryId}
                onChange={(e) => setSelectedSummaryId(e.target.value)}
                className="w-full p-2.5 text-xs md:text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 bg-white"
              >
                {summaries.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title} ({s.wordCount} words)
                  </option>
                ))}
              </select>
            ) : (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
                No summaries found yet. Generate a summary first or use an uploaded document.
              </div>
            )}
          </div>

          {/* Question Count (5, 10, 15, 20) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Number of Questions
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[5, 10, 15, 20].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setQuestionCount(num)}
                  className={`py-2 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                    questionCount === num
                      ? 'border-blue-600 bg-blue-600 text-white shadow-2xs'
                      : 'border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  {num} Questions
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty Level (Easy, Medium, Hard) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Difficulty Level
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { key: 'easy', label: 'Easy', desc: 'Core definitions & direct facts' },
                { key: 'medium', label: 'Medium', desc: 'Application & concept comparison' },
                { key: 'hard', label: 'Hard', desc: 'Deep synthesis & edge cases' },
              ].map((diff) => (
                <button
                  key={diff.key}
                  type="button"
                  onClick={() => setDifficulty(diff.key as any)}
                  className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                    difficulty === diff.key
                      ? 'border-blue-600 bg-blue-50/60 shadow-2xs'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className={`text-xs font-bold ${difficulty === diff.key ? 'text-blue-900' : 'text-slate-900'}`}>
                    {diff.label}
                  </div>
                  <div className="text-[10px] text-slate-600 mt-0.5 leading-snug">
                    {diff.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Question Type */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Question Format
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { key: 'multiple_choice', label: 'Multiple Choice', desc: '4 options' },
                { key: 'true_false', label: 'True / False', desc: 'Binary logic' },
                { key: 'mixed', label: 'Mixed Format', desc: 'MCQs & T/F' },
              ].map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setQuestionType(t.key as any)}
                  className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                    questionType === t.key
                      ? 'border-blue-600 bg-blue-50/60 shadow-2xs'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className={`text-xs font-bold ${questionType === t.key ? 'text-blue-900' : 'text-slate-900'}`}>
                    {t.label}
                  </div>
                  <div className="text-[10px] text-slate-600 mt-0.5">
                    {t.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Loading state */}
          {loading && (
            <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 space-y-2 text-center animate-pulse">
              <div className="flex items-center justify-center gap-2 text-blue-700 font-semibold text-xs">
                <span className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <span>{progressMsg || 'Generating Questions & Answer Keys...'}</span>
              </div>
              <p className="text-[11px] text-slate-600">
                Formulating rigorous distractors and comprehensive explanations.
              </p>
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleGenerate}
            disabled={loading || (sourceType === 'document' ? documents.length === 0 : summaries.length === 0)}
            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-500/20 transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>{loading ? 'Synthesizing Quiz...' : `Generate ${questionCount} Questions Quiz`}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
