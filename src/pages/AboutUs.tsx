import React, { useState } from 'react';
import {
  Brain,
  Sparkles,
  Target,
  ShieldCheck,
  GraduationCap,
  Users,
  CheckCircle2,
  ArrowRight,
  BookOpen,
  Award,
  Zap,
  Lightbulb,
  HeartHandshake,
  Compass,
  FileCheck,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Cpu,
  Lock,
  Clock,
  School,
} from 'lucide-react';

interface AboutUsProps {
  onGetStarted: () => void;
  onNavigateHome: () => void;
}

export const AboutUs: React.FC<AboutUsProps> = ({
  onGetStarted,
  onNavigateHome,
}) => {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  const corePillars = [
    {
      icon: <Brain className="w-6 h-6 text-blue-600" />,
      title: 'Active Recall & Testing Effect',
      tagline: 'Neuroscience-backed learning',
      description:
        'Cognitive science proves that testing yourself produces significantly greater long-term retention than passive re-reading. StudyMate turns dense notes into instant interactive quizzes so you build durable neural retrieval pathways.',
      badge: 'Cognitive Science',
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200/60',
    },
    {
      icon: <Target className="w-6 h-6 text-emerald-600" />,
      title: 'Cognitive Load Reduction',
      tagline: 'Structured multi-tier hierarchy',
      description:
        'Working memory is easily overwhelmed by dense 60-page slide decks and heavy textbooks. Our 4-tier summary engine structures information hierarchically—from executive overviews to rigorous formula checklists—preventing mental fatigue.',
      badge: 'Information Architecture',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
    },
    {
      icon: <Cpu className="w-6 h-6 text-indigo-600" />,
      title: 'Zero-Hallucination Grounding',
      tagline: 'Strict source material fidelity',
      description:
        'General AI chatbots often hallucinate facts and invent answers. StudyMate uses strict context bounding: summaries, key takeaways, and quiz questions are synthesized strictly from the student’s uploaded documents.',
      badge: 'Academic Accuracy',
      badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200/60',
    },
    {
      icon: <Lock className="w-6 h-6 text-emerald-600" />,
      title: 'Complete Privacy & Academic Integrity',
      tagline: 'Your notes remain your intellectual property',
      description:
        'We never sell student documents or train public foundation models on private course notes. All text extractions are processed securely and isolated per user with one-click full data deletion.',
      badge: 'Student Privacy',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
    },
  ];

  const milestones = [
    {
      year: 'Vision',
      title: 'The Student Overload Dilemma',
      description:
        'Founded by students and educators exhausted by passive highlighting and 80-hour exam week cram sessions that resulted in rapid forgetting.',
    },
    {
      year: 'Pedagogy',
      title: 'Blending AI with the Testing Effect',
      description:
        'Formulated the 4-tier progressive summary taxonomy and auto-distractor quiz generation methodology grounded in university cognitive psychology research.',
    },
    {
      year: 'Architecture',
      title: 'Dual Engine Support: Gemini & OpenRouter',
      description:
        'Engineered seamless multi-model intelligence, enabling learners to switch between Google Gemini and OpenRouter models with custom user API keys and private sessions.',
    },
    {
      year: 'Today',
      title: 'Empowering Learners Across 50+ Institutions',
      description:
        'Helping high schoolers, undergraduates, medical students, and bar exam candidates prepare smarter and retain knowledge with confidence.',
    },
  ];

  const teamMembers = [
    {
      name: 'Dr. Elena Vance, Ph.D.',
      role: 'Head of Learning Sciences',
      bio: 'Former university professor and cognitive researcher specializing in retrieval practice and spaced repetition systems.',
      avatarBg: 'from-blue-600 to-indigo-600',
      initials: 'EV',
      focus: 'Pedagogical Frameworks',
    },
    {
      name: 'Marcus Chen',
      role: 'Lead AI & NLP Architect',
      bio: 'Ex-EdTech NLP lead dedicated to zero-hallucination document extraction and context-bounded synthesis.',
      avatarBg: 'from-emerald-600 to-teal-600',
      initials: 'MC',
      focus: 'Multi-Model Pipeline',
    },
    {
      name: 'Maya Patel',
      role: 'Product & Student Experience',
      bio: 'Passionate about accessible UI design, distraction-free study workflows, and high-retention student learning dashboards.',
      avatarBg: 'from-sky-600 to-blue-700',
      initials: 'MP',
      focus: 'UX & Accessibility',
    },
    {
      name: 'David O’Connor',
      role: 'Security & Academic Integrity',
      bio: 'Specialist in student data privacy, in-memory parsing architectures, and transparent educational technology.',
      avatarBg: 'from-emerald-700 to-teal-800',
      initials: 'DO',
      focus: 'Privacy & Compliance',
    },
  ];

  const faqs = [
    {
      question: 'What is StudyMate and how is it different from standard AI chatbots?',
      answer:
        'Standard conversational chatbots frequently make up citations, lack educational structure, and require complex manual prompting. StudyMate is a dedicated learning platform: you upload your real study materials (PDF, DOCX, TXT), and our pipeline extracts the content, synthesizes structured 4-tier summaries, and automatically builds interactive self-testing quizzes with rationale explanations for each option.',
    },
    {
      question: 'How does StudyMate help improve my exam scores and retention?',
      answer:
        'StudyMate is built on the well-researched "Testing Effect" and active recall. Rather than repeatedly re-reading your notes (which creates a false illusion of competence), StudyMate forces your brain to retrieve knowledge through adaptive multiple-choice and true/false quizzes, reinforcing memory pathways right after reading.',
    },
    {
      question: 'Is my uploaded coursework or textbook private?',
      answer:
        'Yes, absolutely. Your uploaded files and generated study materials are isolated strictly to your account. We do not sell your personal data, nor do we feed student coursework or lecture slides into public training datasets.',
    },
    {
      question: 'What document formats are supported?',
      answer:
        'StudyMate supports PDF documents (textbooks, lecture slides, research papers), Microsoft Word documents (.docx), and plain text files (.txt). The text is parsed cleanly in-memory, preserving key headings and conceptual flow.',
    },
    {
      question: 'Can educators or study groups use StudyMate?',
      answer:
        'Yes! Many educators and teaching assistants use StudyMate to rapidly draft formative assessment quizzes and review summaries for their lectures. Students can also review quizzes together or retry questions until achieving 100% mastery.',
    },
    {
      question: 'Which AI models power the summaries and quizzes?',
      answer:
        'StudyMate supports Google Gemini AI models and OpenRouter models (including Llama 3.3, Gemini 2.0 Flash, and DeepSeek). You can even plug in your own API keys in Settings if you want custom model control.',
    },
  ];

  return (
    <div className="bg-slate-50 min-h-screen text-slate-900">
      {/* Hero Banner Section */}
      <section className="relative overflow-hidden pt-14 pb-20 md:pt-20 md:pb-24 bg-gradient-to-b from-blue-50/50 via-white to-emerald-50/30 border-b border-slate-200/60">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[340px] bg-gradient-to-tr from-blue-400/10 via-emerald-400/10 to-transparent blur-3xl pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            {/* Breadcrumb / Kicker */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 rounded-full border border-emerald-200/80 mb-6 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>About StudyMate & Our Educational Philosophy</span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.18]">
              Empowering Students to Learn{' '}
              <span className="bg-gradient-to-r from-blue-600 via-sky-600 to-emerald-600 bg-clip-text text-transparent">
                Smarter, Not Harder.
              </span>
            </h1>

            <p className="mt-4 text-base sm:text-lg font-bold text-emerald-700 tracking-wide uppercase">
              Learn Smarter · Prepare Better · Achieve More
            </p>

            <p className="mt-5 text-base sm:text-lg text-slate-600 leading-relaxed">
              StudyMate was founded with a singular purpose: to bridge the gap between heavy academic
              materials and cognitive science. We convert lecture slides, textbooks, and notes into
              structured revision packs and adaptive quizzes that reinforce active recall.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <button
                onClick={onGetStarted}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white font-semibold text-sm shadow-md shadow-blue-500/20 transition-all transform hover:-translate-y-0.5 cursor-pointer"
              >
                <span>Get Started Free</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={onNavigateHome}
                className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl bg-white border border-slate-200 hover:border-slate-300 text-slate-800 font-semibold text-sm hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
              >
                <span>Return to Home</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Strip */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs text-center">
              <div className="text-2xl sm:text-3xl font-black text-blue-600">45,000+</div>
              <div className="text-xs font-semibold text-slate-600 mt-1">Study Hours Saved</div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs text-center">
              <div className="text-2xl sm:text-3xl font-black text-emerald-600">98.4%</div>
              <div className="text-xs font-semibold text-slate-600 mt-1">Retention Boost</div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs text-center">
              <div className="text-2xl sm:text-3xl font-black text-indigo-600">120,000+</div>
              <div className="text-xs font-semibold text-slate-600 mt-1">Quizzes Practiced</div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs text-center">
              <div className="text-2xl sm:text-3xl font-black text-amber-600">50+</div>
              <div className="text-xs font-semibold text-slate-600 mt-1">Schools & Campuses</div>
            </div>
          </div>
        </div>
      </section>

      {/* The Problem & The Solution Comparison */}
      <section className="py-20 bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200/60">
              Why We Built StudyMate
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Tackling the Flaws of Traditional Study Habits
            </h2>
            <p className="mt-4 text-base text-slate-600">
              Most students are taught to reread chapters and underline text. Cognitive psychology has shown
              this creates a dangerous "illusion of competence." Here is how StudyMate changes the game.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* The Old Way */}
            <div className="p-8 rounded-3xl bg-rose-50/50 border border-rose-200/60 space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-bold">
                <span>The Traditional Way (Passive)</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900">
                Passive Re-reading & Cramming
              </h3>
              <ul className="space-y-3 text-sm text-slate-700">
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-500 font-bold">✕</span>
                  <span><strong>The Forgetting Curve:</strong> Without self-testing, students lose up to 70% of new information within 24 hours.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-500 font-bold">✕</span>
                  <span><strong>Highlighter Trap:</strong> Coloring lines of text feels productive, but provides zero memory retrieval practice.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-500 font-bold">✕</span>
                  <span><strong>Information Overload:</strong> 80-page slide decks cause cognitive exhaustion and anxiety before exam day.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-500 font-bold">✕</span>
                  <span><strong>Generic Chatbots:</strong> Unbounded AI models fabricate facts and lack curriculum alignment.</span>
                </li>
              </ul>
            </div>

            {/* The StudyMate Way */}
            <div className="p-8 rounded-3xl bg-emerald-50/60 border border-emerald-200 space-y-5 shadow-xs">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-bold">
                <span>The StudyMate Way (Active)</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900">
                Active Recall & Progressive Chunking
              </h3>
              <ul className="space-y-3 text-sm text-slate-700">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>The Testing Effect:</strong> Adaptive quizzes challenge you to retrieve knowledge, cementing long-term synaptic connections.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>4-Tier Progressive Summaries:</strong> Break dense chapters into Concise, Standard, Detailed, or Exam-ready formats.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Immediate Feedback:</strong> Comprehensive explanations clarify why each distractor is wrong and why the answer is right.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Document-Bound Accuracy:</strong> AI outputs are anchored strictly inside your uploaded lecture materials.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 4 Core Pedagogical Pillars */}
      <section className="py-20 bg-slate-50 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200/60">
              Our Educational Principles
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Grounded in How the Human Brain Learns
            </h2>
            <p className="mt-4 text-base text-slate-600">
              Every interface element, prompt template, and summary tier in StudyMate is guided
              by evidence-based pedagogical standards.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {corePillars.map((pillar, idx) => (
              <div
                key={idx}
                className="bg-white rounded-3xl p-7 sm:p-8 border border-slate-200/80 shadow-2xs hover:shadow-md transition-all space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center">
                    {pillar.icon}
                  </div>
                  <span className={`text-[11px] font-bold px-3 py-1 rounded-full border ${pillar.badgeColor}`}>
                    {pillar.badge}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{pillar.title}</h3>
                  <p className="text-xs font-semibold text-emerald-700 mt-0.5">{pillar.tagline}</p>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {pillar.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Technical Architecture & Extraction Pipeline */}
      <section className="py-20 bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200/60">
              Under The Hood
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Our 4-Stage Document Intelligence Pipeline
            </h2>
            <p className="mt-4 text-base text-slate-600">
              How StudyMate turns raw student documents into high-yield educational assets in seconds.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-6xl mx-auto">
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3 relative">
              <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center">
                01
              </div>
              <h4 className="text-base font-bold text-slate-900">In-Memory Ingestion</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Raw PDF, DOCX, or TXT uploads are parsed in-memory without persistent external leakage. Text is normalized and cleaned.
              </p>
              <div className="text-[10px] font-semibold text-blue-600 uppercase tracking-wider">
                pdf-parse & mammoth
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3 relative">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center">
                02
              </div>
              <h4 className="text-base font-bold text-slate-900">Context Chunking</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Document text is structured into semantic sections, preserving headers, formulas, definitions, and conceptual dependencies.
              </p>
              <div className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider">
                Semantic Segmentation
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3 relative">
              <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center">
                03
              </div>
              <h4 className="text-base font-bold text-slate-900">Dual Engine Synthesis</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Prompt instructions strictly bound the model to the student’s text, generating hierarchical summaries and plausible distractors.
              </p>
              <div className="text-[10px] font-semibold text-indigo-600 uppercase tracking-wider">
                Gemini & OpenRouter
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3 relative">
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 font-bold text-xs flex items-center justify-center">
                04
              </div>
              <h4 className="text-base font-bold text-slate-900">Adaptive Interactive Play</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Quizzes are loaded into an interactive timed player with instant feedback, scoring breakdown, and attempt history retention.
              </p>
              <div className="text-[10px] font-semibold text-amber-600 uppercase tracking-wider">
                Interactive Player
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Journey & Milestones */}
      <section className="py-20 bg-slate-50 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200/60">
              Our Journey
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              From Classroom Frustration to Intelligent Study Companion
            </h2>
            <p className="mt-4 text-base text-slate-600">
              The steps that brought StudyMate from a prototype to a daily study companion for thousands.
            </p>
          </div>

          <div className="max-w-4xl mx-auto space-y-6">
            {milestones.map((item, idx) => (
              <div
                key={idx}
                className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center gap-5"
              >
                <div className="shrink-0 w-20 px-3 py-2 rounded-xl bg-blue-50 text-blue-700 font-black text-xs text-center border border-blue-200/50">
                  {item.year}
                </div>
                <div className="flex-1 space-y-1">
                  <h3 className="text-base font-bold text-slate-900">{item.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Academic Advisory & Team */}
      <section className="py-20 bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200/60">
              Our Team & Advisors
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Passionate Educators & Engineers
            </h2>
            <p className="mt-4 text-base text-slate-600">
              United by a commitment to make rigorous study tools accessible, ethical, and delightful for every learner.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {teamMembers.map((member, idx) => (
              <div
                key={idx}
                className="bg-slate-50 p-6 rounded-2xl border border-slate-200/80 text-center space-y-3 hover:bg-white hover:shadow-md transition-all"
              >
                <div
                  className={`w-16 h-16 rounded-2xl mx-auto bg-gradient-to-tr ${member.avatarBg} text-white font-black text-xl flex items-center justify-center shadow-md shadow-slate-200`}
                >
                  {member.initials}
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900">{member.name}</h4>
                  <p className="text-xs font-semibold text-emerald-700 mt-0.5">{member.role}</p>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{member.bio}</p>
                <div className="pt-2">
                  <span className="inline-block text-[10px] font-semibold text-slate-500 bg-white px-2.5 py-1 rounded-md border border-slate-200">
                    {member.focus}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive FAQ Section */}
      <section className="py-20 bg-slate-50 border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200/60">
              Frequently Asked Questions
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Everything You Need to Know
            </h2>
            <p className="mt-4 text-base text-slate-600">
              Clear answers regarding privacy, academic policies, AI integrations, and daily usage.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div
                  key={index}
                  className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-2xs transition-all"
                >
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full px-6 py-5 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/50 transition-colors"
                  >
                    <span className="text-sm sm:text-base font-bold text-slate-900">
                      {faq.question}
                    </span>
                    <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 text-slate-600">
                      {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-5 text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Final Call to Action */}
      <section className="py-20 bg-gradient-to-br from-[#08182b] via-[#0b2440] to-[#08182b] text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-emerald-300 bg-emerald-950/60 rounded-full border border-emerald-500/30">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Ready to Elevate Your Academic Success?</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Stop Cramming. Start Mastering with StudyMate.
          </h2>

          <p className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            Join thousands of ambitious students turning dense course materials into structured study packs
            and high-retention practice tests in minutes.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={onGetStarted}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-white font-bold text-sm shadow-xl shadow-blue-500/20 transition-all transform hover:-translate-y-0.5 cursor-pointer"
            >
              <span>Create Free Account</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={onNavigateHome}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-sm border border-white/20 transition-colors cursor-pointer"
            >
              <span>Return to Home</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
