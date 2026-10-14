import React from 'react';
import {
  FileText,
  BookOpen,
  HelpCircle,
  BarChart3,
  Sliders,
  ShieldCheck,
  CheckCircle,
  Copy,
  Download,
  RotateCcw,
} from 'lucide-react';

export const Features: React.FC = () => {
  const features = [
    {
      icon: <FileText className="w-6 h-6 text-blue-600" />,
      title: 'Real Document Processing',
      description:
        'Upload PDF files, Microsoft Word (.docx), or plain text (.txt). StudyMate extracts the actual readable text cleanly without cutting off complex sentences or headings.',
      meta: 'PDF · DOCX · TXT · In-Memory Parsing',
    },
    {
      icon: <BookOpen className="w-6 h-6 text-emerald-600" />,
      title: '4-Tier AI Summaries',
      description:
        'Tailor your study experience from quick exam crams to comprehensive textbook breakdowns with 4 precise depth levels (Concise, Standard, Detailed, Very Detailed).',
      meta: 'Overview · Key Points · Formulas · Revision Notes',
    },
    {
      icon: <HelpCircle className="w-6 h-6 text-blue-600" />,
      title: 'Dynamic Quiz Generator',
      description:
        'Generate 5, 10, 15, or 20 questions across Easy, Medium, or Hard difficulty. Choose Multiple-Choice, True/False, or mixed question formats based on your material.',
      meta: 'Adaptive Difficulty · MCQs · True/False',
    },
    {
      icon: <RotateCcw className="w-6 h-6 text-emerald-600" />,
      title: 'Interactive Quiz Player',
      description:
        'Answer questions with a built-in timer, progress tracking, and instant automated scoring. Receive in-depth pedagogical explanations for every single option.',
      meta: 'Automated Scoring · Explanations · Retry Mode',
    },
    {
      icon: <BarChart3 className="w-6 h-6 text-blue-600" />,
      title: 'Score Tracking & History',
      description:
        'Track every quiz attempt and monitor your mastery percentage over time. Review past mistakes to guarantee solid retention before finals.',
      meta: 'Historical Attempts · Percentage · Review Mistakes',
    },
    {
      icon: <Sliders className="w-6 h-6 text-emerald-600" />,
      title: 'OpenRouter & Gemini AI Engines',
      description:
        'Powered by real AI models. Supports OpenRouter API (Llama 3.3, Gemini 2.0, DeepSeek) and Gemini API, with secure server-side key management.',
      meta: 'Zero Fake Responses · Strict Verification',
    },
  ];

  return (
    <section id="features" className="py-20 bg-slate-50 border-y border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200/60">
            Engineered For Academic Success
          </span>
          <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Everything You Need To Master Any Subject
          </h2>
          <p className="mt-4 text-base text-slate-600">
            StudyMate replaces tedious manual note-taking with intelligent, structured study aids designed to maximize retention.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl p-6 sm:p-7 shadow-xs hover:shadow-md transition-shadow border border-slate-200/80 flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-5">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-bold text-slate-900 tracking-tight mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 text-[11px] font-semibold text-slate-600 tracking-wide">
                {feature.meta}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
