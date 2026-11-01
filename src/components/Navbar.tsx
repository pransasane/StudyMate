import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { Logo } from './Logo.js';
import {
  LayoutDashboard,
  LogOut,
  Settings,
  Menu,
  X,
  FileText,
} from 'lucide-react';

interface NavbarProps {
  onOpenAuth: (mode?: 'login' | 'register') => void;
  onOpenUpload: () => void;
  onOpenSettings: () => void;
  currentView: 'home' | 'about' | 'dashboard';
  setCurrentView: (view: 'home' | 'about' | 'dashboard') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenAuth,
  onOpenUpload,
  onOpenSettings,
  currentView,
  setCurrentView,
}) => {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const navigateTo = (view: 'home' | 'about' | 'dashboard') => {
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToSection = (sectionId: string) => {
    if (currentView !== 'home') {
      setCurrentView('home');
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    } else {
      const el = document.getElementById(sectionId);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 transition-colors shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Left: Brand Logo & Navigation */}
          <div className="flex items-center gap-8 lg:gap-10">
            <button
              onClick={() => navigateTo('home')}
              className="cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-xl shrink-0"
              title="StudyMate Home"
            >
              <Logo size="md" showSubtitle={true} />
            </button>

            {/* Desktop Navigation Links with Home and About Us */}
            <nav className="hidden md:flex items-center gap-6 lg:gap-8 pl-1">
              <button
                onClick={() => navigateTo('home')}
                className={`text-sm font-semibold transition-colors cursor-pointer py-1 ${
                  currentView === 'home'
                    ? 'text-blue-600 font-bold border-b-2 border-blue-600'
                    : 'text-slate-600 hover:text-blue-600'
                }`}
              >
                Home
              </button>
              <button
                onClick={() => navigateTo('about')}
                className={`text-sm font-semibold transition-colors cursor-pointer py-1 ${
                  currentView === 'about'
                    ? 'text-blue-600 font-bold border-b-2 border-blue-600'
                    : 'text-slate-600 hover:text-blue-600'
                }`}
              >
                About Us
              </button>
              <button
                onClick={() => navigateToSection('features')}
                className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors cursor-pointer py-1"
              >
                Features
              </button>
              <button
                onClick={() => navigateToSection('how-it-works')}
                className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors cursor-pointer py-1"
              >
                How It Works
              </button>
            </nav>
          </div>

          {/* Right Action Controls */}
          <div className="hidden md:flex items-center gap-3 lg:gap-4">
            {user ? (
              <>
                <button
                  onClick={onOpenUpload}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors cursor-pointer border border-blue-100/60"
                >
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span>Upload Material</span>
                </button>

                <button
                  onClick={() => setCurrentView('dashboard')}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl cursor-pointer transition-all ${
                    currentView === 'dashboard'
                      ? 'bg-gradient-to-r from-blue-600 to-emerald-600 text-white shadow-md shadow-blue-500/20 ring-2 ring-emerald-500/30'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Student Workspace</span>
                </button>

                {/* User Dropdown */}
                <div className="relative ml-1">
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center gap-2.5 p-1.5 pl-3 rounded-xl border border-slate-200 hover:border-slate-300 bg-white transition-colors cursor-pointer shadow-2xs"
                  >
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 via-sky-600 to-emerald-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                      {user.fullName.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-xs font-bold text-slate-800 max-w-[120px] truncate">
                      {user.fullName.split(' ')[0]}
                    </span>
                  </button>

                  {userDropdownOpen && (
                    <div
                      className="absolute right-0 mt-2.5 w-60 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-150"
                      onMouseLeave={() => setUserDropdownOpen(false)}
                    >
                      <div className="px-4 py-2.5 border-b border-slate-100">
                        <p className="text-xs font-bold text-slate-900 truncate">{user.fullName}</p>
                        <p className="text-[11px] text-slate-600 truncate">{user.email}</p>
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/50">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Firebase Synced
                          </span>
                          <span className="inline-block text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200/50">
                            {user.preferredProvider === 'openrouter' ? 'OpenRouter' : 'Gemini AI'}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          setCurrentView('dashboard');
                        }}
                        className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 cursor-pointer"
                      >
                        <LayoutDashboard className="w-4 h-4 text-blue-600" />
                        Workspace Dashboard
                      </button>

                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          onOpenSettings();
                        }}
                        className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 cursor-pointer"
                      >
                        <Settings className="w-4 h-4 text-emerald-600" />
                        AI Engines & API Keys
                      </button>

                      <div className="border-t border-slate-100 my-1" />

                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          logout();
                        }}
                        className="w-full text-left px-4 py-2 text-xs font-medium text-red-600 hover:bg-red-50 flex items-center gap-2.5 cursor-pointer"
                      >
                        <LogOut className="w-4 h-4 text-red-500" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <button
                  onClick={() => onOpenAuth('login')}
                  className="px-4 py-2.5 text-xs font-bold text-slate-700 hover:text-blue-600 transition-colors cursor-pointer"
                >
                  Sign In
                </button>

                <button
                  onClick={() => onOpenAuth('register')}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white shadow-md shadow-blue-500/20 transition-all transform hover:-translate-y-0.5 cursor-pointer"
                >
                  <span>Get Started Free</span>
                </button>
              </>
            )}
          </div>

          {/* Mobile hamburger button */}
          <div className="flex md:hidden items-center gap-3">
            {user && (
              <button
                onClick={() => setCurrentView('dashboard')}
                className="p-2 text-slate-700 hover:text-blue-600 rounded-lg bg-slate-50"
              >
                <LayoutDashboard className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white px-5 pt-4 pb-6 space-y-4">
          <nav className="flex flex-col space-y-1">
            <button
              onClick={() => {
                navigateTo('home');
                setMobileMenuOpen(false);
              }}
              className={`text-left py-2 px-3 rounded-lg text-sm font-semibold transition-colors ${
                currentView === 'home' ? 'bg-blue-50 text-blue-700' : 'text-slate-800 hover:text-blue-600'
              }`}
            >
              Home
            </button>
            <button
              onClick={() => {
                navigateTo('about');
                setMobileMenuOpen(false);
              }}
              className={`text-left py-2 px-3 rounded-lg text-sm font-semibold transition-colors ${
                currentView === 'about' ? 'bg-blue-50 text-blue-700' : 'text-slate-800 hover:text-blue-600'
              }`}
            >
              About Us
            </button>
            <button
              onClick={() => {
                navigateToSection('features');
                setMobileMenuOpen(false);
              }}
              className="text-left py-2 px-3 rounded-lg text-sm font-semibold text-slate-800 hover:text-blue-600"
            >
              Features
            </button>
            <button
              onClick={() => {
                navigateToSection('how-it-works');
                setMobileMenuOpen(false);
              }}
              className="text-left py-2 px-3 rounded-lg text-sm font-semibold text-slate-800 hover:text-blue-600"
            >
              How It Works
            </button>
          </nav>

          <div className="border-t border-slate-100 pt-3 flex flex-col gap-2.5">
            {user ? (
              <>
                <div className="py-2">
                  <p className="text-xs font-bold text-slate-900">{user.fullName}</p>
                  <p className="text-[11px] text-slate-600">{user.email}</p>
                </div>
                <button
                  onClick={() => {
                    setCurrentView('dashboard');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-3 text-center text-xs font-bold rounded-xl bg-blue-600 text-white"
                >
                  Go to Student Workspace
                </button>
                <button
                  onClick={() => {
                    onOpenUpload();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-3 text-center text-xs font-bold rounded-xl bg-slate-100 text-slate-800"
                >
                  Upload Study Material
                </button>
                <button
                  onClick={() => {
                    onOpenSettings();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-2.5 text-center text-xs font-semibold text-slate-700 hover:bg-slate-50 border border-slate-200 rounded-xl"
                >
                  AI Engines & API Keys
                </button>
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-2.5 text-center text-xs font-semibold text-red-600"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    onOpenAuth('login');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-3 text-center text-xs font-bold rounded-xl border border-slate-200 text-slate-700"
                >
                  Sign In
                </button>
                <button
                  onClick={() => {
                    onOpenAuth('register');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-3 text-center text-xs font-bold rounded-xl bg-blue-600 text-white shadow-sm"
                >
                  Create Free Account
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
