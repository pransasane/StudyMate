import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, ConfigStatus } from '../types/index.js';
import { api } from '../services/api.js';
import {
  auth,
  googleProvider,
  firestoreService,
} from '../services/firebase.js';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  configStatus: ConfigStatus | null;
  isFirebaseConnected: boolean;
  isFirebaseUser: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (fullName: string, email: string, password: string, educationLevel?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  updateSettings: (settings: Partial<User>) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [configStatus, setConfigStatus] = useState<ConfigStatus | null>(null);
  const [isFirebaseConnected, setIsFirebaseConnected] = useState(false);
  const [isFirebaseUser, setIsFirebaseUser] = useState(false);

  /**
   * Firebase Authentication owns identity.
   * Firestore owns the profile and preferences.
   * No application account/session is stored in Vercel's temporary filesystem.
   */
  const syncFirebaseProfile = async (
    firebaseUser: FirebaseUser,
    details?: { fullName?: string; educationLevel?: string }
  ): Promise<User> => {
    if (!firebaseUser.uid || !firebaseUser.email) {
      throw new Error('Your Firebase account does not have a valid email address.');
    }

    const existing = await firestoreService.getUserProfile(firebaseUser.uid);
    const profile: User = {
      ...(existing || {}),
      id: firebaseUser.uid,
      email: firebaseUser.email,
      fullName:
        details?.fullName?.trim() ||
        firebaseUser.displayName ||
        existing?.fullName ||
        firebaseUser.email.split('@')[0] ||
        'Student',
      educationLevel:
        details?.educationLevel ||
        existing?.educationLevel ||
        'College / University',
      preferredProvider: existing?.preferredProvider || 'gemini',
      createdAt: existing?.createdAt || new Date().toISOString(),
    };

    // A profile write must succeed before the user is admitted to the workspace.
    await firestoreService.saveUserProfile(profile);

    const idToken = await firebaseUser.getIdToken();
    setToken(idToken);
    setUser(profile);
    setIsFirebaseConnected(true);
    setIsFirebaseUser(true);
    return profile;
  };

  useEffect(() => {
    api.getConfigStatus()
      .then(setConfigStatus)
      .catch((err) => console.warn('Could not fetch AI configuration status:', err));
  }, []);

  useEffect(() => {
    let active = true;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!active) return;

      if (!firebaseUser) {
        setUser(null);
        setToken(null);
        setIsFirebaseUser(false);
        setIsFirebaseConnected(false);
        setLoading(false);
        return;
      }

      setLoading(true);
      setIsFirebaseUser(true);
      try {
        const profile = await syncFirebaseProfile(firebaseUser);
        if (active) setUser(profile);
      } catch (error) {
        console.error('Firebase profile synchronization failed:', error);
        if (active) {
          setUser(null);
          setToken(null);
          setIsFirebaseConnected(false);
        }
      } finally {
        if (active) setLoading(false);
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const result = await signInWithEmailAndPassword(auth, email.trim(), password);
      await syncFirebaseProfile(result.user);
    } finally {
      setLoading(false);
    }
  };

  const register = async (
    fullName: string,
    email: string,
    password: string,
    educationLevel?: string
  ) => {
    setLoading(true);
    try {
      const result = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await updateProfile(result.user, { displayName: fullName.trim() });
      await syncFirebaseProfile(result.user, {
        fullName: fullName.trim(),
        educationLevel,
      });
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await syncFirebaseProfile(result.user);
    } finally {
      setLoading(false);
    }
  };

  const sendPasswordReset = async (email: string) => {
    await sendPasswordResetEmail(auth, email.trim());
  };

  const logout = async () => {
    await firebaseSignOut(auth);
    setUser(null);
    setToken(null);
    setIsFirebaseUser(false);
    setIsFirebaseConnected(false);
  };

  const updateSettings = async (settings: Partial<User>) => {
    if (!user || !auth.currentUser || auth.currentUser.uid !== user.id) {
      throw new Error('Please sign in again before updating your profile.');
    }

    const updatedProfile: User = {
      ...user,
      ...settings,
      id: user.id,
      email: auth.currentUser.email || user.email,
      createdAt: user.createdAt,
    };

    // Profile and personal AI settings are persisted in the signed-in user's Firestore document.
    await firestoreService.saveUserProfile(updatedProfile);
    setUser(updatedProfile);
  };

  const refreshUser = async () => {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) {
      setUser(null);
      return;
    }

    const profile = await firestoreService.getUserProfile(firebaseUser.uid);
    if (profile) setUser(profile);
    setToken(await firebaseUser.getIdToken(true));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        configStatus,
        isFirebaseConnected,
        isFirebaseUser,
        login,
        register,
        signInWithGoogle,
        sendPasswordReset,
        logout,
        updateSettings,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
