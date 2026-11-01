import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.js';
import { firestoreService } from '../services/firebase.js';
import { Document, Summary } from '../types/index.js';
import {
  X,
  BookOpen,
  Sparkles,
  AlertCircle,
  CheckCircle,
  FileText,
  Clock,
  Layers,
  Settings,
} from 'lucide-react';

interface SummaryGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  documents: Document[];
  selectedDocumentId?: string;
  onSummaryGenerated: (summary: Summary) => void;
  onOpenSettings: () => void;
}

export const SummaryGeneratorModal: React.FC<SummaryGeneratorModalProps> = ({
  isOpen,
  onClose,
  documents,
  selectedDocumentId,
  onSummaryGenerated,
  onOpenSettings,
}) => {
  const { user } = useAuth();
  const [docId, setDocId] = useState<string>(selectedDocumentId || documents[0]?.id || '');
  const [summaryType, setSummaryType] = useState<'concise' | 'standard' | 'detailed' | 'very_detailed'>('detailed');
  const [customTitle, setCustomTitle] = useState('');

  // Status
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progressStep, setProgressStep] = useState<string>('');

  useEffect(() => {
    if (selectedDocumentId) {
      setDocId(selectedDocumentId);
    } else if (!docId && documents.length > 0) {
      setDocId(documents[0].id);
    } else if (docId && documents.length > 0 && !documents.some((d) => d.id === docId)) {
      setDocId(documents[0].id);
    }
  }, [selectedDocumentId, isOpen, documents]);

  if (!isOpen) return null;

  const currentDoc = documents.find((d) => d.id === docId);

  const depthLevels = [
    {
      type: 'concise' as const,
      name: 'Concise Summary',
      length: '~350 words · 2 min read',
      ideal: 'Best for rapid pre-exam cramming & high-yield recall',
      desc: 'Laser-focused synthesis of primary concepts, core takeaways, and basic definitions.',
    },
    {
      type: 'standard' as const,
      name: 'Standard Summary',
      length: '~750 words · 4 min read',
      ideal: 'Best for standard weekly study & lecture review',
      desc: 'Balanced conceptual breakdown with topic explanations, formulas, and revision points.',
    },
    {
      type: 'detailed' as const,
      name: 'Detailed Summary',
      length: '~1,200 words · 7 min read',
      ideal: 'Best for deep conceptual mastery & midterm prep',
      desc: 'In-depth section analysis, nuances, formula derivations, examples, and definitions.',
    },
    {
      type: 'very_detailed' as const,
      name: 'Very Detailed Summary',
      length: '~1,800 words · 10 min read',
      ideal: 'Best for comprehensive finals & textbook chapter mastery',
      desc: 'Exhaustive academic study guide unpacking every single subtopic, edge case, and formula.',
    },
  ];

  const handleGenerate = async () => {
    if (!docId && documents.length === 0) {
      setError('Please upload or select a document first.');
      return;
    }

    setError(null);
    setLoading(true);
    setProgressStep('Analyzing document structure and extracting keywords...');

    const timer1 = setTimeout(() => {
      setProgressStep('Synthesizing topic explanations and key concepts...');
    }, 1500);

    const timer2 = setTimeout(() => {
      setProgressStep('Drafting formulas, revision notes, and key takeaways...');
    }, 3500);

    try {
      const res = await api.generateSummary({
        documentId: docId || documents[0]?.id,
        summaryType,
        title: customTitle.trim() || undefined,
      });

      if (user) {
        await firestoreService.saveSummary(user.id, res.summary).catch((e) =>
          console.warn('Firestore summary save warning:', e)
        );
      }

      clearTimeout(timer1);
      clearTimeout(timer2);
      onSummaryGenerated(res.summary);
      onClose();
    } catch (err: any) {
      clearTimeout(timer1);
      clearTimeout(timer2);
      setError(err.message || 'Failed to generate AI summary.');
    } finally {
      setLoading(false);
      setProgressStep('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">AI Summary Generator</h3>
              <p className="text-xs text-slate-600">
                Generate structured academic notes with definitions, formulas & revision keys
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
                  <span>Configure OpenRouter or Gemini API Key in Settings</span>
                </button>
              </div>
            </div>
          )}

          {/* Source Document Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Source Study Material
            </label>
            {documents.length > 0 ? (
              <select
                value={docId}
                onChange={(e) => setDocId(e.target.value)}
                className="w-full p-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 bg-white"
              >
                {documents.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.title} ({d.wordCount} words · {d.originalFilename})
                  </option>
                ))}
              </select>
            ) : (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
                No documents in your library yet. Please upload a study file first.
              </div>
            )}
            {currentDoc && (
              <p className="text-[11px] text-slate-600 mt-1 pl-1">
                Selected: {currentDoc.wordCount} words · {currentDoc.characterCount} characters
              </p>
            )}
          </div>

          {/* Depth Level Options */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Select Summary Depth
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {depthLevels.map((lvl) => {
                const isSelected = summaryType === lvl.type;
                return (
                  <button
                    key={lvl.type}
                    type="button"
                    onClick={() => setSummaryType(lvl.type)}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/50 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-xs font-bold ${isSelected ? 'text-indigo-900' : 'text-slate-900'}`}>
                          {lvl.name}
                        </span>
                        {isSelected && <span className="w-2 h-2 rounded-full bg-indigo-600" />}
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed mb-2">
                        {lvl.desc}
                      </p>
                    </div>
                    <div className="text-[10px] font-semibold text-indigo-700 pt-2 border-t border-slate-100">
                      {lvl.length}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Included Sections Notice */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 text-xs text-slate-600 space-y-1.5">
            <span className="font-bold text-slate-800">
              Generated Structure Includes:
            </span>
            <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] pt-1">
              <div>• 1. Introduction & Overview</div>
              <div>• 2. Topic-Wise Explanations</div>
              <div>• 3. Concepts & Definitions</div>
              <div>• 4. Key Takeaway Points</div>
              <div>• 5. Formulas & Concrete Examples</div>
              <div>• 6. High-Yield Revision Notes</div>
            </div>
          </div>

          {/* Loading Indicator */}
          {loading && (
            <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200 space-y-2 text-center animate-pulse">
              <div className="flex items-center justify-center gap-2 text-blue-700 font-semibold text-xs">
                <span className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <span>{progressStep || 'Synthesizing AI Summary...'}</span>
              </div>
              <p className="text-[11px] text-slate-600">
                Processing through academic parsing model. This usually takes 5-15 seconds.
              </p>
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleGenerate}
            disabled={loading || documents.length === 0}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md shadow-indigo-500/20 transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>{loading ? 'Generating Summary...' : 'Generate AI Summary Now'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
