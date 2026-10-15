import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layers, Plus, Trash2, ArrowRight, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { Card } from '../../components/ui/Card.js';
import { Button } from '../../components/ui/Button.js';
import { Modal } from '../../components/ui/Modal.js';
import { Input } from '../../components/ui/Input.js';
import { api } from '../../lib/api.js';

export const WorkspacesPage: React.FC = () => {
  const { workspaces, activeWorkspace, setActiveWorkspace, refreshWorkspaces } = useAuth();
  const navigate = useNavigate();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('general');
  const [loading, setLoading] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      const { data } = await api.post('/workspaces', {
        name: name.trim(),
        description: description.trim(),
        category,
      });
      if (data.success && data.data) {
        await refreshWorkspaces();
        setActiveWorkspace(data.data);
        setIsModalOpen(false);
        setName('');
        setDescription('');
      }
    } catch (err) {
      console.error('Failed to create workspace:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this workspace and all its indexed files?')) return;
    try {
      await api.delete(`/workspaces/${id}`);
      await refreshWorkspaces();
    } catch (err) {
      console.error('Failed to delete workspace:', err);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[rgba(79,140,255,0.15)]">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#4F8CFF] to-[#42E8F5] flex items-center justify-center text-white shadow-lg shadow-[#4F8CFF]/20">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold font-display text-[#F4F7FF] tracking-tight">
                Knowledge Workspaces
              </h1>
              <p className="text-xs sm:text-sm text-[#9AA8C7] mt-0.5">
                Isolate and organize multimodal knowledge collections for projects, research, or teams.
              </p>
            </div>
          </div>
        </div>

        <Button
          size="sm"
          onClick={() => setIsModalOpen(true)}
          icon={<Plus className="w-4 h-4" />}
          className="bg-gradient-to-r from-[#4F8CFF] to-[#42E8F5] text-[#070B17] font-semibold"
        >
          New Workspace
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {workspaces.map((ws) => {
          const isActive = activeWorkspace?.id === ws.id;
          return (
            <div
              key={ws.id}
              onClick={() => {
                setActiveWorkspace(ws);
                navigate(`/app/workspaces/${ws.id}`);
              }}
              className={`glass-card p-5 rounded-2xl border transition-all cursor-pointer relative shadow-lg ${
                isActive
                  ? 'border-[#42E8F5] bg-[#0D1428] ring-2 ring-[#42E8F5]/20 shadow-xl shadow-[#4F8CFF]/10'
                  : 'border-[rgba(79,140,255,0.18)] bg-[#0D1428]/80 hover:bg-[#0D1428] hover:border-[#42E8F5]/40'
              }`}
            >
              {isActive && (
                <span className="absolute top-4 right-4 text-[11px] bg-[#4F8CFF]/20 text-[#42E8F5] border border-[#4F8CFF]/30 px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  Active
                </span>
              )}

              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-mono uppercase bg-[#070B17] px-2.5 py-0.5 rounded-md text-[#42E8F5] border border-[rgba(79,140,255,0.2)] font-semibold">
                  {ws.category}
                </span>
              </div>

              <h3 className="text-base font-semibold font-display text-[#F4F7FF] truncate pr-16">{ws.name}</h3>

              <p className="text-xs text-[#9AA8C7] line-clamp-2 min-h-[32px] leading-relaxed mt-1">
                {ws.description || 'No description provided.'}
              </p>

              <div className="pt-3 mt-3 border-t border-[rgba(79,140,255,0.15)] flex items-center justify-between text-xs text-[#9AA8C7]">
                <span>{ws.documentCount || 0} Documents</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => handleDelete(ws.id, e)}
                    className="p-1.5 hover:text-red-400 text-[#9AA8C7] hover:bg-red-500/15 rounded-lg transition-colors"
                    title="Delete workspace"
                    aria-label="Delete workspace"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <ArrowRight className="w-4 h-4 text-[#4F8CFF] group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Workspace"
        description="Workspaces enforce strict data isolation and scoped AI retrieval."
      >
        <form onSubmit={handleCreate} className="space-y-4 pt-2">
          <Input
            label="Workspace Name"
            placeholder="e.g. LLM Systems Research"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
          />
          <Input
            label="Category"
            placeholder="e.g. Research, Business, Engineering"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
          <Input
            label="Description"
            placeholder="Brief explanation of this workspace collection"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <div className="flex justify-end gap-2 pt-3 border-t border-border-default">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" loading={loading}>
              Create Workspace
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

