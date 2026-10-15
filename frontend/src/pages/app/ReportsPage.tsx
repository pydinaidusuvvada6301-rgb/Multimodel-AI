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
    <div className="h-[calc(100vh-6.5rem)] flex flex-col gap-4 max-w-7xl mx-auto text-slate-900">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 shrink-0">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Generated Intelligence Reports
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
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
        <div className="w-72 bg-white rounded-2xl border border-slate-200 p-3 shrink-0 flex flex-col shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-2 mb-2">
            Saved Reports ({artifacts.length})
          </p>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {artifacts.length === 0 ? (
              <p className="text-xs text-slate-400 py-8 text-center">No reports generated yet.</p>
            ) : (
              artifacts.map((art) => (
                <div
                  key={art.id}
                  onClick={() => setSelectedArtifact(art)}
                  className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                    selectedArtifact?.id === art.id
                      ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-[10px] font-mono uppercase text-blue-600 font-bold truncate">
                      {art.artifact_type.replace('_', ' ')}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(art.id);
                      }}
                      className="text-slate-400 hover:text-red-600 p-0.5 rounded transition-colors cursor-pointer"
                      title="Delete report"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <h4 className="font-bold text-slate-900 truncate">{art.title}</h4>
                  <p className="text-[11px] text-slate-500 mt-1">{formatDate(art.created_at)}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Markdown Viewer & Export */}
        <div className="flex-1 bg-white rounded-2xl border border-slate-200 flex flex-col min-w-0 overflow-hidden shadow-sm">
          {selectedArtifact ? (
            <>
              {/* Header */}
              <div className="p-4 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between gap-3 shrink-0">
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-slate-900 truncate">
                    {selectedArtifact.title}
                  </h3>
                  <span className="text-[11px] font-mono text-blue-600 uppercase font-semibold">
                    {selectedArtifact.artifact_type.replace('_', ' ')}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={handleCopy}
                  >
                    {copied ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span className="hidden sm:inline">Copy</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleExport('markdown')}
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export MD</span>
                  </Button>
                </div>
              </div>

              {/* Markdown Content */}
              <div className="flex-1 overflow-y-auto p-6 sm:p-8 max-w-none text-slate-800 text-sm leading-relaxed prose prose-slate prose-headings:font-bold prose-headings:text-slate-900 prose-p:text-slate-700 prose-strong:text-slate-900 prose-li:text-slate-700 prose-pre:bg-slate-50 prose-pre:border prose-pre:border-slate-200 prose-code:text-blue-700 prose-table:border prose-table:border-slate-200">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {selectedArtifact.content_markdown}
                </ReactMarkdown>
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-400 text-xs">
              <FileText className="w-14 h-14 mb-3 text-slate-200" />
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
            <label className="block text-xs font-bold text-slate-800 mb-1.5 uppercase tracking-wider">
              Artifact Format
            </label>
            <select
              value={artifactType}
              onChange={(e) => setArtifactType(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-medium cursor-pointer"
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
            <label className="block text-xs font-bold text-slate-800 mb-1.5 uppercase tracking-wider">
              Special Instructions / Focus Areas (Optional)
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Emphasize security considerations, database schemas, and performance trade-offs..."
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <Button
              type="button"
              variant="secondary"
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


