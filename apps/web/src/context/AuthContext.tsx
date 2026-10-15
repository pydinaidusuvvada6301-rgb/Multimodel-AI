import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, setAccessToken } from '../lib/api.js';
import { User, Workspace } from '../types/index.js';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  workspaces: Workspace[];
  activeWorkspace: Workspace | null;
  setActiveWorkspace: (workspace: Workspace | null) => void;
  login: (email: string, password: string) => Promise<void>;
  demoLogin: () => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshWorkspaces: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace | null>(null);

  // Fetch workspaces for current user
  const refreshWorkspaces = async () => {
    try {
      const { data } = await api.get('/workspaces');
      if (data.success && data.data) {
        setWorkspaces(data.data);
        if (data.data.length > 0 && !activeWorkspace) {
          setActiveWorkspace(data.data[0]);
        }
      }
    } catch (err) {
      console.warn('Could not load workspaces:', err);
    }
  };

  // Initial Session Restoration
  useEffect(() => {
    const initAuth = async () => {
      // Check if session was active
      const hasSession = sessionStorage.getItem('omnimind_has_session');
      try {
        const { data } = await api.post('/auth/refresh');
        if (data.success && data.data) {
          setAccessToken(data.data.accessToken);
          setUser(data.data.user);
        }
      } catch {
        // If refresh fails and we had demo state or no session
        setAccessToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  // Whenever user changes, load their workspaces
  useEffect(() => {
    if (user) {
      refreshWorkspaces();
    } else {
      setWorkspaces([]);
      setActiveWorkspace(null);
    }
  }, [user]);

  const login = async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password });
    if (data.success && data.data) {
      setAccessToken(data.data.accessToken);
      setUser(data.data.user);
    }
  };

  const demoLogin = async () => {
    await login('demo@omnimind.ai', 'Password123!');
  };

  const register = async (name: string, email: string, password: string) => {
    const { data } = await api.post('/auth/register', {
      displayName: name,
      email,
      password,
    });
    if (data.success && data.data) {
      setAccessToken(data.data.accessToken);
      setUser(data.data.user);
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore
    } finally {
      setAccessToken(null);
      setUser(null);
      setActiveWorkspace(null);
      setWorkspaces([]);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        workspaces,
        activeWorkspace,
        setActiveWorkspace,
        login,
        demoLogin,
        register,
        logout,
        refreshWorkspaces,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
