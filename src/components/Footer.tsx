import React, { useState } from 'react';
import { BookOpen, Heart, Mail, Shield, Sparkles } from 'lucide-react';
import { Logo } from './Logo.js';

interface FooterProps {
  onNavigate?: (view: 'home' | 'about' | 'dashboard') => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const [modalContent, setModalContent] = useState<{ title: string; body: string } | null>(null);

  const handleNav = (view: 'home' | 'about' | 'dashboard') => {
    if (onNavigate) {
      onNavigate(view);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSection = (id: string) => {
    if (onNavigate) {
      onNavigate('home');
      setTimeout(() => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    }
  };

  const openPrivacy = () => {
    setModalContent({
      title: 'Privacy Policy',
      body: `StudyMate is built with student privacy and academic integrity as top priorities.
1. Data Ownership: Your study notes, uploaded PDFs, DOCXs, and generated materials remain your private property.
2. Isolated Storage: User documents and quiz attempts are isolated by authenticated user ID.
3. Secure Processing: Document text is parsed in-memory for summary and quiz synthesis. No data is sold to third parties or used to train public foundational models.
4. Retention: You can delete any uploaded document, summary, or quiz from your workspace at any time.`,
    });
  };

  const openTerms = () => {
    setModalContent({
      title: 'Terms of Service',
      body: `Welcome to StudyMate!
1. Intended Use: StudyMate is an educational companion engineered to assist students in summarizing their coursework, understanding complex concepts, and practicing test readiness.
2. Academic Integrity: StudyMate should be utilized as a study aid to enhance your comprehension, test retention, and revisions.
3. Availability: AI-generated summaries and quizzes are synthesized from the textual content you upload.`,
    });
  };

  const openContact = () => {
    setModalContent({
      title: 'Contact StudyMate Support',
      body: `Need assistance or have feedback on AI summary or quiz generation?
Email: support@studymate.ai or academic@studymate.edu
Response time: Typically within 24 hours.`,
    });
  };

  return (
    <footer className="bg-[#08182b] text-slate-400 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand Column */}
          <div className="md:col-span-2 space-y-4">
            <button
              onClick={() => handleNav('home')}
              className="text-left cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-xl"
            >
              <Logo size="md" theme="dark" showWordmark={true} showSubtitle={false} />
            </button>
            <p className="text-sm text-slate-200 font-medium leading-relaxed max-w-sm">
              Your AI-Powered Learning Companion.
            </p>
            <p className="text-xs text-emerald-400 font-semibold tracking-wide uppercase">
              Learn Smarter · Prepare Better · Achieve More
            </p>
            <p className="text-xs text-slate-400 leading-relaxed max-w-md">
              StudyMate converts complex textbooks, lecture slides, and notes into crystal-clear structured summaries and interactive quizzes using cutting-edge AI.
            </p>
            <div className="pt-1 flex items-center gap-3">
              <button
                onClick={() => handleNav('about')}
                className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 underline underline-offset-4 cursor-pointer"
              >
                Learn our story & pedagogy in About Us →
              </button>
            </div>
          </div>

          {/* Platform & Company Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Pages & Platform</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => handleNav('home')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Home
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav('about')}
                  className="hover:text-white transition-colors cursor-pointer text-left text-emerald-400 font-semibold"
                >
                  About Us (Mission & Science)
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleSection('features')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  AI Summaries (4 Levels)
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleSection('features')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Interactive Quiz Engine
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleSection('how-it-works')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  How It Works
                </button>
              </li>
            </ul>
          </div>

          {/* Legal & Support Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Support & Legal</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={openPrivacy} className="hover:text-white transition-colors cursor-pointer text-left">
                  Privacy Policy
                </button>
              </li>
              <li>
                <button onClick={openTerms} className="hover:text-white transition-colors cursor-pointer text-left">
                  Terms of Service
                </button>
              </li>
              <li>
                <button onClick={openContact} className="hover:text-white transition-colors cursor-pointer text-left">
                  Contact Support
                </button>
              </li>
              <li>
                <span className="text-slate-400">v2.4.0 · OpenRouter & Gemini</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} StudyMate. All rights reserved.</p>
          <p className="flex items-center gap-1.5 text-slate-400">
            Engineered for students, educators, and lifelong learners worldwide.
          </p>
        </div>
      </div>

      {/* Info Modal */}
      {modalContent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 text-slate-800">
            <h3 className="text-lg font-bold text-slate-900 mb-3">{modalContent.title}</h3>
            <div className="text-xs text-slate-600 whitespace-pre-line leading-relaxed mb-6 max-h-80 overflow-y-auto">
              {modalContent.body}
            </div>
            <button
              onClick={() => setModalContent(null)}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs cursor-pointer transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </footer>
  );
};
