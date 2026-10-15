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
    <header className="h-15 px-4 sm:px-6 bg-white border-b border-[#E5EAF1] flex items-center justify-between shrink-0 z-20">
      {/* Left side: Mobile Toggle & Active Workspace */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileSidebar}
          className="lg:hidden p-1.5 text-[#667085] hover:text-[#202938] rounded-md hover:bg-[#F7F9FC]"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs text-[#667085] hidden sm:inline">Workspace:</span>
          <span className="text-xs font-medium text-[#202938] flex items-center gap-1.5 bg-[#F7F9FC] px-2.5 py-1 rounded-md border border-[#E5EAF1]">
            <Sparkles className="w-3.5 h-3.5 text-[#356AE6]" />
            {activeWorkspace ? activeWorkspace.name : 'All Workspaces'}
          </span>
        </div>
      </div>

      {/* Right side: Quick Search, Model Indicator, Upload CTA */}
      <div className="flex items-center gap-2.5">
        {/* Model status indicator */}
        <div className="hidden md:flex items-center gap-1.5 text-xs text-[#667085] bg-[#F7F9FC] px-2.5 py-1 rounded-md border border-[#E5EAF1]">
          <Cpu className="w-3.5 h-3.5 text-[#356AE6]" />
          <span className="font-mono text-[11px] text-[#202938]">Gemini 2.5 Flash</span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#12B76A] ml-0.5" />
        </div>

        {/* Quick Search */}
        <button
          onClick={() => navigate('/app/search')}
          className="flex items-center gap-2 px-3 py-1.5 bg-[#F7F9FC] border border-[#E5EAF1] hover:border-[#D0D7E2] text-xs text-[#667085] hover:text-[#202938] rounded-md transition-colors"
        >
          <Search className="w-3.5 h-3.5 text-[#98A2B3]" />
          <span className="hidden sm:inline">Search knowledge...</span>
          <kbd className="hidden lg:inline bg-white px-1.5 py-0.2 rounded text-[10px] text-[#667085] border border-[#E5EAF1]">
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
