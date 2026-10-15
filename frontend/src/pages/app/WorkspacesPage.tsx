import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layers, Plus, Trash2, ArrowRight, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
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
    <div className="space-y-6 max-w-7xl mx-auto text-slate-900">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Knowledge Workspaces
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Isolate and organize multimodal knowledge collections for projects, research, or teams.
              </p>
            </div>
          </div>
        </div>

        <Button
          size="sm"
          onClick={() => setIsModalOpen(true)}
          icon={<Plus className="w-4 h-4" />}
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
              className={`p-5 rounded-2xl border transition-all cursor-pointer relative shadow-sm ${
                isActive
                  ? 'border-blue-500 bg-white ring-2 ring-blue-500/20 shadow-md'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md'
              }`}
            >
              {isActive && (
                <span className="absolute top-4 right-4 text-[11px] bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                  <Check className="w-3 h-3 text-blue-600" />
                  Active
                </span>
              )}

              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-mono uppercase bg-slate-100 px-2.5 py-0.5 rounded-md text-slate-700 border border-slate-200 font-bold">
                  {ws.category}
                </span>
              </div>

              <h3 className="text-base font-bold text-slate-900 truncate pr-16">{ws.name}</h3>

              <p className="text-xs text-slate-500 line-clamp-2 min-h-[32px] leading-relaxed mt-1">
                {ws.description || 'No description provided.'}
              </p>

              <div className="pt-3 mt-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
                <span className="font-medium">{ws.documentCount || 0} Documents</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => handleDelete(ws.id, e)}
                    className="p-1.5 hover:text-red-600 text-slate-400 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    title="Delete workspace"
                    aria-label="Delete workspace"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <ArrowRight className="w-4 h-4 text-blue-600 group-hover:translate-x-0.5 transition-transform" />
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
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <Button type="button" variant="secondary" size="sm" onClick={() => setIsModalOpen(false)}>
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


