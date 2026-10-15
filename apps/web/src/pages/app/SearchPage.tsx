import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Sparkles, Filter, FileText, ArrowRight, Layers, Tag } from 'lucide-react';
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
      <div>
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
          <Search className="w-6 h-6 text-cyan-400" />
          Hybrid Knowledge Search
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Perform vector semantic similarity searches combined with keyword ranking across your workspace files.
        </p>
      </div>

      {/* Search Input Box */}
      <Card className="p-4 bg-surface-200/90 border-slate-700 space-y-3">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
            <input
              type="text"
              placeholder="Search across PDFs, diagrams, recordings, and structured files..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              autoFocus
            />
          </div>
          <Button type="submit" size="md" loading={loading}>
            Search
          </Button>
        </form>

        <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-1">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Scope:</span>
            <select
              value={selectedWorkspace}
              onChange={(e) => setSelectedWorkspace(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 focus:outline-none"
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
            <span className="text-slate-400">Search Engine:</span>
            <div className="flex rounded-lg bg-slate-900 border border-slate-700 p-0.5">
              <button
                type="button"
                onClick={() => setSearchMode('hybrid')}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                  searchMode === 'hybrid'
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Hybrid (Vector + Full-Text)
              </button>
              <button
                type="button"
                onClick={() => setSearchMode('semantic')}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                  searchMode === 'semantic'
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Semantic Vector
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* Results List */}
      <div className="space-y-3">
        {hasSearched && (
          <p className="text-xs text-slate-400 font-medium">
            Found {results.length} relevant chunk(s) for "{query}"
          </p>
        )}

        {hasSearched && results.length === 0 && !loading && (
          <Card className="p-8 text-center text-xs text-slate-400 space-y-2">
            <p>No matching evidence found.</p>
            <p className="text-[11px] text-slate-500">
              Try adjusting your query keywords or upload additional documents to this workspace.
            </p>
          </Card>
        )}

        {results.map((res, idx) => (
          <Card
            key={res.id || idx}
            hover
            onClick={() => navigate(`/app/documents/${res.document_id}`)}
            className="p-4 space-y-2.5 bg-slate-900/80 border-slate-800"
          >
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border ${getModalityColor(
                    res.modality
                  )}`}
                >
                  {res.modality}
                </span>
                <span className="font-semibold text-slate-200">{res.document_name}</span>
                {res.page_number && (
                  <span className="text-slate-400 text-[11px]">Page {res.page_number}</span>
                )}
                {res.start_seconds !== undefined && res.start_seconds !== null && (
                  <span className="text-slate-400 text-[11px]">{res.start_seconds}s</span>
                )}
              </div>

              {res.relevance_score && (
                <span className="text-[11px] text-cyan-400 font-mono font-medium">
                  Relevance: {Math.round(res.relevance_score * 100)}%
                </span>
              )}
            </div>

            <p className="text-xs text-slate-300 leading-relaxed font-sans bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
              {res.content}
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
};
