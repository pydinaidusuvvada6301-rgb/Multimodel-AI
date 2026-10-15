import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { api } from '../../lib/api.js';
import { useAuth } from '../../context/AuthContext.js';
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
    <div className="space-y-6 max-w-5xl mx-auto text-slate-900">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm">
            <Search className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Hybrid Knowledge Search
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Perform vector semantic similarity searches combined with keyword ranking across your workspace files.
            </p>
          </div>
        </div>
      </div>

      {/* Search Input Box */}
      <div className="p-4 sm:p-5 space-y-3.5 rounded-2xl border border-slate-200 bg-white shadow-sm">
        <form onSubmit={handleSearch} className="flex gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Search across PDFs, diagrams, recordings, and structured files..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-colors"
              autoFocus
            />
          </div>
          <Button
            type="submit"
            size="md"
            loading={loading}
          >
            Search
          </Button>
        </form>

        <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-1">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium">Scope:</span>
            <select
              value={selectedWorkspace}
              onChange={(e) => setSelectedWorkspace(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium cursor-pointer"
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
            <span className="text-slate-500 font-medium">Search Engine:</span>
            <div className="flex rounded-xl bg-slate-100 border border-slate-200 p-0.5">
              <button
                type="button"
                onClick={() => setSearchMode('hybrid')}
                className={`px-3 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${
                  searchMode === 'hybrid'
                    ? 'bg-blue-600 text-white font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Hybrid (Vector + Full-Text)
              </button>
              <button
                type="button"
                onClick={() => setSearchMode('semantic')}
                className={`px-3 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${
                  searchMode === 'semantic'
                    ? 'bg-blue-600 text-white font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
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
          <p className="text-xs text-slate-500 font-semibold">
            Found <strong className="text-blue-600">{results.length}</strong> relevant chunk(s) for "{query}"
          </p>
        )}

        {hasSearched && results.length === 0 && !loading && (
          <div className="p-8 text-center text-xs text-slate-500 space-y-2 rounded-2xl border border-slate-200 bg-white shadow-sm">
            <p className="font-bold text-slate-900">No matching evidence found.</p>
            <p className="text-[11px] text-slate-500">
              Try adjusting your query keywords or upload additional documents to this workspace.
            </p>
          </div>
        )}

        {results.map((res, idx) => (
          <div
            key={res.id || idx}
            onClick={() => navigate(`/app/documents/${res.document_id}`)}
            className="p-4 space-y-2.5 cursor-pointer rounded-xl bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 transition-all shadow-xs group"
          >
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-lg border font-bold ${getModalityColor(
                    res.modality
                  )}`}
                >
                  {res.modality}
                </span>
                <span className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{res.document_name}</span>
                {res.page_number && (
                  <span className="text-slate-500 text-[11px]">Page {res.page_number}</span>
                )}
                {res.start_seconds !== undefined && res.start_seconds !== null && (
                  <span className="text-slate-500 text-[11px]">{res.start_seconds}s</span>
                )}
              </div>

              {res.relevance_score && (
                <span className="text-[11px] text-blue-700 font-mono font-semibold bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                  Relevance: {Math.round(res.relevance_score * 100)}%
                </span>
              )}
            </div>

            <p className="text-xs text-slate-800 leading-relaxed font-sans bg-slate-50 p-3 rounded-lg border border-slate-200">
              {res.content}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};


