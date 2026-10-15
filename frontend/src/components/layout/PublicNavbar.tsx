import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '../ui/Button.js';
import { useAuth } from '../../context/AuthContext.js';

export const PublicNavbar: React.FC = () => {
  const { user } = useAuth();

  return (
    <header className="w-full h-16 border-b border-slate-800/80 bg-surface-500/80 backdrop-blur-md sticky top-0 z-50 px-4 sm:px-8 flex items-center justify-between">
      <Link to="/" className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
          <Sparkles className="w-4 h-4 text-slate-950 font-bold" />
        </div>
        <div className="flex items-center">
          <span className="font-bold text-slate-100 text-base tracking-tight">OmniMind</span>
          <span className="text-cyan-400 font-extrabold text-sm ml-1">AI</span>
        </div>
      </Link>

      <nav className="flex items-center gap-4">
        {user ? (
          <Link to="/app">
            <Button size="sm" icon={<ArrowRight className="w-4 h-4" />}>
              Open Workspace
            </Button>
          </Link>
        ) : (
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-xs font-medium text-slate-300 hover:text-white transition-colors">
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
