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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-border-default">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold text-text-primary tracking-tight">
                Knowledge Workspaces
              </h1>
              <p className="text-xs sm:text-sm text-text-secondary mt-0.5">
                Isolate and organize multimodal knowledge collections for projects, research, or teams.
              </p>
            </div>
          </div>
        </div>

        <Button size="sm" onClick={() => setIsModalOpen(true)} icon={<Plus className="w-4 h-4" />}>
          New Workspace
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {workspaces.map((ws) => {
          const isActive = activeWorkspace?.id === ws.id;
          return (
            <Card
              key={ws.id}
              hover
              onClick={() => {
                setActiveWorkspace(ws);
                navigate(`/app/workspaces/${ws.id}`);
              }}
              className={`space-y-3.5 relative transition-all ${
                isActive ? 'border-brand-300 ring-2 ring-brand-500/10' : ''
              }`}
            >
              {isActive && (
                <span className="absolute top-4 right-4 text-[11px] bg-brand-50 text-brand-700 border border-brand-200 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  Active
                </span>
              )}

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase bg-surface-secondary px-2 py-0.5 rounded text-text-secondary border border-border-default font-semibold">
                  {ws.category}
                </span>
              </div>

              <h3 className="text-base font-semibold text-text-primary truncate pr-16">{ws.name}</h3>

              <p className="text-xs text-text-secondary line-clamp-2 min-h-[32px] leading-relaxed">
                {ws.description || 'No description provided.'}
              </p>

              <div className="pt-3 border-t border-border-default flex items-center justify-between text-xs text-text-secondary">
                <span>{ws.documentCount || 0} Documents</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => handleDelete(ws.id, e)}
                    className="p-1 hover:text-rose-600 text-text-muted hover:bg-rose-50 rounded transition-colors"
                    title="Delete workspace"
                    aria-label="Delete workspace"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <ArrowRight className="w-4 h-4 text-brand-600" />
                </div>
              </div>
            </Card>
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

