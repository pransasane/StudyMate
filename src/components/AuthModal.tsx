import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../services/api.js';
import { X, Sparkles, Mail, Lock, User as UserIcon, GraduationCap, AlertCircle, CheckCircle } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
  onSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
  onSuccess,
}) => {
  const { login, register, signInWithGoogle } = useAuth();
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>(initialMode);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [educationLevel, setEducationLevel] = useState('College / University');
  const [newPassword, setNewPassword] = useState('');

  // Status
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      await signInWithGoogle();
      onClose();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || 'Google sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        await login(email, password);
        onClose();
        if (onSuccess) onSuccess();
      } else if (mode === 'register') {
        await register(fullName, email, password, educationLevel);
        onClose();
        if (onSuccess) onSuccess();
      } else if (mode === 'forgot') {
        const res = await api.resetPassword({ email, newPassword });
        setSuccessMsg(res.message);
        setTimeout(() => {
          setMode('login');
          setPassword(newPassword);
          setSuccessMsg(null);
        }, 1500);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 flex items-center justify-between border-b border-slate-100">
          <div>
            <h3 className="text-xl font-bold text-slate-900">
              {mode === 'login' && 'Welcome Back'}
              {mode === 'register' && 'Create StudyMate Account'}
              {mode === 'forgot' && 'Reset Account Password'}
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              {mode === 'login' && 'Sign in to access your study library and quizzes'}
              {mode === 'register' && 'Start converting your study materials with AI'}
              {mode === 'forgot' && 'Enter your email and a new password'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Google Quick Sign-In */}
        {mode !== 'forgot' && (
          <div className="px-6 pt-5">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors flex items-center justify-center gap-2.5 cursor-pointer shadow-2xs disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Continue with Google</span>
            </button>

            <div className="flex items-center gap-3 my-3">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                or with email
              </span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className={`px-6 pb-5 space-y-4 ${mode === 'forgot' ? 'pt-5' : 'pt-0'}`}>
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed">{error}</div>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed">{successMsg}</div>
            </div>
          )}

          {mode === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Jordan Smith"
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@university.edu"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {mode === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Education Level (Optional)
              </label>
              <div className="relative">
                <GraduationCap className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <select
                  value={educationLevel}
                  onChange={(e) => setEducationLevel(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 bg-white"
                >
                  <option value="High School">High School</option>
                  <option value="College / University">College / Undergraduate</option>
                  <option value="Graduate / Medical / Law">Graduate / Master's / PhD</option>
                  <option value="Professional / Self-Taught">Professional / Lifelong Learner</option>
                </select>
              </div>
            </div>
          )}

          {mode !== 'forgot' ? (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700">Password</label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot');
                      setError(null);
                    }}
                    className="text-xs text-blue-600 hover:underline cursor-pointer"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Enter New Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md shadow-blue-500/20 transition-colors disabled:opacity-50 cursor-pointer mt-2"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Processing...
              </span>
            ) : mode === 'login' ? (
              'Sign In'
            ) : mode === 'register' ? (
              'Create Account'
            ) : (
              'Reset Password'
            )}
          </button>
        </form>

        {/* Footer toggle */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 text-center text-xs text-slate-600">
          {mode === 'login' ? (
            <p>
              Don't have an account yet?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setError(null);
                }}
                className="font-semibold text-blue-600 hover:underline cursor-pointer"
              >
                Sign up free
              </button>
            </p>
          ) : mode === 'register' ? (
            <p>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError(null);
                }}
                className="font-semibold text-blue-600 hover:underline cursor-pointer"
              >
                Sign in
              </button>
            </p>
          ) : (
            <p>
              Remembered your credentials?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError(null);
                }}
                className="font-semibold text-blue-600 hover:underline cursor-pointer"
              >
                Back to sign in
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
