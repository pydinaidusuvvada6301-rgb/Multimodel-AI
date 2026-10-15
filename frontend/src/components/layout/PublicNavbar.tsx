import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '../ui/Button.js';
import { useAuth } from '../../context/AuthContext.js';

export const PublicNavbar: React.FC = () => {
  const { user } = useAuth();

  return (
    <header className="w-full h-15 border-b border-slate-200 bg-white/90 backdrop-blur-md sticky top-0 z-50 px-4 sm:px-8 flex items-center justify-between text-slate-800 shadow-xs">
      <Link to="/" className="flex items-center gap-2.5 group">
        <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm group-hover:bg-blue-700 transition-colors">
          <Sparkles className="w-3.5 h-3.5" />
        </div>
        <div className="flex items-center">
          <span className="font-bold text-slate-900 text-sm tracking-tight">OmniMind</span>
          <span className="text-cyan-700 font-semibold text-[10px] ml-1.5 bg-cyan-50 border border-cyan-200 px-1 py-0.2 rounded">AI</span>
        </div>
      </Link>

      <nav className="flex items-center gap-3">
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
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors px-2 py-1"
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

