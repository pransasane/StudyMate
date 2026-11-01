import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, ConfigStatus } from '../types/index.js';
import { api, authStorage } from '../services/api.js';
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
  const [token, setToken] = useState<string | null>(authStorage.getToken());
  const [loading, setLoading] = useState<boolean>(true);
  const [configStatus, setConfigStatus] = useState<ConfigStatus | null>(null);
  const [isFirebaseConnected] = useState<boolean>(true);
  const [isFirebaseUser, setIsFirebaseUser] = useState<boolean>(false);

  // Firebase Auth owns the persistent account. Firestore stores the profile;
  // the API issues a short-lived app session only after verifying the Firebase ID token.
  const syncFirebaseProfile = async (
    fbUser: FirebaseUser,
    details?: { fullName?: string; educationLevel?: string }
  ): Promise<User> => {
    const existingProfile = await firestoreService.getUserProfile(fbUser.uid);
    const profile: User = {
      ...(existingProfile || {}),
      id: fbUser.uid,
      email: fbUser.email || existingProfile?.email || '',
      fullName:
        details?.fullName?.trim() ||
        fbUser.displayName ||
        existingProfile?.fullName ||
        fbUser.email?.split('@')[0] ||
        'Student',
      educationLevel:
        details?.educationLevel ||
        existingProfile?.educationLevel ||
        'College / University',
      preferredProvider: existingProfile?.preferredProvider || 'gemini',
      createdAt: existingProfile?.createdAt || new Date().toISOString(),
    };

    await firestoreService.saveUserProfile(profile);

    const idToken = await fbUser.getIdToken();
    const syncRes = await api.syncFirebaseUser({
      idToken,
      fullName: profile.fullName,
      educationLevel: profile.educationLevel,
    });

    authStorage.setToken(syncRes.token);
    setToken(syncRes.token);
    setUser(profile);
    setIsFirebaseUser(true);
    return profile;
  };

  // Fetch server config status
  useEffect(() => {
    api.getConfigStatus()
      .then(setConfigStatus)
      .catch((err) => console.warn('Could not fetch server config status:', err));
  }, []);

  // Restore a Firebase session after a refresh and obtain a matching API session.
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        setIsFirebaseUser(true);
        try {
          await syncFirebaseProfile(fbUser);
        } catch (e) {
          console.warn('Firebase user sync note:', e);
        } finally {
          setLoading(false);
        }
      } else {
        setIsFirebaseUser(false);
        const storedToken = authStorage.getToken();
        if (storedToken) {
          try {
            const { user: currentUser } = await api.getCurrentUser();
            setUser(currentUser);
            setToken(storedToken);
          } catch {
            authStorage.clearToken();
            setUser(null);
            setToken(null);
          }
        } else {
          setUser(null);
          setToken(null);
        }
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await syncFirebaseProfile(result.user);
    } catch (err: any) {
      console.error('Google Sign-In Error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const result = await signInWithEmailAndPassword(auth, email.trim(), password);
      await syncFirebaseProfile(result.user);
    } catch (err: any) {
      console.error('Email Sign-In Error:', err);
      throw err;
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
    } catch (err: any) {
      console.error('Email Registration Error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const sendPasswordReset = async (email: string) => {
    await sendPasswordResetEmail(auth, email.trim());
  };

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (e) {
      console.warn('Firebase signout error:', e);
    }
    setIsFirebaseUser(false);
    authStorage.clearToken();
    setToken(null);
    setUser(null);
  };

  const updateSettings = async (settings: Partial<User>) => {
    if (!user) return;
    const res = await api.updateSettings(settings);
    const updatedUser = res.user;
    setUser(updatedUser);

    if (auth.currentUser && auth.currentUser.uid === updatedUser.id) {
      await firestoreService.saveUserProfile(updatedUser).catch((e) =>
        console.warn('Firestore profile update warning:', e)
      );
    }
  };

  const refreshUser = async () => {
    if (!user) return;
    try {
      if (auth.currentUser && auth.currentUser.uid === user.id) {
        const fbProfile = await firestoreService.getUserProfile(user.id);
        if (fbProfile) {
          setUser(fbProfile);
          return;
        }
      }
      const { user: updated } = await api.getCurrentUser();
      setUser(updated);
    } catch (e) {
      console.error('Failed to refresh user:', e);
    }
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
