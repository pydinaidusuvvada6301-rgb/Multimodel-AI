import React, { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import { Sidebar } from './Sidebar.js';
import { TopNavigation } from './TopNavigation.js';
import { OmniMindGuide } from '../guide/OmniMindGuide.js';
import { Loader2 } from 'lucide-react';

export const AppLayout: React.FC = () => {
  const { user, loading } = useAuth();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-6 h-6 text-[#356AE6] animate-spin" />
        <p className="text-xs text-[#667085] font-medium tracking-wide">Connecting to OmniMind AI...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F7F9FC]">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block shrink-0">
        <Sidebar />
      </div>

      {/* Mobile Drawer Sidebar */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex animate-in fade-in duration-150">
          <div
            className="fixed inset-0 bg-[#202938]/40 backdrop-blur-xs"
            onClick={() => setIsMobileSidebarOpen(false)}
            aria-hidden="true"
          />
          <div className="relative z-10 w-64 max-w-[80vw]">
            <Sidebar onCloseMobile={() => setIsMobileSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-w-0 h-full overflow-hidden">
        <TopNavigation onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#F7F9FC]">
          <Outlet />
        </main>
      </div>

      {/* OmniMind Guide Contextual Assistant */}
      <OmniMindGuide />
    </div>
  );
};
