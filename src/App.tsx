import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { Navbar } from './components/Navbar.js';
import { Footer } from './components/Footer.js';
import { AuthModal } from './components/AuthModal.js';
import { DocumentUploadModal } from './components/DocumentUploadModal.js';
import { SummaryGeneratorModal } from './components/SummaryGeneratorModal.js';
import { QuizGeneratorModal } from './components/QuizGeneratorModal.js';
import { SummaryViewer } from './components/SummaryViewer.js';
import { QuizPlayer } from './components/QuizPlayer.js';
import { SettingsModal } from './components/SettingsModal.js';
import { Dashboard } from './pages/Dashboard.js';
import { Home } from './pages/Home.js';
import { AboutUs } from './pages/AboutUs.js';
import { Document, Summary, Quiz, QuizAttempt } from './types/index.js';
import { api } from './services/api.js';
import { firestoreService } from './services/firebase.js';

function StudyMateApp() {
  const { user } = useAuth();

  // Navigation views
  const [currentView, setCurrentView] = useState<'home' | 'about' | 'dashboard'>('home');
  const [activeSummary, setActiveSummary] = useState<Summary | null>(null);
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);

  // Modals state
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [summaryGenModalOpen, setSummaryGenModalOpen] = useState(false);
  const [quizGenModalOpen, setQuizGenModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);

  // Contextual pre-selections
  const [targetDocId, setTargetDocId] = useState<string | undefined>(undefined);
  const [targetSummaryId, setTargetSummaryId] = useState<string | undefined>(undefined);
  const [documentsCache, setDocumentsCache] = useState<Document[]>([]);
  const [summariesCache, setSummariesCache] = useState<Summary[]>([]);

  // Fetch documents and summaries cache for modals
  const refreshLibraryCache = async () => {
    if (!user) return;
    try {
      const [docsRes, sumRes] = await Promise.all([
        api.getDocuments().catch(() => ({ documents: [] })),
        api.getSummaries().catch(() => ({ summaries: [] })),
      ]);
      setDocumentsCache(docsRes.documents);
      setSummariesCache(sumRes.summaries);
    } catch (e) {
      console.warn('Failed to refresh library cache:', e);
    }
  };

  const handleOpenAuth = (mode: 'login' | 'register' = 'login') => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  const handleOpenUpload = () => {
    if (!user) {
      handleOpenAuth('register');
      return;
    }
    setUploadModalOpen(true);
  };

  const handleOpenSummaryGen = async (docId?: string) => {
    if (!user) {
      handleOpenAuth('login');
      return;
    }
    if (docId) setTargetDocId(docId);
    setSummaryGenModalOpen(true);
    refreshLibraryCache();
  };

  const handleOpenQuizGen = async (docId?: string, summaryId?: string) => {
    if (!user) {
      handleOpenAuth('login');
      return;
    }
    if (docId) setTargetDocId(docId);
    if (summaryId) setTargetSummaryId(summaryId);
    setQuizGenModalOpen(true);
    refreshLibraryCache();
  };

  // Upload modal completion handler
  const handleDocumentUploaded = (doc: Document, nextAction?: 'summary' | 'quiz') => {
    setUploadModalOpen(false);
    setDocumentsCache((prev) => [doc, ...prev.filter((d) => d.id !== doc.id)]);
    setTargetDocId(doc.id);
    refreshLibraryCache();
    setCurrentView('dashboard');

    if (nextAction === 'summary') {
      setTimeout(() => {
        handleOpenSummaryGen(doc.id);
      }, 100);
    } else if (nextAction === 'quiz') {
      setTimeout(() => {
        handleOpenQuizGen(doc.id);
      }, 100);
    }
  };

  const handleSummaryGenerated = (summary: Summary) => {
    setActiveSummary(summary);
    refreshLibraryCache();
  };

  const handleQuizGenerated = (quiz: Quiz) => {
    setActiveQuiz(quiz);
    refreshLibraryCache();
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-900 selection:bg-blue-100 selection:text-blue-900">
      {/* Top Navbar */}
      <Navbar
        onOpenAuth={handleOpenAuth}
        onOpenUpload={handleOpenUpload}
        onOpenSettings={() => setSettingsModalOpen(true)}
        currentView={currentView}
        setCurrentView={(view) => {
          setActiveSummary(null);
          setActiveQuiz(null);
          setCurrentView(view);
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {/* If Active Quiz is playing */}
        {activeQuiz ? (
          <QuizPlayer
            quiz={activeQuiz}
            onBack={() => {
              setActiveQuiz(null);
              setCurrentView('dashboard');
            }}
            onAttemptCompleted={() => {
              refreshLibraryCache();
            }}
          />
        ) : activeSummary ? (
          /* If Active Summary is open */
          <SummaryViewer
            summary={activeSummary}
            onBack={() => {
              setActiveSummary(null);
              setCurrentView('dashboard');
            }}
            onGenerateQuiz={(summaryId) => {
              handleOpenQuizGen(undefined, summaryId);
            }}
            onRegenerate={(s) => {
              handleOpenSummaryGen(s.documentId);
            }}
            onDelete={async (id) => {
              if (user) {
                await firestoreService.deleteSummary(user.id, id).catch(() => {});
              }
              await api.deleteSummary(id).catch(() => {});
              setActiveSummary(null);
              setCurrentView('dashboard');
            }}
          />
        ) : currentView === 'dashboard' && user ? (
          /* Student Workspace Dashboard */
          <Dashboard
            onOpenUpload={handleOpenUpload}
            onOpenSummaryGen={handleOpenSummaryGen}
            onOpenQuizGen={handleOpenQuizGen}
            onViewSummary={(summary) => setActiveSummary(summary)}
            onPlayQuiz={(quiz) => setActiveQuiz(quiz)}
            onOpenSettings={() => setSettingsModalOpen(true)}
          />
        ) : currentView === 'about' ? (
          /* About Us Page */
          <AboutUs
            onGetStarted={() => handleOpenAuth('register')}
            onNavigateHome={() => {
              setCurrentView('home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        ) : (
          /* Dedicated Home Page */
          <Home
            onGetStarted={() => handleOpenAuth('register')}
            onSignIn={() => handleOpenAuth('login')}
            onUploadClick={handleOpenUpload}
          />
        )}
      </main>

      {/* Educational Footer */}
      <Footer
        onNavigate={(view) => {
          setActiveSummary(null);
          setActiveQuiz(null);
          setCurrentView(view);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Modals */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authMode}
        onSuccess={() => {
          setCurrentView('dashboard');
          refreshLibraryCache();
        }}
      />

      <DocumentUploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onSuccess={handleDocumentUploaded}
      />

      <SummaryGeneratorModal
        isOpen={summaryGenModalOpen}
        onClose={() => setSummaryGenModalOpen(false)}
        documents={documentsCache}
        selectedDocumentId={targetDocId}
        onSummaryGenerated={handleSummaryGenerated}
        onOpenSettings={() => setSettingsModalOpen(true)}
      />

      <QuizGeneratorModal
        isOpen={quizGenModalOpen}
        onClose={() => setQuizGenModalOpen(false)}
        documents={documentsCache}
        summaries={summariesCache}
        defaultDocumentId={targetDocId}
        defaultSummaryId={targetSummaryId}
        onQuizGenerated={handleQuizGenerated}
        onOpenSettings={() => setSettingsModalOpen(true)}
      />

      <SettingsModal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <StudyMateApp />
    </AuthProvider>
  );
}
