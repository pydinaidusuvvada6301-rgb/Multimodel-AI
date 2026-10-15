import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, setAccessToken } from '../lib/api.js';
import { supabaseClient } from '../lib/supabase.js';
import { User, Workspace } from '../types/index.js';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  workspaces: Workspace[];
  activeWorkspace: Workspace | null;
  setActiveWorkspace: (workspace: Workspace | null) => void;
  login: (email: string, password: string) => Promise<void>;
  demoLogin: () => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<{ needsVerification?: boolean }>;
  resendVerification: (email: string) => Promise<{ message: string }>;
  requestPasswordReset: (email: string) => Promise<{ message: string }>;
  resetPassword: (email: string, newPassword: string) => Promise<{ message: string }>;
  logout: () => Promise<void>;
  deleteAccount: (confirmation: string) => Promise<void>;
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

  // Initial Session Restoration (both backend refresh and Supabase client detection)
  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data } = await api.post('/auth/refresh');
        if (data.success && data.data) {
          setAccessToken(data.data.accessToken);
          setUser(data.data.user);
        }
      } catch {
        // Fallback to client-side Supabase session check if present
        if (supabaseClient) {
          const { data: sessionData } = await supabaseClient.auth.getSession();
          if (sessionData?.session?.user) {
            setUser({
              id: sessionData.session.user.id,
              email: sessionData.session.user.email || '',
              displayName: sessionData.session.user.user_metadata?.display_name || 'Researcher',
            });
          } else {
            setAccessToken(null);
            setUser(null);
          }
        } else {
          setAccessToken(null);
          setUser(null);
        }
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

  const register = async (name: string, email: string, password: string): Promise<{ needsVerification?: boolean }> => {
    const { data } = await api.post('/auth/register', {
      displayName: name,
      email,
      password,
    });
    if (data.success && data.data) {
      if (!data.data.needsVerification && data.data.accessToken) {
        setAccessToken(data.data.accessToken);
        setUser(data.data.user);
      }
      return { needsVerification: data.data.needsVerification };
    }
    return {};
  };

  const resendVerification = async (email: string): Promise<{ message: string }> => {
    const { data } = await api.post('/auth/resend-verification', { email });
    return { message: data.meta?.message || data.data?.message || 'Verification email resent.' };
  };

  const requestPasswordReset = async (email: string): Promise<{ message: string }> => {
    const { data } = await api.post('/auth/forgot-password', { email });
    return { message: data.meta?.message || 'Password reset email sent.' };
  };

  const resetPassword = async (email: string, newPassword: string): Promise<{ message: string }> => {
    const { data } = await api.post('/auth/reset-password', { email, newPassword });
    return { message: data.meta?.message || 'Password reset successfully.' };
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
      if (supabaseClient) {
        await supabaseClient.auth.signOut();
      }
    } catch {
      // Ignore
    } finally {
      setAccessToken(null);
      setUser(null);
      setActiveWorkspace(null);
      setWorkspaces([]);
    }
  };

  const deleteAccount = async (confirmation: string) => {
    await api.post('/auth/delete-account', { confirmation });
    await logout();
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
        resendVerification,
        requestPasswordReset,
        resetPassword,
        logout,
        deleteAccount,
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
