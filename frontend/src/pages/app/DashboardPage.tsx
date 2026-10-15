import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FileText,
  CheckCircle2,
  Clock,
  UploadCloud,
  MessageSquareCode,
  Search,
  ArrowRight,
  Sparkles,
  FileCheck,
  Send,
  Zap,
  Compass,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { Card } from '../../components/ui/Card.js';
import { Button } from '../../components/ui/Button.js';
import { GlobeScene } from '../../components/3d/GlobeScene.js';
import { api } from '../../lib/api.js';
import { DocumentItem, Conversation, GeneratedArtifact } from '../../types/index.js';
import { formatBytes, formatDate, getModalityColor, getStatusBadge } from '../../lib/utils.js';

export const DashboardPage: React.FC = () => {
  const { user, activeWorkspace } = useAuth();
  const navigate = useNavigate();

  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [artifacts, setArtifacts] = useState<GeneratedArtifact[]>([]);
  const [smartPrompt, setSmartPrompt] = useState('');
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

  // Time-aware greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const isNewUser = totalDocs === 0 && conversations.length === 0;

  // Smart Natural-Language Command Interface Handler
  const handleSmartCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = smartPrompt.trim();
    if (!query) return;

    const lower = query.toLowerCase();

    // Natural-language workflow detection
    if (lower.includes('compare') || lower.includes('comparison')) {
      navigate('/app/reports');
    } else if (lower.includes('summarize') && (lower.includes('pdf') || lower.includes('report') || lower.includes('guide'))) {
      navigate('/app/reports');
    } else if (lower.includes('upload') || lower.includes('add file') || lower.includes('ingest')) {
      navigate('/app/upload');
    } else if (lower.includes('search') || lower.includes('find') || lower.includes('lookup')) {
      navigate(`/app/search`);
    } else {
      // Route question directly to chat
      navigate(`/app/chat`);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-text-primary">
      {/* Personalized Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border-default">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-600 animate-pulse" />
            <h1 className="text-xl sm:text-2xl font-semibold text-text-primary tracking-tight">
              {getGreeting()}, {user?.displayName || 'Researcher'}
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-text-secondary mt-0.5">
            {activeWorkspace
              ? `Workspace: ${activeWorkspace.name} (${activeWorkspace.category})`
              : 'All user multimodal collections'}
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

      {/* Onboarding Guidance for New Users */}
      {isNewUser && !loading && (
        <Card className="p-5 sm:p-6 bg-brand-50/50 border border-brand-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-brand-700 font-semibold text-xs uppercase tracking-wider">
              <Compass className="w-4 h-4" />
              <span>Workspace Setup Recommendation</span>
            </div>
            <h3 className="text-sm font-semibold text-text-primary">
              Welcome to your connected multimodal intelligence workspace
            </h3>
            <p className="text-xs text-text-secondary max-w-xl leading-relaxed">
              Upload your first PDF, image diagram, audio lecture, or video to begin semantic chunking and grounded cross-source reasoning.
            </p>
          </div>
          <Button size="sm" onClick={() => navigate('/app/upload')} icon={<UploadCloud className="w-4 h-4" />}>
            Ingest First Source
          </Button>
        </Card>
      )}

      {/* Smart Command Interface: Unified Natural-Language Input Box */}
      <Card className="p-4 sm:p-5 shadow-xs space-y-3">
        <form onSubmit={handleSmartCommandSubmit} className="flex gap-2.5">
          <div className="relative flex-1">
            <Sparkles className="w-4 h-4 text-brand-600 absolute left-3.5 top-3.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Ask OmniMind AI or run a command (e.g., 'Summarize this PDF', 'Compare documents', 'Search web')..."
              value={smartPrompt}
              onChange={(e) => setSmartPrompt(e.target.value)}
              className="w-full bg-surface-secondary border border-border-default rounded-lg pl-10 pr-4 py-2.5 text-xs sm:text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors"
            />
          </div>
          <Button type="submit" size="md" icon={<Send className="w-4 h-4" />}>
            Execute
          </Button>
        </form>

        {/* Dynamic Next-Step Suggestions */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          <span className="text-text-muted text-[11px] font-medium flex items-center gap-1">
            <Zap className="w-3 h-3 text-brand-600" /> Suggested workflows:
          </span>
          <button
            type="button"
            onClick={() => setSmartPrompt('Summarize key findings across uploaded files')}
            className="px-2.5 py-1 rounded-md bg-surface-secondary hover:bg-brand-50 border border-border-default text-text-secondary hover:text-brand-600 transition-colors text-[11px]"
          >
            "Summarize uploaded files"
          </button>
          <button
            type="button"
            onClick={() => setSmartPrompt('Compare system architecture diagrams with specifications')}
            className="px-2.5 py-1 rounded-md bg-surface-secondary hover:bg-brand-50 border border-border-default text-text-secondary hover:text-brand-600 transition-colors text-[11px]"
          >
            "Compare specs with diagrams"
          </button>
          <button
            type="button"
            onClick={() => navigate('/app/search')}
            className="px-2.5 py-1 rounded-md bg-surface-secondary hover:bg-brand-50 border border-border-default text-text-secondary hover:text-brand-600 transition-colors text-[11px]"
          >
            "Search 768-dim embeddings"
          </button>
        </div>
      </Card>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="flex items-center justify-between p-4 shadow-xs">
          <div className="space-y-1">
            <p className="text-xs text-text-secondary font-medium">Total Documents</p>
            <p className="text-2xl font-bold text-text-primary">{totalDocs}</p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-brand-50 border border-brand-100 text-brand-600 flex items-center justify-center">
            <FileText className="w-4 h-4" />
          </div>
        </Card>

        <Card className="flex items-center justify-between p-4 shadow-xs">
          <div className="space-y-1">
            <p className="text-xs text-text-secondary font-medium">Ready & Indexed</p>
            <p className="text-2xl font-bold text-emerald-600">{readyDocs}</p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </Card>

        <Card className="flex items-center justify-between p-4 shadow-xs">
          <div className="space-y-1">
            <p className="text-xs text-text-secondary font-medium">Processing Queue</p>
            <p className="text-2xl font-bold text-brand-600">{processingDocs}</p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-brand-50 border border-brand-100 text-brand-600 flex items-center justify-center">
            <Clock className="w-4 h-4" />
          </div>
        </Card>

        <Card className="flex items-center justify-between p-4 shadow-xs">
          <div className="space-y-1">
            <p className="text-xs text-text-secondary font-medium">Generated Artifacts</p>
            <p className="text-2xl font-bold text-text-primary">{artifacts.length}</p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-surface-secondary border border-border-default text-text-secondary flex items-center justify-center">
            <FileCheck className="w-4 h-4" />
          </div>
        </Card>
      </div>

      {/* 3D Interactive Multimodal Globe Section */}
      <GlobeScene
        title="Global Multimodal Intelligence Lattice"
        subtitle="Real-time 3D vector embeddings, semantic nodes, and cross-source knowledge projection"
      />

      {/* Main Grid: Recent Uploads + Quick Launch */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Recent Ingested Files (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <FileText className="w-4 h-4 text-brand-600" />
              Recent Workspace Ingestions
            </h3>
            <Link
              to="/app/library"
              className="text-xs text-brand-600 hover:text-brand-700 flex items-center gap-1 font-medium transition-colors"
            >
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {documents.length === 0 ? (
            <Card className="p-8 text-center space-y-3">
              <UploadCloud className="w-9 h-9 text-text-muted mx-auto" />
              <h4 className="text-sm font-medium text-text-primary">No documents in this workspace yet</h4>
              <p className="text-xs text-text-secondary max-w-sm mx-auto">
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
                    className="p-3.5 rounded-xl bg-surface-primary hover:bg-surface-secondary/70 border border-border-default hover:border-brand-200 shadow-xs transition-all cursor-pointer flex items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center gap-3 truncate">
                      <div
                        className={`w-8 h-8 rounded-lg border flex items-center justify-center font-mono text-[10px] uppercase font-bold shrink-0 ${getModalityColor(
                          doc.modality
                        )}`}
                      >
                        {doc.modality.slice(0, 3)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-text-primary group-hover:text-brand-600 transition-colors truncate">
                          {doc.original_filename}
                        </p>
                        <p className="text-[11px] text-text-secondary truncate mt-0.5">
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
          <Card className="p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600">
                <Sparkles className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-semibold text-text-primary">Cross-Modal Assistant</h4>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed">
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
              <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                Recent Chats
              </h4>
              <Link to="/app/chat" className="text-xs text-brand-600 hover:text-brand-700 font-medium transition-colors">
                New
              </Link>
            </div>

            {conversations.length === 0 ? (
              <p className="text-xs text-text-muted py-2">No conversations yet.</p>
            ) : (
              <div className="space-y-1.5">
                {conversations.slice(0, 4).map((c) => (
                  <div
                    key={c.id}
                    onClick={() => navigate(`/app/chat?c=${c.id}`)}
                    className="p-3 rounded-lg bg-surface-primary hover:bg-surface-secondary/70 text-xs text-text-primary hover:border-brand-200 cursor-pointer truncate border border-border-default shadow-xs transition-colors"
                  >
                    <p className="font-medium truncate">{c.title}</p>
                    <p className="text-[10px] text-text-muted mt-0.5">{formatDate(c.updated_at)}</p>
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

