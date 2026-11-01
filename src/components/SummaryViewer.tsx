import React, { useState } from 'react';
import { Summary } from '../types/index.js';
import { MarkdownRenderer } from './MarkdownRenderer.js';
import {
  ArrowLeft,
  Copy,
  Check,
  Download,
  RotateCcw,
  Sparkles,
  HelpCircle,
  Clock,
  BookOpen,
  Trash2,
} from 'lucide-react';

interface SummaryViewerProps {
  summary: Summary;
  onBack: () => void;
  onGenerateQuiz: (summaryId: string) => void;
  onRegenerate: (summary: Summary) => void;
  onDelete: (summaryId: string) => void;
}

export const SummaryViewer: React.FC<SummaryViewerProps> = ({
  summary,
  onBack,
  onGenerateQuiz,
  onRegenerate,
  onDelete,
}) => {
  const [copied, setCopied] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(summary.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = (format: 'md' | 'txt') => {
    const filename = `${summary.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${format}`;
    const blob = new Blob([summary.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const estReadTime = Math.max(1, Math.round(summary.wordCount / 200));

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Top Navigation & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Library</span>
        </button>

        <div className="flex flex-wrap items-center gap-2">
          {/* Copy Button */}
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                <span>Copy Summary</span>
              </>
            )}
          </button>

          {/* Download MD */}
          <button
            onClick={() => handleDownload('md')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
            title="Download as Markdown"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>.MD</span>
          </button>

          {/* Download TXT */}
          <button
            onClick={() => handleDownload('txt')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
            title="Download as Plain Text"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>.TXT</span>
          </button>

          {/* Regenerate */}
          <button
            onClick={() => onRegenerate(summary)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
            title="Regenerate with different depth level"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Regenerate</span>
          </button>

          {/* Create Quiz from this summary */}
          <button
            onClick={() => onGenerateQuiz(summary.id)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs shadow-indigo-500/20 transition-colors cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Create Quiz</span>
          </button>

          {/* Delete button */}
          {confirmDelete ? (
            <div className="inline-flex items-center gap-1.5">
              <button
                onClick={() => onDelete(summary.id)}
                className="px-2.5 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 cursor-pointer"
              >
                Confirm Delete
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
              title="Delete summary"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Title & Metadata */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-600">
          <BookOpen className="w-4 h-4" />
          <span>StudyMate Academic Summary · {summary.summaryType.replace('_', ' ')}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {summary.title}
        </h1>
        <div className="flex items-center gap-3 text-xs text-slate-600 font-medium pt-1">
          <span>{summary.wordCount} words</span>
          <span>·</span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            ~{estReadTime} min read
          </span>
          <span>·</span>
          <span>Created on {new Date(summary.createdAt).toLocaleDateString()}</span>
        </div>
      </div>

      {/* High-Yield Key Points Card */}
      {summary.keyPoints && summary.keyPoints.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50/70 via-indigo-50/50 to-white rounded-2xl p-6 border border-blue-100 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-900">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span>High-Yield Revision Takeaways</span>
          </div>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs md:text-sm text-slate-800">
            {summary.keyPoints.map((point, idx) => (
              <li key={idx} className="flex items-start gap-2 bg-white/80 p-2.5 rounded-xl border border-blue-100/60 shadow-2xs">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <span className="leading-relaxed">{point}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Rendered Summary Document */}
      <div className="bg-white rounded-2xl p-6 sm:p-10 border border-slate-200/90 shadow-sm">
        <MarkdownRenderer content={summary.content} />
      </div>

      {/* Bottom CTA to Test Knowledge */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold">Ready to test what you just learned?</h3>
          <p className="text-xs text-slate-400 mt-1">
            Generate an interactive quiz based on this summary to lock concepts into long-term memory.
          </p>
        </div>
        <button
          onClick={() => onGenerateQuiz(summary.id)}
          className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold whitespace-nowrap shadow-md cursor-pointer inline-flex items-center gap-2"
        >
          <HelpCircle className="w-4 h-4" />
          <span>Launch Quiz From This Summary</span>
        </button>
      </div>
    </div>
  );
};
