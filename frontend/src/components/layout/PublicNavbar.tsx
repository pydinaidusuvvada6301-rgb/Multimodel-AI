import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '../ui/Button.js';
import { useAuth } from '../../context/AuthContext.js';

export const PublicNavbar: React.FC = () => {
  const { user } = useAuth();

  return (
    <header className="w-full h-15 border-b border-[#E5EAF1] bg-white/95 backdrop-blur-xs sticky top-0 z-50 px-4 sm:px-8 flex items-center justify-between">
      <Link to="/" className="flex items-center gap-2.5 group">
        <div className="w-7 h-7 rounded-md bg-[#356AE6] flex items-center justify-center text-white shadow-xs group-hover:bg-[#2856C5] transition-colors">
          <Sparkles className="w-3.5 h-3.5" />
        </div>
        <div className="flex items-center">
          <span className="font-semibold text-[#202938] text-sm tracking-tight">OmniMind</span>
          <span className="text-[#356AE6] font-semibold text-xs ml-1 bg-[#EEF4FF] px-1.5 py-0.2 rounded text-[10px]">AI</span>
        </div>
      </Link>

      <nav className="flex items-center gap-4">
        {user ? (
          <Link to="/app">
            <Button size="sm" icon={<ArrowRight className="w-3.5 h-3.5" />}>
              Open Workspace
            </Button>
          </Link>
        ) : (
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="text-xs font-medium text-[#667085] hover:text-[#202938] transition-colors px-2 py-1"
            >
              Sign In
            </Link>
            <Link to="/register">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        )}
      </nav>
    </header>
  );
};
