import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '../ui/Button.js';
import { useAuth } from '../../context/AuthContext.js';

export const PublicNavbar: React.FC = () => {
  const { user } = useAuth();

  return (
    <header className="w-full h-15 border-b border-[#4F8CFF]/20 bg-[#070B17]/90 backdrop-blur-md sticky top-0 z-50 px-4 sm:px-8 flex items-center justify-between text-[#F4F7FF]">
      <Link to="/" className="flex items-center gap-2.5 group">
        <div className="w-7 h-7 rounded-lg bg-[#4F8CFF] flex items-center justify-center text-white shadow-[0_0_15px_-2px_rgba(79,140,255,0.5)] group-hover:bg-[#3A77ED] transition-colors">
          <Sparkles className="w-3.5 h-3.5" />
        </div>
        <div className="flex items-center">
          <span className="font-semibold text-[#F4F7FF] text-sm tracking-tight">OmniMind</span>
          <span className="text-[#42E8F5] font-semibold text-xs ml-1 bg-[#42E8F5]/15 border border-[#42E8F5]/30 px-1.5 py-0.2 rounded text-[10px]">AI</span>
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
              className="text-xs font-medium text-[#9AA8C7] hover:text-[#F4F7FF] transition-colors px-2 py-1"
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
