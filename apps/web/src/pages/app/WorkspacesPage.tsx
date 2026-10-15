import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layers, Plus, Trash2, ArrowRight, Check, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { Card } from '../../components/ui/Card.js';
import { Button } from '../../components/ui/Button.js';
import { Modal } from '../../components/ui/Modal.js';
import { Input } from '../../components/ui/Input.js';
import { api } from '../../lib/api.js';
import { formatDate } from '../../lib/utils.js';

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
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Layers className="w-6 h-6 text-cyan-400" />
            Knowledge Workspaces
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Isolate and organize multimodal knowledge collections for projects, research, or teams.
          </p>
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
              className={`space-y-3 relative ${
                isActive ? 'border-cyan-500/50 bg-slate-900/90' : 'border-slate-800'
              }`}
            >
              {isActive && (
                <span className="absolute top-4 right-4 text-[10px] bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  Active
                </span>
              )}

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase bg-slate-800 px-2 py-0.5 rounded text-slate-400 border border-slate-700">
                  {ws.category}
                </span>
              </div>

              <h3 className="text-base font-semibold text-slate-100 truncate pr-16">{ws.name}</h3>

              <p className="text-xs text-slate-400 line-clamp-2 min-h-[32px]">
                {ws.description || 'No description provided.'}
              </p>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <span>{ws.documentCount || 0} Documents</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => handleDelete(ws.id, e)}
                    className="p-1 hover:text-rose-400 text-slate-500 transition-colors"
                    title="Delete workspace"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <ArrowRight className="w-4 h-4 text-cyan-400" />
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
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
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
