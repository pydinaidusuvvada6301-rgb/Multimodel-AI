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
    <header className="h-15 px-4 sm:px-6 bg-[#0D1428]/90 backdrop-blur-md border-b border-[#4F8CFF]/20 flex items-center justify-between shrink-0 z-20 text-[#F4F7FF]">
      {/* Left side: Mobile Toggle & Active Workspace */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileSidebar}
          className="lg:hidden p-1.5 text-[#9AA8C7] hover:text-[#F4F7FF] rounded-md hover:bg-[#4F8CFF]/15"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs text-[#9AA8C7] hidden sm:inline">Workspace:</span>
          <span className="text-xs font-medium text-[#F4F7FF] flex items-center gap-1.5 bg-[#070B17]/60 px-2.5 py-1 rounded-md border border-[#4F8CFF]/30 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-[#42E8F5]" />
            {activeWorkspace ? activeWorkspace.name : 'All Workspaces'}
          </span>
        </div>
      </div>

      {/* Right side: Quick Search, Model Indicator, Upload CTA */}
      <div className="flex items-center gap-2.5">
        {/* Model status indicator */}
        <div className="hidden md:flex items-center gap-1.5 text-xs text-[#9AA8C7] bg-[#070B17]/60 px-2.5 py-1 rounded-md border border-[#4F8CFF]/30">
          <Cpu className="w-3.5 h-3.5 text-[#42E8F5]" />
          <span className="font-mono text-[11px] text-[#F4F7FF]">Gemini 2.5 Flash</span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#12B76A] ml-0.5 shadow-[0_0_8px_#12B76A]" />
        </div>

        {/* Quick Search */}
        <button
          onClick={() => navigate('/app/search')}
          className="flex items-center gap-2 px-3 py-1.5 bg-[#070B17]/70 border border-[#4F8CFF]/25 hover:border-[#42E8F5]/40 text-xs text-[#9AA8C7] hover:text-[#F4F7FF] rounded-md transition-colors"
        >
          <Search className="w-3.5 h-3.5 text-[#4F8CFF]" />
          <span className="hidden sm:inline">Search knowledge...</span>
          <kbd className="hidden lg:inline bg-[#0D1428] px-1.5 py-0.2 rounded text-[10px] text-[#9AA8C7] border border-[#4F8CFF]/30">
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
