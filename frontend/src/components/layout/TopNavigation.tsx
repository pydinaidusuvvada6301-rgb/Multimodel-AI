import React from 'react';
import { Menu, Search, UploadCloud, Cpu, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import { Button } from '../ui/Button.js';

interface TopNavigationProps {
  onOpenMobileSidebar: () => void;
}

export const TopNavigation: React.FC<TopNavigationProps> = ({ onOpenMobileSidebar }) => {
  const { activeWorkspace } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="h-15 px-4 sm:px-6 bg-white/95 backdrop-blur-md border-b border-slate-200 flex items-center justify-between shrink-0 z-20 text-slate-800 shadow-xs">
      {/* Left side: Mobile Toggle & Active Workspace */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileSidebar}
          className="lg:hidden p-1.5 text-slate-500 hover:text-slate-900 rounded-md hover:bg-slate-100 cursor-pointer"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 hidden sm:inline">Workspace:</span>
          <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            {activeWorkspace ? activeWorkspace.name : 'All Workspaces'}
          </span>
        </div>
      </div>

      {/* Right side: Quick Search, Model Indicator, Upload CTA */}
      <div className="flex items-center gap-2.5">
        {/* Model status indicator */}
        <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
          <Cpu className="w-3.5 h-3.5 text-cyan-600" />
          <span className="font-mono text-[11px] text-slate-700 font-medium">Gemini 2.5 Flash</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 ml-0.5" />
        </div>

        {/* Quick Search */}
        <button
          onClick={() => navigate('/app/search')}
          className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 hover:border-slate-300 text-xs text-slate-500 hover:text-slate-800 rounded-md transition-colors cursor-pointer"
        >
          <Search className="w-3.5 h-3.5 text-blue-600" />
          <span className="hidden sm:inline">Search knowledge...</span>
          <kbd className="hidden lg:inline bg-white px-1.5 py-0.2 rounded text-[10px] text-slate-400 border border-slate-200">
            /
          </kbd>
        </button>

        {/* Upload Button */}
        <Button
          size="sm"
          onClick={() => navigate('/app/upload')}
          icon={<UploadCloud className="w-3.5 h-3.5" />}
        >
          <span className="hidden sm:inline">Upload</span>
        </Button>
      </div>
    </header>
  );
};

