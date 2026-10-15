import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FileText,
  CheckCircle2,
  Clock,
  AlertTriangle,
  UploadCloud,
  MessageSquareCode,
  Search,
  Plus,
  ArrowRight,
  Layers,
  Sparkles,
  FileCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { Card } from '../../components/ui/Card.js';
import { Button } from '../../components/ui/Button.js';
import { Badge } from '../../components/ui/Badge.js';
import { api } from '../../lib/api.js';
import { DocumentItem, Conversation, GeneratedArtifact } from '../../types/index.js';
import { formatBytes, formatDate, getModalityColor, getStatusBadge } from '../../lib/utils.js';

export const DashboardPage: React.FC = () => {
  const { user, activeWorkspace, workspaces } = useAuth();
  const navigate = useNavigate();

  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [artifacts, setArtifacts] = useState<GeneratedArtifact[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [docsRes, convsRes, artsRes] = await Promise.all([
          api.get('/documents', {
            params: activeWorkspace ? { workspaceId: activeWorkspace.id } : {},
          }),
          api.get('/conversations', {
            params: activeWorkspace ? { workspaceId: activeWorkspace.id } : {},
          }),
          api.get('/artifacts', {
            params: activeWorkspace ? { workspaceId: activeWorkspace.id } : {},
          }),
        ]);

        if (docsRes.data.success) setDocuments(docsRes.data.data);
        if (convsRes.data.success) setConversations(convsRes.data.data);
        if (artsRes.data.success) setArtifacts(artsRes.data.data);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [activeWorkspace]);

  // Derived metrics
  const totalDocs = documents.length;
  const readyDocs = documents.filter((d) => d.status === 'ready').length;
  const processingDocs = documents.filter((d) => d.status === 'processing' || d.status === 'queued').length;
  const failedDocs = documents.filter((d) => d.status === 'failed').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-[#202938]">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E5EAF1]">
        <div>
          <h1 className="text-2xl font-bold text-[#202938] tracking-tight">
            Intelligence Overview
          </h1>
          <p className="text-xs text-[#667085] mt-0.5">
            {activeWorkspace ? `Active workspace: ${activeWorkspace.name}` : 'All user workspaces'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate('/app/search')}
            icon={<Search className="w-3.5 h-3.5" />}
          >
            Search
          </Button>
          <Button
            size="sm"
            onClick={() => navigate('/app/upload')}
            icon={<UploadCloud className="w-3.5 h-3.5" />}
          >
            Upload Files
          </Button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="flex items-center justify-between p-4 bg-white border border-[#E5EAF1] shadow-xs">
          <div className="space-y-1">
            <p className="text-xs text-[#667085] font-medium">Total Documents</p>
            <p className="text-2xl font-bold text-[#202938]">{totalDocs}</p>
          </div>
          <div className="w-9 h-9 rounded-md bg-[#EEF4FF] border border-[#D0D7E2] text-[#356AE6] flex items-center justify-center">
            <FileText className="w-4 h-4" />
          </div>
        </Card>

        <Card className="flex items-center justify-between p-4 bg-white border border-[#E5EAF1] shadow-xs">
          <div className="space-y-1">
            <p className="text-xs text-[#667085] font-medium">Ready & Indexed</p>
            <p className="text-2xl font-bold text-[#027A48]">{readyDocs}</p>
          </div>
          <div className="w-9 h-9 rounded-md bg-[#ECFDF3] border border-[#A6F4C5] text-[#027A48] flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </Card>

        <Card className="flex items-center justify-between p-4 bg-white border border-[#E5EAF1] shadow-xs">
          <div className="space-y-1">
            <p className="text-xs text-[#667085] font-medium">Processing Queue</p>
            <p className="text-2xl font-bold text-[#2856C5]">{processingDocs}</p>
          </div>
          <div className="w-9 h-9 rounded-md bg-[#EEF4FF] border border-[#D0D7E2] text-[#2856C5] flex items-center justify-center">
            <Clock className="w-4 h-4" />
          </div>
        </Card>

        <Card className="flex items-center justify-between p-4 bg-white border border-[#E5EAF1] shadow-xs">
          <div className="space-y-1">
            <p className="text-xs text-[#667085] font-medium">Generated Artifacts</p>
            <p className="text-2xl font-bold text-[#202938]">{artifacts.length}</p>
          </div>
          <div className="w-9 h-9 rounded-md bg-[#F8F9FC] border border-[#E5EAF1] text-[#667085] flex items-center justify-center">
            <FileCheck className="w-4 h-4" />
          </div>
        </Card>
      </div>

      {/* Main Grid: Recent Uploads + Quick Launch */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Recent Ingested Files (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#202938] flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#356AE6]" />
              Recent Workspace Ingestions
            </h3>
            <Link
              to="/app/library"
              className="text-xs text-[#356AE6] hover:text-[#2856C5] flex items-center gap-1 font-medium"
            >
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {documents.length === 0 ? (
            <Card className="p-8 text-center space-y-3 bg-white border border-[#E5EAF1] rounded-lg">
              <UploadCloud className="w-9 h-9 text-[#98A2B3] mx-auto" />
              <h4 className="text-sm font-medium text-[#202938]">No documents in this workspace yet</h4>
              <p className="text-xs text-[#667085] max-w-sm mx-auto">
                Upload your PDFs, image screenshots, audio interviews, or videos to start building connected intelligence.
              </p>
              <Button size="sm" onClick={() => navigate('/app/upload')}>
                Upload First File
              </Button>
            </Card>
          ) : (
            <div className="space-y-2">
              {documents.slice(0, 5).map((doc) => {
                const badge = getStatusBadge(doc.status);
                return (
                  <div
                    key={doc.id}
                    onClick={() => navigate(`/app/documents/${doc.id}`)}
                    className="p-3 rounded-lg bg-white hover:bg-[#F7F9FC] border border-[#E5EAF1] hover:border-[#D0D7E2] shadow-xs transition-all cursor-pointer flex items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center gap-3 truncate">
                      <div
                        className={`w-8 h-8 rounded-md border flex items-center justify-center font-mono text-[10px] uppercase font-bold shrink-0 ${getModalityColor(
                          doc.modality
                        )}`}
                      >
                        {doc.modality.slice(0, 3)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-[#202938] group-hover:text-[#356AE6] transition-colors truncate">
                          {doc.original_filename}
                        </p>
                        <p className="text-[11px] text-[#667085] truncate">
                          {formatBytes(doc.file_size_bytes)} • {formatDate(doc.created_at)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${badge.className}`}>
                        {badge.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: AI Assistant Teaser & Recent Conversations */}
        <div className="space-y-4">
          <Card className="p-5 bg-white border border-[#E5EAF1] rounded-lg shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-[#EEF4FF] flex items-center justify-center text-[#356AE6]">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <h4 className="text-sm font-semibold text-[#202938]">Cross-Modal Assistant</h4>
            </div>
            <p className="text-xs text-[#667085] leading-relaxed">
              Ask questions that connect facts across your documents, images, audio transcripts, and video segments.
            </p>
            <Button
              size="sm"
              className="w-full"
              onClick={() => navigate('/app/chat')}
              icon={<MessageSquareCode className="w-3.5 h-3.5" />}
            >
              Open OmniMind Chat
            </Button>
          </Card>

          {/* Recent Conversations */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-[#667085] uppercase tracking-wider">
                Recent Chats
              </h4>
              <Link to="/app/chat" className="text-xs text-[#356AE6] hover:text-[#2856C5] font-medium">
                New
              </Link>
            </div>

            {conversations.length === 0 ? (
              <p className="text-xs text-[#98A2B3] py-2">No conversations yet.</p>
            ) : (
              <div className="space-y-1.5">
                {conversations.slice(0, 4).map((c) => (
                  <div
                    key={c.id}
                    onClick={() => navigate(`/app/chat?c=${c.id}`)}
                    className="p-2.5 rounded-md bg-white hover:bg-[#F7F9FC] text-xs text-[#202938] hover:border-[#D0D7E2] cursor-pointer truncate border border-[#E5EAF1] shadow-xs transition-colors"
                  >
                    <p className="font-medium truncate">{c.title}</p>
                    <p className="text-[10px] text-[#667085] mt-0.5">{formatDate(c.updated_at)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
