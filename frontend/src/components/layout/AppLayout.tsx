import React, { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import { Sidebar } from './Sidebar.js';
import { TopNavigation } from './TopNavigation.js';
import { OmniMindGuide } from '../guide/OmniMindGuide.js';
import { CommandPalette } from '../navigation/CommandPalette.js';
import { Loader2 } from 'lucide-react';

export const AppLayout: React.FC = () => {
  const { user, loading } = useAuth();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070B17] flex flex-col items-center justify-center gap-3 text-[#F4F7FF]">
        <Loader2 className="w-7 h-7 text-[#42E8F5] animate-spin" />
        <p className="text-xs text-[#9AA8C7] font-medium tracking-wide">Connecting to OmniMind AI...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#070B17] text-[#F4F7FF]">
      {/* Global Command Palette (Ctrl+K / Cmd+K) */}
      <CommandPalette />

      {/* Desktop Sidebar */}
      <div className="hidden lg:block shrink-0">
        <Sidebar />
      </div>

      {/* Mobile Drawer Sidebar */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex animate-in fade-in duration-150">
          <div
            className="fixed inset-0 bg-[#070B17]/70 backdrop-blur-sm"
            onClick={() => setIsMobileSidebarOpen(false)}
            aria-hidden="true"
          />
          <div className="relative z-10 w-64 max-w-[80vw]">
            <Sidebar onCloseMobile={() => setIsMobileSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-w-0 h-full overflow-hidden bg-[#070B17]">
        <TopNavigation onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#070B17] text-[#F4F7FF]">
          <Outlet />
        </main>
      </div>

      {/* OmniMind Guide Contextual Assistant */}
      <OmniMindGuide />
    </div>
  );
};

