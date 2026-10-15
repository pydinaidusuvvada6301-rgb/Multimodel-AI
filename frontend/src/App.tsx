import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.js';
import { ToastProvider } from './context/ToastContext.js';
import { AppLayout } from './components/layout/AppLayout.js';

// Public Pages
import { LandingPage } from './pages/public/LandingPage.js';
import { LoginPage } from './pages/public/LoginPage.js';
import { RegisterPage } from './pages/public/RegisterPage.js';
import { ForgotPasswordPage } from './pages/public/ForgotPasswordPage.js';
import { VerifyEmailPage } from './pages/public/VerifyEmailPage.js';
import { ResetPasswordPage } from './pages/public/ResetPasswordPage.js';
import { AuthCallbackPage } from './pages/public/AuthCallbackPage.js';

// Protected App Pages
import { DashboardPage } from './pages/app/DashboardPage.js';
import { WorkspacesPage } from './pages/app/WorkspacesPage.js';
import { WorkspaceDetailPage } from './pages/app/WorkspaceDetailPage.js';
import { UploadPage } from './pages/app/UploadPage.js';
import { LibraryPage } from './pages/app/LibraryPage.js';
import { SearchPage } from './pages/app/SearchPage.js';
import { ChatPage } from './pages/app/ChatPage.js';
import { DocumentDetailPage } from './pages/app/DocumentDetailPage.js';
import { ReportsPage } from './pages/app/ReportsPage.js';
import { SettingsPage } from './pages/app/SettingsPage.js';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/auth/callback" element={<AuthCallbackPage />} />
            <Route path="/settings/security" element={<Navigate to="/app/settings" replace />} />

            {/* Protected Routes */}
            <Route path="/app" element={<AppLayout />}>
              <Route index element={<DashboardPage />} />
              <Route path="workspaces" element={<WorkspacesPage />} />
              <Route path="workspaces/:workspaceId" element={<WorkspaceDetailPage />} />
              <Route path="upload" element={<UploadPage />} />
              <Route path="library" element={<LibraryPage />} />
              <Route path="search" element={<SearchPage />} />
              <Route path="chat" element={<ChatPage />} />
              <Route path="documents/:documentId" element={<DocumentDetailPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="settings/security" element={<SettingsPage />} />
            </Route>

            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};
