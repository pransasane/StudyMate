import React from 'react';
import { UploadCloud, FileEdit, Award, CheckCircle, ArrowRight } from 'lucide-react';

interface HowItWorksProps {
  onGetStarted: () => void;
}

export const HowItWorks: React.FC<HowItWorksProps> = ({ onGetStarted }) => {
  const steps = [
    {
      num: '01',
      title: 'Upload Study Material',
      desc: 'Drag and drop your PDF slides, Word documents (.docx), text files, or paste lecture notes directly. StudyMate instantly extracts and validates the text.',
      icon: <UploadCloud className="w-6 h-6 text-blue-600" />,
      tag: 'Text Extraction & Analysis',
    },
    {
      num: '02',
      title: 'Generate Summaries & Quizzes',
      desc: 'Select your preferred depth level (Concise, Standard, Detailed, or Very Detailed) or configure an interactive 5-20 question quiz with custom difficulty.',
      icon: <FileEdit className="w-6 h-6 text-emerald-600" />,
      tag: 'AI Synthesis Engine',
    },
    {
      num: '03',
      title: 'Test Your Knowledge & Retain',
      desc: 'Take interactive quizzes with live timers, see immediate automated scoring, learn from comprehensive concept explanations, and track your study progress.',
      icon: <Award className="w-6 h-6 text-blue-600" />,
      tag: 'Active Recall & Retention',
    },
  ];

  return (
    <>
      <section id="how-it-works" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200/60">
              Simple 3-Step Workflow
            </span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              How StudyMate Powers Your Learning
            </h2>
            <p className="mt-4 text-base text-slate-600">
              From raw notes to comprehensive mastery in under two minutes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {steps.map((step, idx) => (
              <div
                key={idx}
                className="relative bg-slate-50/70 rounded-2xl p-7 border border-slate-200/80 hover:border-emerald-300 transition-all group"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="w-12 h-12 rounded-xl bg-white shadow-xs border border-slate-200 flex items-center justify-center group-hover:scale-105 transition-transform">
                    {step.icon}
                  </div>
                  <span className="text-2xl font-black text-slate-300 font-mono">
                    {step.num}
                  </span>
                </div>

                <div className="text-[11px] font-semibold text-emerald-700 mb-1">
                  {step.tag}
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>

          {/* Call to action bar */}
          <div className="mt-16 bg-gradient-to-r from-[#091e3a] via-blue-700 to-emerald-600 rounded-2xl p-8 sm:p-10 text-white shadow-lg shadow-blue-500/15 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-1 text-center sm:text-left">
              <h3 className="text-2xl font-bold">Ready to boost your exam performance?</h3>
              <p className="text-blue-100 text-sm">
                Join thousands of students studying smarter with AI-driven summaries and quizzes.
              </p>
            </div>
            <button
              onClick={onGetStarted}
              className="px-6 py-3.5 rounded-xl bg-white text-slate-900 hover:bg-slate-50 font-bold text-sm shadow-md transition-colors whitespace-nowrap cursor-pointer inline-flex items-center gap-2"
            >
              <span>Get Started Now</span>
              <ArrowRight className="w-4 h-4 text-emerald-600" />
            </button>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-slate-50 border-t border-slate-200/60">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200/60">
            About StudyMate
          </span>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Built On The Science of Active Recall
          </h2>
          <p className="text-base text-slate-600 leading-relaxed">
            Passive reading and highlighting have been proven to deliver the lowest rates of long-term memory retention. StudyMate was built around the proven cognitive principles of <strong>active recall</strong>, <strong>spaced repetition</strong>, and <strong>synthesis</strong>.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 text-left">
            <div className="bg-white p-5 rounded-xl border border-slate-200">
              <h4 className="font-bold text-slate-900 text-sm mb-1">Synthesize</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Break lengthy chapters into clear, hierarchically structured sections with key definitions and formulas.
              </p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-200">
              <h4 className="font-bold text-slate-900 text-sm mb-1">Test</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Force memory retrieval through interactive multiple-choice and true/false quizzes generated from your source material.
              </p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-200">
              <h4 className="font-bold text-slate-900 text-sm mb-1">Master</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Diagnose knowledge gaps through detailed answer rationales and track your score progression over time.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};
