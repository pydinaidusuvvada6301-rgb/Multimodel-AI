import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { api } from '../../lib/api.js';
import { useAuth } from '../../context/AuthContext.js';
import { Card } from '../../components/ui/Card.js';
import { Button } from '../../components/ui/Button.js';
import { getModalityColor } from '../../lib/utils.js';

export const SearchPage: React.FC = () => {
  const { workspaces, activeWorkspace } = useAuth();
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [selectedWorkspace, setSelectedWorkspace] = useState(activeWorkspace?.id || 'all');
  const [searchMode, setSearchMode] = useState<'hybrid' | 'semantic'>('hybrid');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setHasSearched(true);
    try {
      const endpoint = searchMode === 'semantic' ? '/search/semantic' : '/search/hybrid';
      const { data } = await api.post(endpoint, {
        query: query.trim(),
        workspaceId: selectedWorkspace !== 'all' ? selectedWorkspace : undefined,
        limit: 15,
      });

      if (data.success) {
        setResults(data.data);
      }
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#4F8CFF] to-[#42E8F5] flex items-center justify-center text-white shadow-lg shadow-[#4F8CFF]/20">
            <Search className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold font-display text-[#F4F7FF] tracking-tight">
              Hybrid Knowledge Search
            </h1>
            <p className="text-xs sm:text-sm text-[#9AA8C7] mt-0.5">
              Perform vector semantic similarity searches combined with keyword ranking across your workspace files.
            </p>
          </div>
        </div>
      </div>

      {/* Search Input Box */}
      <div className="glass-card p-4 sm:p-5 space-y-3.5 rounded-2xl border border-[rgba(79,140,255,0.2)] bg-[#0D1428]/80 backdrop-blur-md">
        <form onSubmit={handleSearch} className="flex gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#9AA8C7] absolute left-3.5 top-3.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Search across PDFs, diagrams, recordings, and structured files..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-[#070B17] border border-[rgba(79,140,255,0.25)] rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-[#F4F7FF] placeholder:text-[#9AA8C7]/60 focus:outline-none focus:ring-2 focus:ring-[#4F8CFF]/30 focus:border-[#4F8CFF] transition-colors"
              autoFocus
            />
          </div>
          <Button
            type="submit"
            size="md"
            loading={loading}
            className="bg-gradient-to-r from-[#4F8CFF] to-[#42E8F5] text-[#070B17] font-semibold"
          >
            Search
          </Button>
        </form>

        <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-1">
          <div className="flex items-center gap-2">
            <span className="text-[#9AA8C7] font-medium">Scope:</span>
            <select
              value={selectedWorkspace}
              onChange={(e) => setSelectedWorkspace(e.target.value)}
              className="bg-[#070B17] border border-[rgba(79,140,255,0.25)] rounded-xl px-3 py-1.5 text-xs text-[#F4F7FF] focus:outline-none focus:ring-1 focus:ring-[#4F8CFF] font-medium"
            >
              <option value="all">All Workspaces</option>
              {workspaces.map((ws) => (
                <option key={ws.id} value={ws.id}>
                  {ws.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[#9AA8C7] font-medium">Search Engine:</span>
            <div className="flex rounded-xl bg-[#070B17] border border-[rgba(79,140,255,0.25)] p-0.5">
              <button
                type="button"
                onClick={() => setSearchMode('hybrid')}
                className={`px-3 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                  searchMode === 'hybrid'
                    ? 'bg-[#4F8CFF] text-[#070B17] font-bold'
                    : 'text-[#9AA8C7] hover:text-[#F4F7FF]'
                }`}
              >
                Hybrid (Vector + Full-Text)
              </button>
              <button
                type="button"
                onClick={() => setSearchMode('semantic')}
                className={`px-3 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                  searchMode === 'semantic'
                    ? 'bg-[#4F8CFF] text-[#070B17] font-bold'
                    : 'text-[#9AA8C7] hover:text-[#F4F7FF]'
                }`}
              >
                Semantic Vector
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Results List */}
      <div className="space-y-3">
        {hasSearched && (
          <p className="text-xs text-[#9AA8C7] font-medium">
            Found <strong className="text-[#42E8F5]">{results.length}</strong> relevant chunk(s) for "{query}"
          </p>
        )}

        {hasSearched && results.length === 0 && !loading && (
          <div className="glass-card p-8 text-center text-xs text-[#9AA8C7] space-y-2 rounded-2xl border border-[rgba(79,140,255,0.2)] bg-[#0D1428]/80">
            <p className="font-semibold text-[#F4F7FF]">No matching evidence found.</p>
            <p className="text-[11px] text-[#9AA8C7]/70">
              Try adjusting your query keywords or upload additional documents to this workspace.
            </p>
          </div>
        )}

        {results.map((res, idx) => (
          <div
            key={res.id || idx}
            onClick={() => navigate(`/app/documents/${res.document_id}`)}
            className="glass-card p-4 space-y-2.5 cursor-pointer rounded-xl bg-[#0D1428]/70 hover:bg-[#0D1428] border border-[rgba(79,140,255,0.18)] hover:border-[#42E8F5]/40 transition-all shadow-md group"
          >
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-lg border font-semibold ${getModalityColor(
                    res.modality
                  )}`}
                >
                  {res.modality}
                </span>
                <span className="font-semibold text-[#F4F7FF] group-hover:text-[#42E8F5] transition-colors">{res.document_name}</span>
                {res.page_number && (
                  <span className="text-[#9AA8C7] text-[11px]">Page {res.page_number}</span>
                )}
                {res.start_seconds !== undefined && res.start_seconds !== null && (
                  <span className="text-[#9AA8C7] text-[11px]">{res.start_seconds}s</span>
                )}
              </div>

              {res.relevance_score && (
                <span className="text-[11px] text-[#42E8F5] font-mono font-medium bg-[#4F8CFF]/15 px-2.5 py-0.5 rounded-full border border-[#4F8CFF]/30">
                  Relevance: {Math.round(res.relevance_score * 100)}%
                </span>
              )}
            </div>

            <p className="text-xs text-[#F4F7FF]/90 leading-relaxed font-sans bg-[#070B17]/70 p-3 rounded-lg border border-[rgba(79,140,255,0.15)]">
              {res.content}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

