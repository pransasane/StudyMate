import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, ConfigStatus } from '../types/index.js';
import { api, authStorage } from '../services/api.js';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  configStatus: ConfigStatus | null;
  login: (email: string, password: string) => Promise<void>;
  register: (fullName: string, email: string, password: string, educationLevel?: string) => Promise<void>;
  logout: () => void;
  updateSettings: (settings: Partial<User>) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(authStorage.getToken());
  const [loading, setLoading] = useState<boolean>(true);
  const [configStatus, setConfigStatus] = useState<ConfigStatus | null>(null);

  // Fetch server config status
  useEffect(() => {
    api.getConfigStatus()
      .then(setConfigStatus)
      .catch((err) => console.warn('Could not fetch server config status:', err));
  }, []);

  // Restore user session if token exists
  useEffect(() => {
    async function loadUser() {
      const storedToken = authStorage.getToken();
      if (!storedToken) {
        setLoading(false);
        return;
      }
      try {
        const { user: currentUser } = await api.getCurrentUser();
        setUser(currentUser);
        setToken(storedToken);
      } catch (err) {
        console.warn('Session expired or invalid:', err);
        authStorage.clearToken();
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.login({ email, password });
    authStorage.setToken(res.token);
    setToken(res.token);
    setUser(res.user);
  };

  const register = async (fullName: string, email: string, password: string, educationLevel?: string) => {
    const res = await api.register({ fullName, email, password, educationLevel });
    authStorage.setToken(res.token);
    setToken(res.token);
    setUser(res.user);
  };

  const logout = () => {
    authStorage.clearToken();
    setToken(null);
    setUser(null);
  };

  const updateSettings = async (settings: Partial<User>) => {
    const res = await api.updateSettings(settings);
    setUser(res.user);
  };

  const refreshUser = async () => {
    if (!authStorage.getToken()) return;
    try {
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
        login,
        register,
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
