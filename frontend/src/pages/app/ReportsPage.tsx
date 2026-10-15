import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  FileText,
  Plus,
  Download,
  Trash2,
  Copy,
  Check,
} from 'lucide-react';
import { api } from '../../lib/api.js';
import { GeneratedArtifact } from '../../types/index.js';
import { useAuth } from '../../context/AuthContext.js';
import { Button } from '../../components/ui/Button.js';
import { Modal } from '../../components/ui/Modal.js';
import { Input } from '../../components/ui/Input.js';
import { formatDate } from '../../lib/utils.js';

export const ReportsPage: React.FC = () => {
  const { activeWorkspace } = useAuth();

  const [artifacts, setArtifacts] = useState<GeneratedArtifact[]>([]);
  const [selectedArtifact, setSelectedArtifact] = useState<GeneratedArtifact | null>(null);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  // Generation form state
  const [title, setTitle] = useState('');
  const [artifactType, setArtifactType] = useState('study_guide');
  const [customPrompt, setCustomPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const fetchArtifacts = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/artifacts', {
        params: activeWorkspace ? { workspaceId: activeWorkspace.id } : {},
      });
      if (data.success) {
        setArtifacts(data.data);
        if (data.data.length > 0 && !selectedArtifact) {
          setSelectedArtifact(data.data[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load artifacts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArtifacts();
  }, [activeWorkspace]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    try {
      const { data } = await api.post('/ai/generate', {
        artifactType,
        title: title.trim() || undefined,
        workspaceId: activeWorkspace?.id || undefined,
        prompt: customPrompt.trim() || undefined,
      });

      if (data.success && data.data) {
        setIsGenerateModalOpen(false);
        setTitle('');
        setCustomPrompt('');
        await fetchArtifacts();
        setSelectedArtifact(data.data);
      }
    } catch (err) {
      console.error('Generation failed:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExport = (format: 'markdown' | 'txt') => {
    if (!selectedArtifact) return;
    window.open(`/api/v1/artifacts/${selectedArtifact.id}/export?format=${format}`, '_blank');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this artifact?')) return;
    try {
      await api.delete(`/artifacts/${id}`);
      setArtifacts((prev) => prev.filter((a) => a.id !== id));
      if (selectedArtifact?.id === id) {
        setSelectedArtifact(null);
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const handleCopy = () => {
    if (!selectedArtifact) return;
    navigator.clipboard.writeText(selectedArtifact.content_markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-[calc(100vh-6.5rem)] flex flex-col gap-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-border-default shrink-0">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold text-text-primary tracking-tight">
                Generated Intelligence Reports
              </h1>
              <p className="text-xs sm:text-sm text-text-secondary mt-0.5">
                Synthesized study guides, executive summaries, meeting minutes, flashcards, and action items.
              </p>
            </div>
          </div>
        </div>

        <Button
          size="sm"
          onClick={() => setIsGenerateModalOpen(true)}
          icon={<Plus className="w-4 h-4" />}
        >
          Generate Report
        </Button>
      </div>

      <div className="flex-1 flex gap-4 min-h-0">
        {/* Left: Artifacts List */}
        <div className="w-72 bg-surface-primary rounded-xl border border-border-default p-3 shrink-0 flex flex-col shadow-xs">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted px-2 mb-2">
            Saved Reports ({artifacts.length})
          </p>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {artifacts.length === 0 ? (
              <p className="text-xs text-text-muted py-8 text-center">No reports generated yet.</p>
            ) : (
              artifacts.map((art) => (
                <div
                  key={art.id}
                  onClick={() => setSelectedArtifact(art)}
                  className={`p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                    selectedArtifact?.id === art.id
                      ? 'bg-brand-50/70 border-brand-200 text-text-primary shadow-xs'
                      : 'bg-surface-secondary/40 border-border-default text-text-secondary hover:bg-surface-secondary'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-[10px] font-mono uppercase text-brand-600 font-semibold truncate">
                      {art.artifact_type.replace('_', ' ')}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(art.id);
                      }}
                      className="text-text-muted hover:text-rose-600 p-0.5 rounded transition-colors"
                      title="Delete report"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <h4 className="font-semibold text-text-primary truncate">{art.title}</h4>
                  <p className="text-[11px] text-text-muted mt-1">{formatDate(art.created_at)}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Markdown Viewer & Export */}
        <div className="flex-1 bg-surface-primary rounded-xl border border-border-default flex flex-col min-w-0 overflow-hidden shadow-xs">
          {selectedArtifact ? (
            <>
              {/* Header */}
              <div className="p-4 border-b border-border-default bg-surface-secondary/30 flex items-center justify-between gap-3 shrink-0">
                <div className="min-w-0">
                  <h3 className="text-base font-semibold text-text-primary truncate">
                    {selectedArtifact.title}
                  </h3>
                  <span className="text-[11px] font-mono text-brand-600 uppercase font-medium">
                    {selectedArtifact.artifact_type.replace('_', ' ')}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={handleCopy}>
                    {copied ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span className="hidden sm:inline">Copy</span>
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleExport('markdown')}>
                    <Download className="w-3.5 h-3.5" />
                    <span>Export MD</span>
                  </Button>
                </div>
              </div>

              {/* Markdown Content */}
              <div className="flex-1 overflow-y-auto p-6 sm:p-8 prose prose-neutral max-w-none text-text-primary text-sm leading-relaxed prose-headings:font-semibold prose-headings:text-text-primary prose-h1:text-xl prose-h2:text-lg prose-h3:text-base prose-pre:bg-surface-secondary prose-pre:border prose-pre:border-border-default prose-table:border prose-table:border-border-default">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {selectedArtifact.content_markdown}
                </ReactMarkdown>
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center text-text-muted text-xs">
              <FileText className="w-12 h-12 mb-3 text-border-default" />
              <p>Select a report to view or generate a new one from your workspace files.</p>
            </div>
          )}
        </div>
      </div>

      {/* Generation Modal */}
      <Modal
        isOpen={isGenerateModalOpen}
        onClose={() => setIsGenerateModalOpen(false)}
        title="Generate AI Knowledge Artifact"
        description="OmniMind AI synthesizes authorized evidence from your workspace into structured deliverables."
        maxWidth="lg"
      >
        <form onSubmit={handleGenerate} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-text-primary mb-1.5 uppercase tracking-wider">
              Artifact Format
            </label>
            <select
              value={artifactType}
              onChange={(e) => setArtifactType(e.target.value)}
              className="w-full bg-surface-secondary border border-border-default rounded-lg px-3 py-2 text-xs sm:text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-medium"
            >
              <option value="study_guide">Study Guide (Definitions, Notes, Review Questions)</option>
              <option value="executive_summary">Executive Summary (High-Level Decision Brief)</option>
              <option value="meeting_minutes">Meeting Minutes (Decisions, Action Items, Topics)</option>
              <option value="research_brief">Research Brief (Methodology, Evidence, Limitations)</option>
              <option value="flashcards">Flashcards (Concepts & Terminology)</option>
              <option value="faq">Frequently Asked Questions (FAQ)</option>
              <option value="action_items">Action Item Checklist</option>
              <option value="comparison">Cross-Modal Comparison Report</option>
              <option value="custom_report">Custom Report</option>
            </select>
          </div>

          <Input
            label="Report Title"
            placeholder="e.g. Distributed Systems Final Review Guide"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <div>
            <label className="block text-xs font-semibold text-text-primary mb-1.5 uppercase tracking-wider">
              Special Instructions / Focus Areas (Optional)
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Emphasize security considerations, database schemas, and performance trade-offs..."
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              className="w-full bg-surface-secondary border border-border-default rounded-lg px-3 py-2 text-xs sm:text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-border-default">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsGenerateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" loading={isGenerating}>
              Generate Artifact
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

