import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FolderOpen,
  Search,
  Trash2,
  RefreshCw,
  Plus,
} from 'lucide-react';
import { api } from '../../lib/api.js';
import { DocumentItem } from '../../types/index.js';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';
import { Card } from '../../components/ui/Card.js';
import { Button } from '../../components/ui/Button.js';
import { formatBytes, formatDate, getModalityColor, getStatusBadge } from '../../lib/utils.js';

export const LibraryPage: React.FC = () => {
  const { workspaces, activeWorkspace } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [search, setSearch] = useState('');
  const [selectedModality, setSelectedModality] = useState('all');
  const [selectedWorkspace, setSelectedWorkspace] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (selectedWorkspace !== 'all') params.workspaceId = selectedWorkspace;
      if (selectedModality !== 'all') params.modality = selectedModality;
      if (search.trim()) params.search = search.trim();

      const { data } = await api.get('/documents', { params });
      if (data.success) {
        setDocuments(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch library documents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [selectedWorkspace, selectedModality]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchDocuments();
  };

  const handleRetry = async (docId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.post(`/documents/${docId}/retry`);
      toast.info('Document re-queued for processing.');
      fetchDocuments();
    } catch (err) {
      console.error('Failed to retry document:', err);
      toast.error('Failed to retry document processing.');
    }
  };

  const handleDelete = async (docId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this file and remove its knowledge chunks?')) return;
    try {
      await api.delete(`/documents/${docId}`);
      toast.success('Document and indexed knowledge deleted.');
      fetchDocuments();
    } catch (err) {
      console.error('Failed to delete document:', err);
      toast.error('Failed to delete document.');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-border-default">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600">
              <FolderOpen className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold text-text-primary tracking-tight">
                Knowledge Library
              </h1>
              <p className="text-xs sm:text-sm text-text-secondary mt-0.5">
                Browse, filter, inspect, and manage all your multimodal source files.
              </p>
            </div>
          </div>
        </div>

        <Button size="sm" onClick={() => navigate('/app/upload')} icon={<Plus className="w-4 h-4" />}>
          Upload New File
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-3 sm:p-4 flex flex-col md:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <Search className="w-3.5 h-3.5 text-text-muted absolute left-3 top-3 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by filename or content..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-surface-secondary border border-border-default rounded-lg pl-9 pr-3 py-2 text-xs sm:text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors"
          />
        </form>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          {/* Workspace Filter */}
          <select
            value={selectedWorkspace}
            onChange={(e) => setSelectedWorkspace(e.target.value)}
            className="bg-surface-secondary border border-border-default rounded-lg px-3 py-2 text-xs sm:text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-brand-500 font-medium"
          >
            <option value="all">All Workspaces</option>
            {workspaces.map((ws) => (
              <option key={ws.id} value={ws.id}>
                {ws.name}
              </option>
            ))}
          </select>

          {/* Modality Filter */}
          <select
            value={selectedModality}
            onChange={(e) => setSelectedModality(e.target.value)}
            className="bg-surface-secondary border border-border-default rounded-lg px-3 py-2 text-xs sm:text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-brand-500 font-medium capitalize"
          >
            <option value="all">All Modalities</option>
            {['document', 'image', 'audio', 'video', 'structured', 'text'].map((mod) => (
              <option key={mod} value={mod}>
                {mod}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {/* Document Table / Cards */}
      {documents.length === 0 ? (
        <Card className="p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-xl bg-surface-secondary border border-border-default flex items-center justify-center text-text-muted mx-auto">
            <FolderOpen className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-text-primary">No documents found</h3>
          <p className="text-xs text-text-secondary max-w-sm mx-auto">
            Try adjusting your search criteria or upload files to your workspace.
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {documents.map((doc) => {
            const badge = getStatusBadge(doc.status);
            return (
              <div
                key={doc.id}
                onClick={() => navigate(`/app/documents/${doc.id}`)}
                className="p-3.5 rounded-xl bg-surface-primary hover:bg-surface-secondary/70 border border-border-default hover:border-brand-200 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 group shadow-xs"
              >
                <div className="flex items-center gap-3 truncate">
                  <div
                    className={`w-9 h-9 rounded-lg border flex items-center justify-center font-mono text-[10px] uppercase font-bold shrink-0 ${getModalityColor(
                      doc.modality
                    )}`}
                  >
                    {doc.modality.slice(0, 3)}
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-semibold text-text-primary group-hover:text-brand-600 transition-colors truncate">
                      {doc.original_filename}
                    </p>
                    <p className="text-[11px] sm:text-xs text-text-secondary mt-0.5 truncate">
                      {formatBytes(doc.file_size_bytes)} • {formatDate(doc.created_at)}
                      {doc.category && ` • Category: ${doc.category}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
                  <span className={`text-[11px] px-2.5 py-0.5 rounded-full border font-medium ${badge.className}`}>
                    {badge.label}
                  </span>

                  {doc.status === 'failed' && (
                    <button
                      onClick={(e) => handleRetry(doc.id, e)}
                      className="p-1 text-brand-600 hover:text-brand-700 hover:bg-brand-50 rounded transition-colors"
                      title="Retry processing"
                      aria-label="Retry processing"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <button
                    onClick={(e) => handleDelete(doc.id, e)}
                    className="p-1 text-text-muted hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                    title="Delete document"
                    aria-label="Delete document"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

