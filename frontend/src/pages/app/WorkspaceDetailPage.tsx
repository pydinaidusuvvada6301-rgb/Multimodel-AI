import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Layers,
  UploadCloud,
  MessageSquareCode,
  ArrowLeft,
} from 'lucide-react';
import { api } from '../../lib/api.js';
import { Workspace, DocumentItem } from '../../types/index.js';
import { Button } from '../../components/ui/Button.js';
import { Card } from '../../components/ui/Card.js';
import { Modal } from '../../components/ui/Modal.js';
import { FileDropzone } from '../../components/upload/FileDropzone.js';
import { formatBytes, formatDate, getModalityColor, getStatusBadge } from '../../lib/utils.js';

export const WorkspaceDetailPage: React.FC = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const navigate = useNavigate();

  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [selectedModality, setSelectedModality] = useState<string>('all');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchWorkspace = async () => {
    if (!workspaceId) return;
    try {
      setLoading(true);
      const { data } = await api.get(`/workspaces/${workspaceId}`);
      if (data.success && data.data) {
        setWorkspace(data.data.workspace);
        setDocuments(data.data.documents);
      }
    } catch (err) {
      console.error('Failed to load workspace:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspace();
  }, [workspaceId]);

  const filteredDocs = documents.filter((d) => {
    if (selectedModality !== 'all' && d.modality !== selectedModality) return false;
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-default">
        <div>
          <button
            onClick={() => navigate('/app/workspaces')}
            className="text-xs text-text-secondary hover:text-brand-600 flex items-center gap-1 mb-2 font-medium transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Workspaces
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600">
              <Layers className="w-4 h-4" />
            </div>
            <h1 className="text-xl sm:text-2xl font-semibold text-text-primary tracking-tight">
              {workspace?.name || 'Workspace'}
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-text-secondary mt-1 max-w-2xl">
            {workspace?.description || 'No description provided.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate(`/app/chat?ws=${workspaceId}`)}
            icon={<MessageSquareCode className="w-3.5 h-3.5 text-brand-600" />}
          >
            Chat with Workspace
          </Button>
          <Button
            size="sm"
            onClick={() => setIsUploadModalOpen(true)}
            icon={<UploadCloud className="w-3.5 h-3.5" />}
          >
            Upload to Workspace
          </Button>
        </div>
      </div>

      {/* Modality Filter Pills */}
      <div className="flex flex-wrap items-center gap-2">
        {['all', 'document', 'image', 'audio', 'video', 'structured', 'text'].map((mod) => (
          <button
            key={mod}
            onClick={() => setSelectedModality(mod)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize border transition-colors ${
              selectedModality === mod
                ? 'bg-brand-50 text-brand-700 border-brand-200 font-semibold shadow-xs'
                : 'bg-surface-primary border-border-default text-text-secondary hover:bg-surface-secondary hover:text-text-primary'
            }`}
          >
            {mod === 'all' ? `All Sources (${documents.length})` : mod}
          </button>
        ))}
      </div>

      {/* Documents List */}
      {filteredDocs.length === 0 ? (
        <Card className="p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-xl bg-surface-secondary border border-border-default flex items-center justify-center text-text-muted mx-auto">
            <UploadCloud className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-text-primary">No documents found in this view</h3>
          <p className="text-xs text-text-secondary max-w-sm mx-auto">
            Upload files in supported modalities to populate this knowledge workspace.
          </p>
          <div className="pt-2">
            <Button size="sm" onClick={() => setIsUploadModalOpen(true)}>
              Upload Files
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocs.map((doc) => {
            const badge = getStatusBadge(doc.status);
            return (
              <Card
                key={doc.id}
                hover
                onClick={() => navigate(`/app/documents/${doc.id}`)}
                className="p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border font-semibold ${getModalityColor(
                      doc.modality
                    )}`}
                  >
                    {doc.modality}
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${badge.className}`}>
                    {badge.label}
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-text-primary truncate">
                    {doc.original_filename}
                  </h4>
                  <p className="text-xs text-text-secondary mt-1 line-clamp-2 min-h-[32px] leading-relaxed">
                    {doc.summary || 'Summary generating...'}
                  </p>
                </div>

                <div className="pt-2 border-t border-border-default flex items-center justify-between text-[11px] text-text-muted">
                  <span>{formatBytes(doc.file_size_bytes)}</span>
                  <span>{formatDate(doc.created_at)}</span>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Upload Modal */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="Upload Files to Workspace"
        description={`Files will be indexed directly into ${workspace?.name}`}
        maxWidth="xl"
      >
        <div className="pt-2">
          {workspaceId && (
            <FileDropzone
              workspaceId={workspaceId}
              onUploadComplete={() => {
                setIsUploadModalOpen(false);
                fetchWorkspace();
              }}
            />
          )}
        </div>
      </Modal>
    </div>
  );
};

