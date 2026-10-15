import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FileText,
  ArrowLeft,
  Download,
  Trash2,
  MessageSquareCode,
  Sparkles,
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
      <div className="py-16 text-center text-xs text-text-muted font-mono">
        Loading document intelligence...
      </div>
    );
  }

  if (!document) {
    return (
      <div className="py-16 text-center space-y-3">
        <p className="text-sm text-text-primary">Document not found.</p>
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-default">
        <div>
          <button
            onClick={() => navigate(-1)}
            className="text-xs text-text-secondary hover:text-brand-600 flex items-center gap-1 mb-2 font-medium transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
          </button>
          <div className="flex items-center gap-3">
            <span
              className={`text-xs font-mono uppercase px-2.5 py-0.5 rounded border font-semibold ${getModalityColor(
                document.modality
              )}`}
            >
              {document.modality}
            </span>
            <h1 className="text-xl sm:text-2xl font-semibold text-text-primary tracking-tight truncate">
              {document.original_filename}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate(`/app/chat?doc=${document.id}`)}
            icon={<MessageSquareCode className="w-3.5 h-3.5 text-brand-600" />}
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
        <Card className="p-3.5 text-xs">
          <span className="text-text-muted text-[10px] uppercase font-semibold tracking-wider">Status</span>
          <p className="mt-1">
            <span className={`px-2 py-0.5 rounded-full border text-[11px] font-medium ${badge.className}`}>
              {badge.label}
            </span>
          </p>
        </Card>
        <Card className="p-3.5 text-xs">
          <span className="text-text-muted text-[10px] uppercase font-semibold tracking-wider">File Size</span>
          <p className="text-text-primary font-medium mt-1">{formatBytes(document.file_size_bytes)}</p>
        </Card>
        <Card className="p-3.5 text-xs">
          <span className="text-text-muted text-[10px] uppercase font-semibold tracking-wider">Ingestion Date</span>
          <p className="text-text-primary font-medium mt-1">{formatDate(document.created_at)}</p>
        </Card>
        <Card className="p-3.5 text-xs">
          <span className="text-text-muted text-[10px] uppercase font-semibold tracking-wider">Indexed Chunks</span>
          <p className="text-text-primary font-medium mt-1">
            {contentData?.chunks?.length || document.chunk_count || 1} chunks
          </p>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border-default gap-4 text-xs font-semibold">
        {(['summary', 'content', 'chunks'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-2.5 capitalize border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-brand-600 text-brand-600 font-semibold'
                : 'border-transparent text-text-muted hover:text-text-primary'
            }`}
          >
            {tab === 'summary' ? 'AI Intelligence Summary' : tab === 'content' ? 'Extracted Content' : 'Indexed Chunks'}
          </button>
        ))}
      </div>

      {/* Tab 1: AI Summary & Key Points */}
      {activeTab === 'summary' && (
        <div className="space-y-4">
          <Card className="p-5 sm:p-6 space-y-3">
            <div className="flex items-center gap-2 text-brand-600 font-semibold text-xs">
              <Sparkles className="w-4 h-4" />
              <span className="text-text-primary font-semibold text-sm">Executive Summary</span>
            </div>
            <p className="text-sm text-text-primary leading-relaxed">
              {document.summary || 'Summary generation in progress...'}
            </p>
          </Card>

          {document.metadata?.analysis?.key_points && (
            <Card className="p-5 sm:p-6 space-y-3">
              <h4 className="text-xs font-semibold text-text-primary uppercase tracking-wider">
                Key Points Extracted
              </h4>
              <ul className="space-y-1.5 text-xs text-text-secondary">
                {document.metadata.analysis.key_points.map((pt: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-brand-600 mt-0.5">•</span>
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {document.metadata?.analysis?.entities && document.metadata.analysis.entities.length > 0 && (
            <Card className="p-5 sm:p-6 space-y-3">
              <h4 className="text-xs font-semibold text-text-primary uppercase tracking-wider">
                Extracted Entities & Context
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {document.metadata.analysis.entities.map((ent: any, idx: number) => (
                  <div key={idx} className="p-3 rounded-lg bg-surface-secondary border border-border-default text-xs">
                    <div className="flex items-center justify-between text-text-primary font-medium">
                      <span>{ent.name}</span>
                      <span className="text-[10px] font-mono text-brand-600 bg-brand-50 px-1.5 py-0.5 rounded border border-brand-100 font-semibold">{ent.type}</span>
                    </div>
                    <p className="text-[11px] text-text-secondary mt-1">{ent.context}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Tab 2: Raw Extracted Content */}
      {activeTab === 'content' && (
        <Card className="p-4 bg-surface-secondary font-mono text-xs text-text-primary max-h-[500px] overflow-y-auto leading-relaxed border-border-default">
          <pre className="whitespace-pre-wrap">{contentData?.extracted_text || 'No text extracted.'}</pre>
        </Card>
      )}

      {/* Tab 3: RAG Chunks */}
      {activeTab === 'chunks' && (
        <div className="space-y-2">
          {contentData?.chunks?.map((chunk: any) => (
            <Card key={chunk.id} className="p-3.5 text-xs space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-text-secondary font-mono">
                <span className="text-brand-600 font-semibold">Chunk #{chunk.chunk_index}</span>
                {chunk.page_number && <span>Page {chunk.page_number}</span>}
              </div>
              <p className="text-text-primary leading-relaxed font-sans">{chunk.content}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

