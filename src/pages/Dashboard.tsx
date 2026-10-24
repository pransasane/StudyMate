import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../services/api.js';
import { firestoreService } from '../services/firebase.js';
import {
  Document,
  Summary,
  Quiz,
  QuizAttempt,
  UserStats,
} from '../types/index.js';
import {
  BookOpen,
  FileText,
  HelpCircle,
  Award,
  UploadCloud,
  Sparkles,
  Clock,
  ArrowRight,
  Trash2,
  Eye,
  CheckCircle,
  X,
  Play,
  RotateCcw,
  Search,
  Check,
  Copy,
  Database as DatabaseIcon,
} from 'lucide-react';

interface DashboardProps {
  onOpenUpload: () => void;
  onOpenSummaryGen: (docId?: string) => void;
  onOpenQuizGen: (docId?: string, summaryId?: string) => void;
  onViewSummary: (summary: Summary) => void;
  onPlayQuiz: (quiz: Quiz) => void;
  onOpenSettings: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  onOpenUpload,
  onOpenSummaryGen,
  onOpenQuizGen,
  onViewSummary,
  onPlayQuiz,
  onOpenSettings,
}) => {
  const { user, configStatus } = useAuth();

  const [activeTab, setActiveTab] = useState<'overview' | 'materials' | 'summaries' | 'quizzes' | 'history'>('overview');
  const [loading, setLoading] = useState(true);

  // Data states
  const [stats, setStats] = useState<UserStats | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);

  // Modals & search
  const [searchQuery, setSearchQuery] = useState('');
  const [viewingDocText, setViewingDocText] = useState<Document | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedDocText, setCopiedDocText] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'document' | 'summary' | 'quiz';
    id: string;
    title: string;
  } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Connect Real-Time Google Firebase Firestore Listeners
  useEffect(() => {
    if (!user) return;
    setLoading(true);

    let currentDocs: Document[] = [];
    let currentSums: Summary[] = [];
    let currentQuizzes: Quiz[] = [];
    let currentAttempts: QuizAttempt[] = [];

    const recalculateAndSetStats = () => {
      const computed = firestoreService.calculateStats(
        currentDocs,
        currentSums,
        currentQuizzes,
        currentAttempts
      );
      setStats(computed);
      setLoading(false);
    };

    // 1. Subscribe to Firestore Documents
    const unsubDocs = firestoreService.subscribeDocuments(
      user.id,
      (docs) => {
        currentDocs = docs;
        setDocuments(docs);
        recalculateAndSetStats();
      },
      () => {
        // Fallback to API
        api.getDocuments().then((res) => setDocuments(res.documents)).catch(() => {});
      }
    );

    // 2. Subscribe to Firestore Summaries
    const unsubSums = firestoreService.subscribeSummaries(
      user.id,
      (sums) => {
        currentSums = sums;
        setSummaries(sums);
        recalculateAndSetStats();
      },
      () => {
        api.getSummaries().then((res) => setSummaries(res.summaries)).catch(() => {});
      }
    );

    // 3. Subscribe to Firestore Quizzes
    const unsubQuizzes = firestoreService.subscribeQuizzes(
      user.id,
      (qs) => {
        currentQuizzes = qs;
        setQuizzes(qs);
        recalculateAndSetStats();
      },
      () => {
        api.getQuizzes().then((res) => setQuizzes(res.quizzes)).catch(() => {});
      }
    );

    // 4. Subscribe to Firestore Attempts
    const unsubAttempts = firestoreService.subscribeAttempts(
      user.id,
      (atts) => {
        currentAttempts = atts;
        setAttempts(atts);
        recalculateAndSetStats();
      },
      () => {
        api.getAllAttempts().then((res) => setAttempts(res.attempts)).catch(() => {});
      }
    );

    return () => {
      unsubDocs();
      unsubSums();
      unsubQuizzes();
      unsubAttempts();
    };
  }, [user?.id]);

  const handleConfirmDelete = async () => {
    if (!deleteTarget || !user) return;
    setDeleting(true);
    setActionError(null);
    try {
      if (deleteTarget.type === 'document') {
        await Promise.all([
          firestoreService.deleteDocument(user.id, deleteTarget.id).catch(() => {}),
          api.deleteDocument(deleteTarget.id).catch(() => {}),
        ]);
        setDocuments((prev) => prev.filter((d) => d.id !== deleteTarget.id));
      } else if (deleteTarget.type === 'summary') {
        await Promise.all([
          firestoreService.deleteSummary(user.id, deleteTarget.id).catch(() => {}),
          api.deleteSummary(deleteTarget.id).catch(() => {}),
        ]);
        setSummaries((prev) => prev.filter((s) => s.id !== deleteTarget.id));
      } else if (deleteTarget.type === 'quiz') {
        await Promise.all([
          firestoreService.deleteQuiz(user.id, deleteTarget.id).catch(() => {}),
          api.deleteQuiz(deleteTarget.id).catch(() => {}),
        ]);
        setQuizzes((prev) => prev.filter((q) => q.id !== deleteTarget.id));
      }
      setDeleteTarget(null);
    } catch (err: any) {
      setActionError(err.message || 'Failed to delete item.');
    } finally {
      setDeleting(false);
    }
  };

  const handleCopySummary = (summary: Summary) => {
    navigator.clipboard.writeText(summary.content);
    setCopiedId(summary.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyDocText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedDocText(true);
    setTimeout(() => setCopiedDocText(false), 2000);
  };

  if (!user) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Workspace Header Greeting */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
              Student Workspace · {user.educationLevel || 'Active Learner'}
            </span>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] font-semibold text-emerald-800">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Google Firebase Database Active</span>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Welcome, {user.fullName}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-xl">
            Upload study files, generate structured multi-tier summaries, and sharpen recall with adaptive quizzes. Your data is synced securely in Google Firebase.
          </p>
        </div>

        {/* Action Button Bar */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={onOpenUpload}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white text-xs font-semibold shadow-xs shadow-blue-500/20 transition-all cursor-pointer"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload Document</span>
          </button>

          <button
            onClick={() => onOpenSummaryGen()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200/60 text-xs font-semibold transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-sky-600" />
            <span>Generate Summary</span>
          </button>

          <button
            onClick={() => onOpenQuizGen()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/60 text-xs font-semibold transition-all cursor-pointer"
          >
            <HelpCircle className="w-4 h-4 text-emerald-600" />
            <span>Create Quiz</span>
          </button>
        </div>
      </div>

      {/* GitHub / Local API Key Guidance Banner if not configured */}
      {!configStatus?.geminiAvailable && !user.geminiApiKey && !user.openRouterApiKey && (
        <div className="bg-amber-50/90 rounded-2xl p-4 sm:p-5 border border-amber-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
              <span className="text-base">🔑</span>
            </div>
            <div>
              <h4 className="text-xs font-bold text-amber-900">
                Running from GitHub or Local Environment? Add Your Gemini API Key
              </h4>
              <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                Secret API keys are excluded from GitHub code files to protect against unauthorized leaks. You can add <code className="bg-amber-100 px-1 py-0.5 rounded font-mono text-[10px]">GEMINI_API_KEY</code> in your local <code className="bg-amber-100 px-1 py-0.5 rounded font-mono text-[10px]">.env</code> file (see <code className="bg-amber-100 px-1 py-0.5 rounded font-mono text-[10px]">README.md</code>) or paste your key directly in Settings.
              </p>
            </div>
          </div>
          <button
            onClick={onOpenSettings}
            className="px-3.5 py-1.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs font-semibold whitespace-nowrap cursor-pointer shrink-0 shadow-2xs"
          >
            Configure in Settings
          </button>
        </div>
      )}

      {/* Top Quantitative Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Study Materials</span>
            <FileText className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{documents.length}</div>
          <div className="text-[11px] text-slate-600 mt-1">PDFs, DOCXs & Notes</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">AI Summaries</span>
            <BookOpen className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{summaries.length}</div>
          <div className="text-[11px] text-slate-600 mt-1">Structured Study Guides</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Quizzes Created</span>
            <HelpCircle className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{quizzes.length}</div>
          <div className="text-[11px] text-slate-600 mt-1">MCQs & True/False</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Quiz Attempts</span>
            <Award className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{attempts.length}</div>
          <div className="text-[11px] text-slate-600 mt-1">Tests Completed</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Average Score</span>
            <span className="text-xs font-bold text-emerald-600 font-mono">KPI</span>
          </div>
          <div className="text-2xl font-black text-emerald-600">
            {stats ? `${stats.averageScore}%` : '0%'}
          </div>
          <div className="text-[11px] text-slate-600 mt-1">Overall Retention</div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-px">
        {[
          { key: 'overview', label: 'Overview & Activity' },
          { key: 'materials', label: `Study Materials (${documents.length})` },
          { key: 'summaries', label: `AI Summaries (${summaries.length})` },
          { key: 'quizzes', label: `AI Quizzes (${quizzes.length})` },
          { key: 'history', label: `Quiz History (${attempts.length})` },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`py-2.5 px-4 text-xs font-bold whitespace-nowrap border-b-2 cursor-pointer transition-all ${
              activeTab === tab.key
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Quick Action Banner if no documents */}
          {documents.length === 0 && (
            <div className="bg-blue-50/60 rounded-2xl p-8 border border-blue-100 text-center space-y-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 mx-auto flex items-center justify-center">
                <UploadCloud className="w-6 h-6" />
              </div>
              <div className="max-w-md mx-auto">
                <h3 className="text-base font-bold text-slate-900">Your study library is empty</h3>
                <p className="text-xs text-slate-600 mt-1">
                  Upload your textbook chapters, class slides, or paste lecture notes to generate your first AI summary and quiz.
                </p>
              </div>
              <button
                onClick={onOpenUpload}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs cursor-pointer inline-flex items-center gap-1.5"
              >
                <span>Upload First Document</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Quick Start Next Steps */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
              <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <UploadCloud className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Upload New Material</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Add PDF files, DOCX Word documents, or paste notes. Text is extracted automatically.
              </p>
              <button
                onClick={onOpenUpload}
                className="text-xs font-semibold text-blue-600 hover:underline inline-flex items-center gap-1 cursor-pointer pt-1"
              >
                <span>Upload now</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Synthesize AI Summary</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Choose from Concise, Standard, Detailed, or Very Detailed study guides.
              </p>
              <button
                onClick={() => onOpenSummaryGen()}
                disabled={documents.length === 0}
                className="text-xs font-semibold text-indigo-600 hover:underline inline-flex items-center gap-1 cursor-pointer pt-1 disabled:opacity-50"
              >
                <span>Generate summary</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <HelpCircle className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Practice Active Recall</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Test yourself with 5 to 20 multiple-choice or true/false questions with automated scoring.
              </p>
              <button
                onClick={() => onOpenQuizGen()}
                disabled={documents.length === 0 && summaries.length === 0}
                className="text-xs font-semibold text-emerald-600 hover:underline inline-flex items-center gap-1 cursor-pointer pt-1 disabled:opacity-50"
              >
                <span>Create new quiz</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Recent Quiz Attempts & Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Quizzes Available */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">Your Quizzes Ready to Play</h3>
                <button
                  onClick={() => setActiveTab('quizzes')}
                  className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
                >
                  View all ({quizzes.length})
                </button>
              </div>

              {quizzes.length > 0 ? (
                <div className="space-y-3">
                  {quizzes.slice(0, 4).map((q) => (
                    <div
                      key={q.id}
                      className="p-3.5 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/20 transition-all flex items-center justify-between gap-3"
                    >
                      <div className="space-y-0.5">
                        <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{q.title}</h4>
                        <div className="text-[11px] text-slate-600">
                          {q.questionCount} questions · {q.difficulty.toUpperCase()} · {q.questionType.replace('_', ' ')}
                        </div>
                      </div>
                      <button
                        onClick={() => onPlayQuiz(q)}
                        className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs cursor-pointer inline-flex items-center gap-1 shrink-0"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>Play</span>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-600 py-6 text-center">
                  No quizzes generated yet. Generate your first quiz from a document or summary.
                </p>
              )}
            </div>

            {/* Recent Completed Attempts */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">Recent Quiz Performance</h3>
                <button
                  onClick={() => setActiveTab('history')}
                  className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
                >
                  Full History ({attempts.length})
                </button>
              </div>

              {attempts.length > 0 ? (
                <div className="space-y-3">
                  {attempts.slice(0, 4).map((att) => (
                    <div
                      key={att.id}
                      className="p-3.5 rounded-xl border border-slate-200 flex items-center justify-between gap-3"
                    >
                      <div className="space-y-0.5">
                        <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{att.quizTitle}</h4>
                        <div className="text-[11px] text-slate-600">
                          {new Date(att.completedAt).toLocaleDateString()} · {Math.round(att.timeSpentSeconds / 60)}m {att.timeSpentSeconds % 60}s
                        </div>
                      </div>
                      <div className="text-right">
                        <div
                          className={`text-sm font-bold ${
                            att.percentage >= 80
                              ? 'text-emerald-600'
                              : att.percentage >= 60
                              ? 'text-blue-600'
                              : 'text-amber-600'
                          }`}
                        >
                          {att.percentage}%
                        </div>
                        <div className="text-[10px] text-slate-600">
                          {att.score}/{att.totalQuestions} correct
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-600 py-6 text-center">
                  No quiz attempts yet. Play a quiz to track your mastery scores!
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: STUDY MATERIALS */}
      {activeTab === 'materials' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Uploaded Study Materials</h2>
              <p className="text-xs text-slate-600">
                Documents with extracted text ready for AI processing
              </p>
            </div>

            <button
              onClick={onOpenUpload}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs cursor-pointer"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Upload New Material</span>
            </button>
          </div>

          {documents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <button
                        onClick={() => setDeleteTarget({ type: 'document', id: doc.id, title: doc.title })}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Delete document"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div>
                      <h3 className="font-bold text-slate-900 text-sm line-clamp-1">{doc.title}</h3>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        {doc.originalFilename} · {(doc.fileSize / 1024).toFixed(1)} KB
                      </p>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600 font-mono line-clamp-3">
                      {doc.snippet}
                    </div>

                    <div className="text-[11px] text-slate-600 flex items-center gap-2 font-medium">
                      <span>{doc.wordCount} words</span>
                      <span>·</span>
                      <span>~{Math.max(1, Math.round(doc.wordCount / 200))} min read</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-5 mt-4 border-t border-slate-100 flex items-center gap-2">
                    <button
                      onClick={() => setViewingDocText(doc)}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer inline-flex items-center gap-1"
                      title="Inspect extracted text"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-500" />
                      <span>Preview</span>
                    </button>

                    <button
                      onClick={() => onOpenSummaryGen(doc.id)}
                      className="flex-1 py-1.5 px-2.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold text-center cursor-pointer"
                    >
                      Summary
                    </button>

                    <button
                      onClick={() => onOpenQuizGen(doc.id)}
                      className="flex-1 py-1.5 px-2.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold text-center cursor-pointer"
                    >
                      Quiz
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
              <UploadCloud className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-900">No study materials found</h3>
              <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto">
                Upload your lecture slides, notes, or chapter PDFs to begin learning.
              </p>
              <button
                onClick={onOpenUpload}
                className="mt-4 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold cursor-pointer"
              >
                Upload First Material
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: AI SUMMARIES */}
      {activeTab === 'summaries' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">AI Generated Summaries</h2>
              <p className="text-xs text-slate-600">
                Structured academic study guides with formulas, concepts, and revision keys
              </p>
            </div>

            <button
              onClick={() => onOpenSummaryGen()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Generate New Summary</span>
            </button>
          </div>

          {summaries.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {summaries.map((s) => (
                <div
                  key={s.id}
                  className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100">
                        {s.summaryType.replace('_', ' ')}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleCopySummary(s)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                          title="Copy summary"
                        >
                          {copiedId === s.id ? (
                            <Check className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => setDeleteTarget({ type: 'summary', id: s.id, title: s.title })}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                          title="Delete summary"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <h3 className="font-bold text-slate-900 text-base">{s.title}</h3>

                    {/* Key points preview */}
                    {s.keyPoints && s.keyPoints.length > 0 && (
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs text-slate-700 space-y-1">
                        <div className="font-semibold text-slate-900 text-[11px]">
                          Key Highlights:
                        </div>
                        <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-600">
                          {s.keyPoints.slice(0, 2).map((pt, i) => (
                            <li key={i} className="line-clamp-1">
                              {pt}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="text-[11px] text-slate-600 flex items-center gap-2">
                      <span>{s.wordCount} words</span>
                      <span>·</span>
                      <span>Created {new Date(s.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-4 mt-4 border-t border-slate-100 flex items-center gap-2">
                    <button
                      onClick={() => onViewSummary(s)}
                      className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold text-center cursor-pointer shadow-2xs"
                    >
                      Read Full Summary
                    </button>
                    <button
                      onClick={() => onOpenQuizGen(undefined, s.id)}
                      className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer"
                    >
                      Create Quiz
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
              <BookOpen className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-900">No summaries created yet</h3>
              <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto">
                Select any uploaded document to create a concise or detailed study guide.
              </p>
              <button
                onClick={() => onOpenSummaryGen()}
                disabled={documents.length === 0}
                className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
              >
                Generate First Summary
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: AI QUIZZES */}
      {activeTab === 'quizzes' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Interactive AI Quizzes</h2>
              <p className="text-xs text-slate-600">
                Self-testing assessments with timers, multiple choice, and deep explanations
              </p>
            </div>

            <button
              onClick={() => onOpenQuizGen()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs cursor-pointer"
            >
              <HelpCircle className="w-4 h-4" />
              <span>Create New Quiz</span>
            </button>
          </div>

          {quizzes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {quizzes.map((q) => {
                const pastAttempts = attempts.filter((a) => a.quizId === q.id);
                const bestScore = pastAttempts.reduce(
                  (max, a) => (a.percentage > max ? a.percentage : max),
                  -1
                );

                return (
                  <div
                    key={q.id}
                    className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100">
                          {q.difficulty.toUpperCase()} · {q.questionCount} Questions
                        </span>
                        <button
                          onClick={() => setDeleteTarget({ type: 'quiz', id: q.id, title: q.title })}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                          title="Delete quiz"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <h3 className="font-bold text-slate-900 text-base line-clamp-2">
                        {q.title}
                      </h3>

                      <div className="space-y-1 text-xs text-slate-600">
                        <div className="flex items-center justify-between">
                          <span>Format:</span>
                          <span className="font-medium text-slate-800">
                            {q.questionType.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Best Score:</span>
                          <span className="font-bold text-slate-900">
                            {bestScore >= 0 ? `${bestScore}%` : 'Not attempted'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Attempts:</span>
                          <span className="text-slate-700">{pastAttempts.length} times</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-4 mt-4 border-t border-slate-100">
                      <button
                        onClick={() => onPlayQuiz(q)}
                        className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Start Interactive Quiz</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
              <HelpCircle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-900">No quizzes generated yet</h3>
              <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto">
                Generate a quiz from any study material to test your mastery and active recall.
              </p>
              <button
                onClick={() => onOpenQuizGen()}
                disabled={documents.length === 0 && summaries.length === 0}
                className="mt-4 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
              >
                Create First Quiz
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: QUIZ HISTORY & SCORES */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Quiz Attempt History</h2>
            <p className="text-xs text-slate-600">
              Comprehensive log of tests completed, percentages, and time spent
            </p>
          </div>

          {attempts.length > 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Quiz Title</th>
                      <th className="py-3 px-4">Score</th>
                      <th className="py-3 px-4">Percentage</th>
                      <th className="py-3 px-4">Time Spent</th>
                      <th className="py-3 px-4">Completed On</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {attempts.map((att) => {
                      const parentQuiz = quizzes.find((q) => q.id === att.quizId);
                      return (
                        <tr key={att.id} className="hover:bg-slate-50/50">
                          <td className="py-3.5 px-4 font-semibold text-slate-900 max-w-xs truncate">
                            {att.quizTitle}
                          </td>
                          <td className="py-3.5 px-4 text-slate-700">
                            {att.score} / {att.totalQuestions}
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`font-bold ${
                                att.percentage >= 80
                                  ? 'text-emerald-600'
                                  : att.percentage >= 60
                                  ? 'text-blue-600'
                                  : 'text-amber-600'
                              }`}
                            >
                              {att.percentage}%
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 font-mono">
                            {Math.floor(att.timeSpentSeconds / 60)}m {att.timeSpentSeconds % 60}s
                          </td>
                          <td className="py-3.5 px-4 text-slate-600">
                            {new Date(att.completedAt).toLocaleString()}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            {parentQuiz && (
                              <button
                                onClick={() => onPlayQuiz(parentQuiz)}
                                className="px-3 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold cursor-pointer inline-flex items-center gap-1"
                              >
                                <RotateCcw className="w-3 h-3" />
                                <span>Retake</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
              <Award className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-900">No attempts logged yet</h3>
              <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto">
                Take an interactive quiz to see your retention metrics and performance history here.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Custom Delete Confirmation Modal (no window.confirm) */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Delete {deleteTarget.type === 'document' ? 'Study Document' : deleteTarget.type === 'summary' ? 'AI Summary' : 'Quiz'}?
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 truncate max-w-[200px]">
                  {deleteTarget.title}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              This item will be permanently removed from your student workspace. This action cannot be undone.
            </p>

            {actionError && (
              <p className="text-xs text-rose-600 font-medium">
                {actionError}
              </p>
            )}

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="flex-1 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Extracted Text Inspector Modal */}
      {viewingDocText && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Extracted Text: {viewingDocText.title}
                </h3>
                <p className="text-xs text-slate-600">
                  {viewingDocText.wordCount} words · {viewingDocText.characterCount} characters
                </p>
              </div>
              <button
                onClick={() => setViewingDocText(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto font-mono text-xs text-slate-700 leading-relaxed whitespace-pre-wrap bg-slate-50">
              {viewingDocText.extractedText}
            </div>
            <div className="p-4 bg-white border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => handleCopyDocText(viewingDocText.extractedText)}
                className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
              >
                {copiedDocText ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    <span>Copy Text</span>
                  </>
                )}
              </button>
              <button
                onClick={() => setViewingDocText(null)}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
