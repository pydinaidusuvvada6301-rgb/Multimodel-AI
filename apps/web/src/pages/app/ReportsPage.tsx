import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  FileText,
  Plus,
  Download,
  Trash2,
  Sparkles,
  Layers,
  Copy,
  Check,
  Calendar,
} from 'lucide-react';
import { api } from '../../lib/api.js';
import { GeneratedArtifact, DocumentItem } from '../../types/index.js';
import { useAuth } from '../../context/AuthContext.js';
import { Card } from '../../components/ui/Card.js';
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
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <FileText className="w-6 h-6 text-cyan-400" />
            Generated Intelligence Reports
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Synthesized study guides, executive summaries, meeting minutes, flashcards, and action items.
          </p>
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
        <div className="w-72 bg-surface-200/90 rounded-2xl border border-slate-800 p-3 shrink-0 flex flex-col">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 px-2 mb-2">
            Saved Reports ({artifacts.length})
          </p>

          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
            {artifacts.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">No reports generated yet.</p>
            ) : (
              artifacts.map((art) => (
                <div
                  key={art.id}
                  onClick={() => setSelectedArtifact(art)}
                  className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                    selectedArtifact?.id === art.id
                      ? 'bg-cyan-500/10 border-cyan-500/40 text-slate-100'
                      : 'bg-slate-900/60 border-slate-800/80 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-[10px] font-mono uppercase text-cyan-400 font-semibold truncate">
                      {art.artifact_type.replace('_', ' ')}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(art.id);
                      }}
                      className="text-slate-600 hover:text-rose-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <h4 className="font-semibold text-slate-200 truncate">{art.title}</h4>
                  <p className="text-[10px] text-slate-500 mt-1">{formatDate(art.created_at)}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Markdown Viewer & Export */}
        <div className="flex-1 bg-surface-200/80 rounded-2xl border border-slate-800 flex flex-col min-w-0 overflow-hidden shadow-2xl">
          {selectedArtifact ? (
            <>
              {/* Header */}
              <div className="p-4 border-b border-slate-800 bg-surface-300/60 flex items-center justify-between gap-3 shrink-0">
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-slate-100 truncate">
                    {selectedArtifact.title}
                  </h3>
                  <span className="text-[11px] font-mono text-cyan-400 uppercase">
                    {selectedArtifact.artifact_type.replace('_', ' ')}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={handleCopy}>
                    {copied ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
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
              <div className="flex-1 overflow-y-auto p-6 sm:p-8 prose prose-invert max-w-none text-slate-200 text-sm leading-relaxed prose-headings:font-bold prose-h1:text-xl prose-h2:text-lg prose-h3:text-base prose-table:border prose-table:border-slate-800">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {selectedArtifact.content_markdown}
                </ReactMarkdown>
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-500 text-xs">
              <FileText className="w-12 h-12 mb-3 text-slate-600" />
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
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Artifact Format
            </label>
            <select
              value={artifactType}
              onChange={(e) => setArtifactType(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
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
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Special Instructions / Focus Areas (Optional)
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Emphasize security considerations, database schemas, and performance trade-offs..."
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
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
