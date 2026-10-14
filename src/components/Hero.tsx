import React from 'react';
import { useAuth } from '../context/AuthContext.js';
import {
  Sparkles,
  ArrowRight,
  FileCheck,
  Brain,
  CheckCircle2,
  BookOpen,
  Award,
  Layers,
  Zap,
} from 'lucide-react';

interface HeroProps {
  onGetStarted: () => void;
  onSignIn?: () => void;
  onUploadClick: () => void;
}

export const Hero: React.FC<HeroProps> = ({
  onGetStarted,
  onSignIn,
  onUploadClick,
}) => {
  const { user } = useAuth();

  return (
    <div className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28 bg-gradient-to-b from-blue-50/40 via-white to-emerald-50/20">
      {/* Subtle background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[850px] h-[360px] bg-gradient-to-tr from-blue-400/10 via-emerald-400/10 to-transparent blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto">
          {/* Tagline kicker */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 rounded-full border border-emerald-200/80 mb-6 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>AI-Powered Learning & Exam Preparation</span>
          </div>

          {/* Main Hero Heading */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
            Turn Your Study Material Into{' '}
            <span className="bg-gradient-to-r from-blue-600 via-sky-600 to-emerald-600 bg-clip-text text-transparent">
              Smarter Learning.
            </span>
          </h1>

          {/* Slogan */}
          <p className="mt-4 text-base sm:text-lg font-bold text-emerald-700 tracking-wide uppercase">
            Learn Smarter · Prepare Better · Achieve More
          </p>

          {/* Core Description */}
          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
            Upload textbooks, research papers, or lecture notes. StudyMate extracts the content and uses
            state-of-the-art AI to generate structured revision summaries and interactive self-testing quizzes in seconds.
          </p>

          {/* Action Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            {user ? (
              <button
                onClick={onUploadClick}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white font-semibold text-sm shadow-md shadow-blue-500/20 transition-all transform hover:-translate-y-0.5 cursor-pointer"
              >
                <Zap className="w-4 h-4 text-amber-300" />
                <span>Upload & Generate Study Pack</span>
                <ArrowRight className="w-4 h-4 ml-0.5" />
              </button>
            ) : (
              <>
                <button
                  onClick={onGetStarted}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white font-semibold text-sm shadow-md shadow-blue-500/20 transition-all transform hover:-translate-y-0.5 cursor-pointer"
                >
                  <span>Get Started for Free</span>
                  <ArrowRight className="w-4 h-4 ml-0.5" />
                </button>
                {onSignIn && (
                  <button
                    onClick={onSignIn}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white border border-slate-200 hover:border-slate-300 text-slate-800 font-semibold text-sm hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
                  >
                    <span>Sign In to Account</span>
                  </button>
                )}
              </>
            )}
          </div>

          {/* Highlights unboxed metadata */}
          <div className="mt-8 pt-6 border-t border-slate-100 flex flex-wrap items-center justify-center gap-y-2 gap-x-6 text-xs text-slate-600 font-medium">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-blue-600" />
              PDF, DOCX & TXT Extraction
            </span>
            <span className="text-slate-300">·</span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              4 Depth Levels of Summaries
            </span>
            <span className="text-slate-300">·</span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-blue-600" />
              Interactive MCQs with Explanations
            </span>
            <span className="text-slate-300">·</span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Private & Isolated Workspace
            </span>
          </div>
        </div>

        {/* Live Interactive Interactive Workflow Mockup */}
        <div className="mt-14 max-w-5xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-200/80 overflow-hidden">
            {/* Window bar */}
            <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-400" />
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <div className="w-3 h-3 rounded-full bg-emerald-400" />
                <span className="ml-2 text-xs font-semibold text-slate-700">StudyMate Intelligent Engine</span>
              </div>
              <div className="text-xs text-slate-600 font-mono">
                Real-Time Document Pipeline
              </div>
            </div>

            {/* Split comparison preview */}
            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-100">
              {/* Step 1: Upload */}
              <div className="p-6 bg-slate-50/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Step 1 · Extract</span>
                  <FileCheck className="w-4 h-4 text-blue-600" />
                </div>
                <h4 className="text-sm font-bold text-slate-900">Your Document Content</h4>
                <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 text-xs text-slate-600 space-y-2 font-mono">
                  <div className="flex items-center justify-between font-sans text-slate-900 font-semibold border-b border-slate-100 pb-1.5">
                    <span>cellular_respiration.pdf</span>
                    <span className="text-[11px] text-slate-600 font-normal">4.2 KB</span>
                  </div>
                  <p className="line-clamp-3 text-[11px] leading-relaxed">
                    Cellular respiration is the catabolic biochemical pathway by which aerobic organisms extract chemical energy...
                  </p>
                  <div className="text-[10px] text-blue-600 pt-1">
                    ✓ 512 words · Text extracted
                  </div>
                </div>
              </div>

              {/* Step 2: AI Summary */}
              <div className="p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Step 2 · Synthesize</span>
                  <BookOpen className="w-4 h-4 text-emerald-600" />
                </div>
                <h4 className="text-sm font-bold text-slate-900">Structured Study Summary</h4>
                <div className="bg-emerald-50/40 p-3.5 rounded-xl border border-emerald-100 text-xs text-slate-700 space-y-2">
                  <div className="font-semibold text-emerald-950 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                    Key Concepts & Formulas
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    <strong>Net Equation:</strong> C6H12O6 + 6 O2 → 6 CO2 + 6 H2O + 30-32 ATP.
                  </p>
                  <ul className="text-[11px] text-slate-600 space-y-1 list-disc pl-3">
                    <li>Glycolysis: Cytosol, PFK-1 control</li>
                    <li>Krebs: 6 NADH + 2 FADH2 + 2 GTP</li>
                  </ul>
                </div>
              </div>

              {/* Step 3: Interactive Quiz */}
              <div className="p-6 bg-slate-50/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Step 3 · Test</span>
                  <Award className="w-4 h-4 text-emerald-600" />
                </div>
                <h4 className="text-sm font-bold text-slate-900">Adaptive Interactive Quiz</h4>
                <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 text-xs space-y-2">
                  <div className="text-[11px] font-semibold text-slate-900">
                    Q: Terminal electron acceptor at Complex IV?
                  </div>
                  <div className="space-y-1 text-[11px]">
                    <div className="p-1.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium flex items-center justify-between">
                      <span>✓ Molecular Oxygen (O2)</span>
                      <span className="text-[10px] text-emerald-700">Correct!</span>
                    </div>
                    <div className="p-1.5 rounded bg-slate-50 text-slate-500 line-through">
                      Carbon Dioxide (CO2)
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-600 pt-1">
                    Instant conceptual explanations included
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
