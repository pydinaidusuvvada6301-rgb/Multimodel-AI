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
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600">
            <Search className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-text-primary tracking-tight">
              Hybrid Knowledge Search
            </h1>
            <p className="text-xs sm:text-sm text-text-secondary mt-0.5">
              Perform vector semantic similarity searches combined with keyword ranking across your workspace files.
            </p>
          </div>
        </div>
      </div>

      {/* Search Input Box */}
      <Card className="p-4 sm:p-5 space-y-3.5">
        <form onSubmit={handleSearch} className="flex gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-text-muted absolute left-3.5 top-3.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Search across PDFs, diagrams, recordings, and structured files..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-surface-secondary border border-border-default rounded-lg pl-10 pr-4 py-2.5 text-xs sm:text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors"
              autoFocus
            />
          </div>
          <Button type="submit" size="md" loading={loading}>
            Search
          </Button>
        </form>

        <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-1">
          <div className="flex items-center gap-2">
            <span className="text-text-secondary font-medium">Scope:</span>
            <select
              value={selectedWorkspace}
              onChange={(e) => setSelectedWorkspace(e.target.value)}
              className="bg-surface-secondary border border-border-default rounded-lg px-2.5 py-1 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-brand-500 font-medium"
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
            <span className="text-text-secondary font-medium">Search Engine:</span>
            <div className="flex rounded-lg bg-surface-secondary border border-border-default p-0.5">
              <button
                type="button"
                onClick={() => setSearchMode('hybrid')}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                  searchMode === 'hybrid'
                    ? 'bg-brand-600 text-white font-semibold'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                Hybrid (Vector + Full-Text)
              </button>
              <button
                type="button"
                onClick={() => setSearchMode('semantic')}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                  searchMode === 'semantic'
                    ? 'bg-brand-600 text-white font-semibold'
                    : 'text-text-secondary hover:text-text-primary'
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
          <p className="text-xs text-text-secondary font-medium">
            Found <strong className="text-text-primary">{results.length}</strong> relevant chunk(s) for "{query}"
          </p>
        )}

        {hasSearched && results.length === 0 && !loading && (
          <Card className="p-8 text-center text-xs text-text-secondary space-y-2">
            <p className="font-semibold text-text-primary">No matching evidence found.</p>
            <p className="text-[11px] text-text-muted">
              Try adjusting your query keywords or upload additional documents to this workspace.
            </p>
          </Card>
        )}

        {results.map((res, idx) => (
          <Card
            key={res.id || idx}
            hover
            onClick={() => navigate(`/app/documents/${res.document_id}`)}
            className="p-4 space-y-2.5 cursor-pointer"
          >
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border font-semibold ${getModalityColor(
                    res.modality
                  )}`}
                >
                  {res.modality}
                </span>
                <span className="font-semibold text-text-primary">{res.document_name}</span>
                {res.page_number && (
                  <span className="text-text-muted text-[11px]">Page {res.page_number}</span>
                )}
                {res.start_seconds !== undefined && res.start_seconds !== null && (
                  <span className="text-text-muted text-[11px]">{res.start_seconds}s</span>
                )}
              </div>

              {res.relevance_score && (
                <span className="text-[11px] text-brand-600 font-mono font-medium bg-brand-50 px-2 py-0.5 rounded border border-brand-100">
                  Relevance: {Math.round(res.relevance_score * 100)}%
                </span>
              )}
            </div>

            <p className="text-xs text-text-secondary leading-relaxed font-sans bg-surface-secondary/60 p-3 rounded-lg border border-border-default">
              {res.content}
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
};

