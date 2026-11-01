import React, { useState, useEffect } from 'react';
import { Quiz, QuizAttempt } from '../types/index.js';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.js';
import { firestoreService } from '../services/firebase.js';
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  CheckCircle,
  XCircle,
  RotateCcw,
  Award,
  AlertCircle,
  Check,
  HelpCircle,
  Layers,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';

interface QuizPlayerProps {
  quiz: Quiz;
  onBack: () => void;
  onAttemptCompleted: (attempt: QuizAttempt) => void;
}

export const QuizPlayer: React.FC<QuizPlayerProps> = ({
  quiz,
  onBack,
  onAttemptCompleted,
}) => {
  const { user } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Results State
  const [isCompleted, setIsCompleted] = useState(false);
  const [resultData, setResultData] = useState<{
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
  } | null>(null);

  const [filterMistakesOnly, setFilterMistakesOnly] = useState(false);

  // Timer
  useEffect(() => {
    if (isCompleted) return;
    const interval = setInterval(() => {
      setTimerSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isCompleted]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const currentQ = quiz.questions[currentIndex];
  const totalQ = quiz.questions.length;
  const answeredCount = Object.keys(userAnswers).length;
  const progressPercent = Math.round(((currentIndex + 1) / totalQ) * 100);

  const handleSelectOption = (optionIndex: number) => {
    if (isCompleted) return;
    setUserAnswers((prev) => ({
      ...prev,
      [currentQ.id]: optionIndex,
    }));
  };

  const handleSubmit = async () => {
    setShowConfirmSubmit(false);
    setSubmitting(true);
    try {
      const res = await api.submitQuizAttempt(quiz.id, {
        userAnswers,
        timeSpentSeconds: timerSeconds,
      });

      if (user) {
        await firestoreService.saveQuizAttempt(user.id, res.attempt).catch((e) =>
          console.warn('Firestore attempt save warning:', e)
        );
      }

      setResultData({
        score: res.score,
        totalQuestions: res.totalQuestions,
        percentage: res.percentage,
        detailedFeedback: res.detailedFeedback,
      });

      setIsCompleted(true);
      onAttemptCompleted(res.attempt);
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to submit quiz attempt. Please retry.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetry = () => {
    setUserAnswers({});
    setCurrentIndex(0);
    setTimerSeconds(0);
    setIsCompleted(false);
    setResultData(null);
    setFilterMistakesOnly(false);
  };

  // Keyboard navigation shortcuts (A, B, C, D)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isCompleted || !currentQ) return;
      const key = e.key.toUpperCase();
      if (key === 'A' && currentQ.options[0]) handleSelectOption(0);
      if (key === 'B' && currentQ.options[1]) handleSelectOption(1);
      if (key === 'C' && currentQ.options[2]) handleSelectOption(2);
      if (key === 'D' && currentQ.options[3]) handleSelectOption(3);
      if (e.key === 'ArrowRight' && currentIndex < totalQ - 1) setCurrentIndex(currentIndex + 1);
      if (e.key === 'ArrowLeft' && currentIndex > 0) setCurrentIndex(currentIndex - 1);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, currentQ, isCompleted]);

  // Option letters
  const optionLetters = ['A', 'B', 'C', 'D'];

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Exit Quiz</span>
        </button>

        <div className="flex items-center gap-4 text-xs font-medium text-slate-700">
          <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-lg">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span className="font-mono font-semibold">{formatTime(timerSeconds)}</span>
          </div>
          <span className="text-slate-600">
            {answeredCount} of {totalQ} Answered
          </span>
        </div>
      </div>

      {submitError && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-between">
          <span>{submitError}</span>
          <button
            onClick={() => setSubmitError(null)}
            className="text-xs font-semibold text-rose-800 underline ml-2 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {!isCompleted ? (
        <div className="space-y-6">
          {/* Progress Bar & Question Number */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
              <span className="text-blue-600 font-bold">
                Question {currentIndex + 1} of {totalQ}
              </span>
              <span>{progressPercent}% Complete</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Quick Navigator Palette */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-1">
            {quiz.questions.map((q, idx) => {
              const isAnswered = userAnswers[q.id] !== undefined;
              const isCurrent = idx === currentIndex;
              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentIndex(idx)}
                  className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
                    isCurrent
                      ? 'bg-blue-600 text-white ring-2 ring-blue-300'
                      : isAnswered
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          {/* Question Card */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                  {currentQ.topic || 'Concept'}
                </span>
                <span className="text-xs text-slate-600">
                  {currentQ.type === 'true_false' ? 'True / False' : 'Multiple Choice'}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">
                {currentQ.question}
              </h2>
            </div>

            {/* Answer Options */}
            <div className="space-y-3">
              {currentQ.options.map((opt, oIdx) => {
                const isSelected = userAnswers[currentQ.id] === oIdx;
                return (
                  <button
                    key={oIdx}
                    onClick={() => handleSelectOption(oIdx)}
                    className={`w-full p-4 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/70 text-blue-900 shadow-xs ring-1 ring-blue-500'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 ${
                          isSelected
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {optionLetters[oIdx] || oIdx + 1}
                      </span>
                      <span className="text-xs sm:text-sm font-medium leading-relaxed">
                        {opt}
                      </span>
                    </div>

                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'border-blue-600 bg-blue-600 text-white'
                          : 'border-slate-300'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-3" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bottom Nav Controls */}
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-30 cursor-pointer inline-flex items-center gap-1.5"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            {currentIndex < totalQ - 1 ? (
              <button
                onClick={() => setCurrentIndex((prev) => Math.min(totalQ - 1, prev + 1))}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs cursor-pointer inline-flex items-center gap-1.5"
              >
                <span>Next Question</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => setShowConfirmSubmit(true)}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/25 cursor-pointer inline-flex items-center gap-1.5"
              >
                <span>Submit Quiz</span>
                <CheckCircle className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Results Mode */
        resultData && (
          <div className="space-y-8 animate-in fade-in duration-200">
            {/* Score Banner */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 mx-auto flex items-center justify-center">
                <Award className="w-8 h-8" />
              </div>

              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Quiz Completion Report
                </span>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-1">
                  {resultData.percentage}% Score
                </h2>
                <p className="text-xs text-slate-600 font-medium mt-1">
                  You answered {resultData.score} out of {resultData.totalQuestions} questions correctly in {formatTime(timerSeconds)}.
                </p>
              </div>

              {/* Status Message */}
              <div className="inline-block px-4 py-1.5 rounded-full text-xs font-bold">
                {resultData.percentage >= 80 ? (
                  <span className="text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                    🎉 Excellent Mastery! Concepts thoroughly understood.
                  </span>
                ) : resultData.percentage >= 60 ? (
                  <span className="text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                    👍 Solid Understanding. Review missed items below.
                  </span>
                ) : (
                  <span className="text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                    📖 Needs Revision. Read the explanations below to strengthen memory.
                  </span>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={handleRetry}
                  className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer inline-flex items-center gap-2 shadow-xs"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Retry Quiz</span>
                </button>

                <button
                  onClick={onBack}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer"
                >
                  Return to Dashboard
                </button>

                {resultData.score < resultData.totalQuestions && (
                  <button
                    onClick={() => setFilterMistakesOnly(!filterMistakesOnly)}
                    className={`px-3.5 py-2.5 rounded-xl border text-xs font-semibold cursor-pointer transition-colors ${
                      filterMistakesOnly
                        ? 'border-rose-400 bg-rose-50 text-rose-700'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    {filterMistakesOnly ? 'Showing Mistakes Only' : 'Filter Mistakes Only'}
                  </button>
                )}
              </div>
            </div>

            {/* In-Depth Feedback Breakdown */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900">
                  Concept Breakdown & Explanations ({resultData.detailedFeedback.length})
                </h3>
                <span className="text-xs text-slate-600">
                  {resultData.score} Correct · {resultData.totalQuestions - resultData.score} Incorrect
                </span>
              </div>

              <div className="space-y-4">
                {resultData.detailedFeedback
                  .filter((item) => (filterMistakesOnly ? !item.isCorrect : true))
                  .map((item, idx) => (
                    <div
                      key={item.questionId}
                      className={`bg-white rounded-2xl p-6 border transition-all ${
                        item.isCorrect
                          ? 'border-emerald-200 bg-emerald-50/15'
                          : 'border-rose-200 bg-rose-50/15'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                              item.isCorrect
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-rose-100 text-rose-700'
                            }`}
                          >
                            {idx + 1}
                          </span>
                          <span className="text-xs font-semibold text-slate-600">
                            {item.isCorrect ? 'Correct Answer' : 'Incorrect'}
                          </span>
                        </div>
                        {item.isCorrect ? (
                          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                        ) : (
                          <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                        )}
                      </div>

                      <h4 className="text-sm font-bold text-slate-900 mb-3">
                        {item.question}
                      </h4>

                      {/* Options Review */}
                      <div className="space-y-2 mb-4">
                        {item.options.map((opt, oIdx) => {
                          const isUserChoice = item.userSelected === oIdx;
                          const isCorrectChoice = item.correctAnswerIndex === oIdx;

                          let stateClasses = 'border-slate-200 bg-white text-slate-700';
                          if (isCorrectChoice) {
                            stateClasses = 'border-emerald-400 bg-emerald-50 text-emerald-900 font-semibold';
                          } else if (isUserChoice && !item.isCorrect) {
                            stateClasses = 'border-rose-300 bg-rose-50 text-rose-900 line-through';
                          }

                          return (
                            <div
                              key={oIdx}
                              className={`p-3 rounded-xl border text-xs flex items-center justify-between ${stateClasses}`}
                            >
                              <div className="flex items-center gap-2.5">
                                <span className="font-bold opacity-75">
                                  {optionLetters[oIdx]}.
                                </span>
                                <span>{opt}</span>
                              </div>

                              {isCorrectChoice && (
                                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded">
                                  Correct Choice
                                </span>
                              )}
                              {isUserChoice && !isCorrectChoice && (
                                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 bg-rose-100 px-2 py-0.5 rounded">
                                  Your Choice
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Pedagogical Explanation */}
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1">
                        <span className="font-bold text-slate-900 flex items-center gap-1.5">
                          <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
                          Explanation & Concept Analysis:
                        </span>
                        <p className="leading-relaxed pl-5">{item.explanation}</p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )
      )}

      {/* Confirmation Dialog Before Submit */}
      {showConfirmSubmit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 text-slate-800 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Submit Quiz Attempt?</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              {answeredCount < totalQ ? (
                <span className="text-amber-700 font-medium">
                  Notice: You have only answered {answeredCount} out of {totalQ} questions. Unanswered questions will be scored as incorrect.
                </span>
              ) : (
                'You have answered all questions. Ready to view your score and detailed explanations?'
              )}
            </p>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowConfirmSubmit(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Keep Reviewing
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer disabled:opacity-50"
              >
                {submitting ? 'Scoring...' : 'Confirm Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
