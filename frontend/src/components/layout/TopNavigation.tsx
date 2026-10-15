import React from 'react';
import { Menu, Search, UploadCloud, Cpu, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import { Button } from '../ui/Button.js';
import { Badge } from '../ui/Badge.js';

interface TopNavigationProps {
  onOpenMobileSidebar: () => void;
}

export const TopNavigation: React.FC<TopNavigationProps> = ({ onOpenMobileSidebar }) => {
  const { activeWorkspace } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="h-16 px-4 sm:px-6 bg-surface-300/80 backdrop-blur-md border-b border-slate-800 flex items-center justify-between shrink-0 z-20">
      {/* Left side: Mobile Toggle & Active Workspace */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileSidebar}
          className="lg:hidden p-2 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 hidden sm:inline">Active:</span>
          <span className="text-sm font-semibold text-slate-100 flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded-md border border-slate-700/60">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            {activeWorkspace ? activeWorkspace.name : 'All Workspaces'}
          </span>
        </div>
      </div>

      {/* Right side: Quick Search, Model Indicator, Upload CTA */}
      <div className="flex items-center gap-2.5">
        {/* Model status indicator */}
        <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-400 bg-slate-900/90 px-2.5 py-1 rounded-lg border border-slate-800">
          <Cpu className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-mono text-[11px] text-slate-300">Gemini 2.5 Flash</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
        </div>

        {/* Quick Search */}
        <button
          onClick={() => navigate('/app/search')}
          className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs text-slate-400 hover:text-slate-200 rounded-lg transition-colors"
        >
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <span className="hidden sm:inline">Search knowledge...</span>
          <kbd className="hidden lg:inline bg-slate-800 px-1.5 py-0.5 rounded text-[10px] text-slate-400 border border-slate-700">
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
