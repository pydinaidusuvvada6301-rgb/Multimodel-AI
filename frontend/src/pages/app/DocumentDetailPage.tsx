import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FileText,
  ArrowLeft,
  Download,
  Trash2,
  RefreshCw,
  MessageSquareCode,
  Sparkles,
  Layers,
  Database,
  ExternalLink,
} from 'lucide-react';
import { api } from '../../lib/api.js';
import { DocumentItem } from '../../types/index.js';
import { Button } from '../../components/ui/Button.js';
import { Card } from '../../components/ui/Card.js';
import { formatBytes, formatDate, getModalityColor, getStatusBadge } from '../../lib/utils.js';

export const DocumentDetailPage: React.FC = () => {
  const { documentId } = useParams<{ documentId: string }>();
  const navigate = useNavigate();

  const [document, setDocument] = useState<DocumentItem | null>(null);
  const [contentData, setContentData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'summary' | 'content' | 'chunks'>('summary');
  const [loading, setLoading] = useState(true);

  const fetchDocument = async () => {
    if (!documentId) return;
    try {
      setLoading(true);
      const [docRes, contentRes] = await Promise.all([
        api.get(`/documents/${documentId}`),
        api.get(`/documents/${documentId}/content`),
      ]);

      if (docRes.data.success) setDocument(docRes.data.data);
      if (contentRes.data.success) setContentData(contentRes.data.data);
    } catch (err) {
      console.error('Failed to load document:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocument();
  }, [documentId]);

  const handleDownload = async () => {
    try {
      const { data } = await api.get(`/documents/${documentId}/download-url`);
      if (data.success && data.data?.downloadUrl) {
        window.open(data.data.downloadUrl, '_blank');
      }
    } catch (err) {
      console.error('Download error:', err);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to permanently delete this document and all indexed chunks?')) return;
    try {
      await api.delete(`/documents/${documentId}`);
      navigate('/app/library');
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  if (loading) {
    return (
      <div className="py-16 text-center text-xs text-slate-400 font-mono">
        Loading document intelligence...
      </div>
    );
  }

  if (!document) {
    return (
      <div className="py-16 text-center space-y-3">
        <p className="text-sm text-slate-300">Document not found.</p>
        <Button size="sm" onClick={() => navigate('/app/library')}>
          Return to Library
        </Button>
      </div>
    );
  }

  const badge = getStatusBadge(document.status);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Back button and Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <button
            onClick={() => navigate(-1)}
            className="text-xs text-slate-400 hover:text-cyan-400 flex items-center gap-1 mb-2 font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
          </button>
          <div className="flex items-center gap-3">
            <span
              className={`text-xs font-mono uppercase px-2.5 py-0.5 rounded border ${getModalityColor(
                document.modality
              )}`}
            >
              {document.modality}
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-100 truncate">
              {document.original_filename}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate(`/app/chat?doc=${document.id}`)}
            icon={<MessageSquareCode className="w-3.5 h-3.5 text-cyan-400" />}
          >
            Ask AI
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleDownload}
            icon={<Download className="w-3.5 h-3.5" />}
          >
            Download
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={handleDelete}
            icon={<Trash2 className="w-3.5 h-3.5" />}
          >
            Delete
          </Button>
        </div>
      </div>

      {/* Metadata Pill Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-3 bg-slate-900 border-slate-800 text-xs">
          <span className="text-slate-500 text-[10px] uppercase font-semibold">Status</span>
          <p className="mt-1">
            <span className={`px-2 py-0.5 rounded-full border text-[10px] ${badge.className}`}>
              {badge.label}
            </span>
          </p>
        </Card>
        <Card className="p-3 bg-slate-900 border-slate-800 text-xs">
          <span className="text-slate-500 text-[10px] uppercase font-semibold">File Size</span>
          <p className="text-slate-200 font-medium mt-1">{formatBytes(document.file_size_bytes)}</p>
        </Card>
        <Card className="p-3 bg-slate-900 border-slate-800 text-xs">
          <span className="text-slate-500 text-[10px] uppercase font-semibold">Ingestion Date</span>
          <p className="text-slate-200 font-medium mt-1">{formatDate(document.created_at)}</p>
        </Card>
        <Card className="p-3 bg-slate-900 border-slate-800 text-xs">
          <span className="text-slate-500 text-[10px] uppercase font-semibold">Indexed Chunks</span>
          <p className="text-slate-200 font-medium mt-1">
            {contentData?.chunks?.length || document.chunk_count || 1} chunks
          </p>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 gap-4 text-xs font-semibold">
        {(['summary', 'content', 'chunks'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-2.5 capitalize border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab === 'summary' ? 'AI Intelligence Summary' : tab === 'content' ? 'Extracted Content' : 'Indexed Chunks'}
          </button>
        ))}
      </div>

      {/* Tab 1: AI Summary & Key Points */}
      {activeTab === 'summary' && (
        <div className="space-y-4">
          <Card className="p-5 space-y-3 bg-surface-200/90 border-slate-800">
            <div className="flex items-center gap-2 text-cyan-400 font-semibold text-xs">
              <Sparkles className="w-4 h-4" />
              <span>Executive Summary</span>
            </div>
            <p className="text-sm text-slate-200 leading-relaxed font-sans">
              {document.summary || 'Summary generation in progress...'}
            </p>
          </Card>

          {document.metadata?.analysis?.key_points && (
            <Card className="p-5 space-y-3 bg-surface-200/90 border-slate-800">
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Key Points Extracted
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-300">
                {document.metadata.analysis.key_points.map((pt: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-cyan-400 mt-0.5">•</span>
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {document.metadata?.analysis?.entities && document.metadata.analysis.entities.length > 0 && (
            <Card className="p-5 space-y-3 bg-surface-200/90 border-slate-800">
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Extracted Entities & Context
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {document.metadata.analysis.entities.map((ent: any, idx: number) => (
                  <div key={idx} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
                    <div className="flex items-center justify-between text-slate-200 font-medium">
                      <span>{ent.name}</span>
                      <span className="text-[10px] font-mono text-cyan-400">{ent.type}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">{ent.context}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Tab 2: Raw Extracted Content */}
      {activeTab === 'content' && (
        <Card className="p-4 bg-slate-950 font-mono text-xs text-slate-300 max-h-[500px] overflow-y-auto leading-relaxed border-slate-800">
          <pre className="whitespace-pre-wrap">{contentData?.extracted_text || 'No text extracted.'}</pre>
        </Card>
      )}

      {/* Tab 3: RAG Chunks */}
      {activeTab === 'chunks' && (
        <div className="space-y-2">
          {contentData?.chunks?.map((chunk: any) => (
            <Card key={chunk.id} className="p-3 bg-slate-900/90 border-slate-800 text-xs space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                <span className="text-cyan-400 font-semibold">Chunk #{chunk.chunk_index}</span>
                {chunk.page_number && <span>Page {chunk.page_number}</span>}
              </div>
              <p className="text-slate-300 leading-relaxed font-sans">{chunk.content}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
