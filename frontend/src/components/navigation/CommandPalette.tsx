import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  MessageSquareCode,
  UploadCloud,
  FolderOpen,
  Layers,
  FileText,
  Settings,
  Sparkles,
  Command,
  ArrowRight,
  Compass,
} from 'lucide-react';

interface CommandItem {
  id: string;
  title: string;
  category: 'Navigation' | 'Actions' | 'Tools';
  icon: React.ElementType;
  route?: string;
  action?: () => void;
  shortcut?: string;
}

export const CommandPalette: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  const commandItems: CommandItem[] = [
    {
      id: 'chat',
      title: 'AI Chat Workspace',
      category: 'Navigation',
      icon: MessageSquareCode,
      route: '/app/chat',
      shortcut: 'C',
    },
    {
      id: 'upload',
      title: 'Multimodal Ingestion Center',
      category: 'Navigation',
      icon: UploadCloud,
      route: '/app/upload',
      shortcut: 'U',
    },
    {
      id: 'library',
      title: 'Knowledge Library',
      category: 'Navigation',
      icon: FolderOpen,
      route: '/app/library',
      shortcut: 'L',
    },
    {
      id: 'workspaces',
      title: 'Knowledge Workspaces',
      category: 'Navigation',
      icon: Layers,
      route: '/app/workspaces',
      shortcut: 'W',
    },
    {
      id: 'reports',
      title: 'Generated Intelligence Reports',
      category: 'Navigation',
      icon: FileText,
      route: '/app/reports',
      shortcut: 'R',
    },
    {
      id: 'search',
      title: 'Hybrid Knowledge Search',
      category: 'Navigation',
      icon: Search,
      route: '/app/search',
      shortcut: 'S',
    },
    {
      id: 'settings',
      title: 'Settings & Security',
      category: 'Navigation',
      icon: Settings,
      route: '/app/settings',
    },
    {
      id: 'action-compare',
      title: 'Cross-Modal Comparison Report',
      category: 'Actions',
      icon: Sparkles,
      route: '/app/reports',
    },
    {
      id: 'action-guide',
      title: 'OmniMind Onboarding Guide',
      category: 'Tools',
      icon: Compass,
      route: '/app/dashboard',
    },
  ];

  const filteredItems = commandItems.filter((item) =>
    item.title.toLowerCase().includes(query.toLowerCase()) ||
    item.category.toLowerCase().includes(query.toLowerCase())
  );

  // Keyboard shortcut listener for Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const handleSelect = (item: CommandItem) => {
    setIsOpen(false);
    if (item.action) {
      item.action();
    } else if (item.route) {
      navigate(item.route);
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredItems.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
    } else if (e.key === 'Enter' && filteredItems[selectedIndex]) {
      e.preventDefault();
      handleSelect(filteredItems[selectedIndex]);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
      {/* Backdrop */}
      <div
        onClick={() => setIsOpen(false)}
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-xl bg-surface-primary rounded-2xl border border-border-default shadow-2xl overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-border-default gap-3">
          <Search className="w-4 h-4 text-brand-600 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command or search workspace tools (Ctrl+K)..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleInputKeyDown}
            className="w-full bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
          />
          <span className="text-[10px] font-mono text-text-muted bg-surface-secondary px-2 py-0.5 rounded border border-border-default">
            ESC
          </span>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filteredItems.length === 0 ? (
            <div className="p-8 text-center text-xs text-text-muted">
              No matching commands or routes found for "{query}".
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between p-3 rounded-xl text-xs cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-brand-50 text-brand-700 font-medium'
                      : 'text-text-secondary hover:bg-surface-secondary'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${
                        isSelected
                          ? 'bg-brand-600 text-white border-brand-600'
                          : 'bg-surface-secondary border-border-default text-text-muted'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="text-text-primary font-semibold">{item.title}</span>
                      <span className="text-[10px] text-text-muted ml-2 font-mono">
                        {item.category}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {item.shortcut && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-primary border border-border-default text-text-muted">
                        {item.shortcut}
                      </span>
                    )}
                    <ArrowRight className="w-3.5 h-3.5 opacity-60" />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Hint */}
        <div className="p-2.5 px-4 bg-surface-secondary/40 border-t border-border-default flex items-center justify-between text-[11px] text-text-muted">
          <span>Navigate with ↑ ↓ • Press Enter to execute</span>
          <span className="flex items-center gap-1 font-mono text-[10px]">
            <Command className="w-3 h-3" /> + K to toggle
          </span>
        </div>
      </div>
    </div>
  );
};
