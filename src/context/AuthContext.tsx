import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, ConfigStatus } from '../types/index.js';
import { api, authStorage } from '../services/api.js';
import {
  auth,
  googleProvider,
  firestoreService,
} from '../services/firebase.js';
import {
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
  login: (email: string, password: string) => Promise<void>;
  register: (fullName: string, email: string, password: string, educationLevel?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
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
  const [isFirebaseConnected, setIsFirebaseConnected] = useState<boolean>(true);

  // Fetch server config status
  useEffect(() => {
    api.getConfigStatus()
      .then(setConfigStatus)
      .catch((err) => console.warn('Could not fetch server config status:', err));
  }, []);

  // Listen to Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        try {
          // Fetch or initialize profile from Firestore database
          let profile = await firestoreService.getUserProfile(fbUser.uid);
          if (!profile) {
            profile = {
              id: fbUser.uid,
              email: fbUser.email || '',
              fullName: fbUser.displayName || fbUser.email?.split('@')[0] || 'Student',
              educationLevel: 'College / University',
              preferredProvider: 'gemini',
              createdAt: new Date().toISOString(),
            };
            await firestoreService.saveUserProfile(profile);
          }

          // Sync with backend session token
          const syncRes = await api.syncFirebaseUser({
            id: profile.id,
            email: profile.email,
            fullName: profile.fullName,
            educationLevel: profile.educationLevel,
          });
          authStorage.setToken(syncRes.token);
          setToken(syncRes.token);
          setUser(profile);
        } catch (e) {
          console.warn('Firebase user sync note:', e);
        } finally {
          setLoading(false);
        }
      } else {
        // Fallback: check stored token for standard session
        const storedToken = authStorage.getToken();
        if (storedToken && !user) {
          try {
            const { user: currentUser } = await api.getCurrentUser();
            setUser(currentUser);
            setToken(storedToken);
            // Ensure profile exists in Firestore database
            await firestoreService.saveUserProfile(currentUser).catch(() => {});
          } catch (err) {
            authStorage.clearToken();
            setUser(null);
            setToken(null);
          }
        }
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Google Sign-In with Firebase Popup (Recommended in Skill)
  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const fbUser = result.user;

      let profile = await firestoreService.getUserProfile(fbUser.uid);
      if (!profile) {
        profile = {
          id: fbUser.uid,
          email: fbUser.email || '',
          fullName: fbUser.displayName || fbUser.email?.split('@')[0] || 'Student',
          educationLevel: 'College / University',
          preferredProvider: 'gemini',
          createdAt: new Date().toISOString(),
        };
        await firestoreService.saveUserProfile(profile);
      }

      const syncRes = await api.syncFirebaseUser({
        id: profile.id,
        email: profile.email,
        fullName: profile.fullName,
        educationLevel: profile.educationLevel,
      });

      authStorage.setToken(syncRes.token);
      setToken(syncRes.token);
      setUser(profile);
    } catch (err: any) {
      console.error('Google Sign-In Error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const res = await api.login({ email, password });
    authStorage.setToken(res.token);
    setToken(res.token);
    setUser(res.user);

    // Persist and sync user data into Google Firebase Firestore
    await firestoreService.saveUserProfile(res.user).catch((e) =>
      console.warn('Firestore user profile sync warning:', e)
    );
  };

  const register = async (fullName: string, email: string, password: string, educationLevel?: string) => {
    const res = await api.register({ fullName, email, password, educationLevel });
    authStorage.setToken(res.token);
    setToken(res.token);
    setUser(res.user);

    // Persist new user in Google Firebase Firestore database
    await firestoreService.saveUserProfile(res.user).catch((e) =>
      console.warn('Firestore user registration sync warning:', e)
    );
  };

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (e) {
      console.warn('Firebase signout error:', e);
    }
    authStorage.clearToken();
    setToken(null);
    setUser(null);
  };

  const updateSettings = async (settings: Partial<User>) => {
    if (!user) return;
    const res = await api.updateSettings(settings);
    const updatedUser = res.user;
    setUser(updatedUser);

    // Save changes directly in Google Firebase Firestore database
    await firestoreService.saveUserProfile(updatedUser).catch((e) =>
      console.warn('Firestore profile update warning:', e)
    );
  };

  const refreshUser = async () => {
    if (!user) return;
    try {
      const fbProfile = await firestoreService.getUserProfile(user.id);
      if (fbProfile) {
        setUser(fbProfile);
      } else {
        const { user: updated } = await api.getCurrentUser();
        setUser(updated);
      }
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
        login,
        register,
        signInWithGoogle,
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
