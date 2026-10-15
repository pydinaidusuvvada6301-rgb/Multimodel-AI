import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  MessageSquareCode,
  FolderOpen,
  UploadCloud,
  Search,
  Layers,
  FileText,
  Settings,
  LogOut,
  Plus,
  Sparkles,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { cn } from '../../lib/utils.js';
import { Modal } from '../ui/Modal.js';
import { Input } from '../ui/Input.js';
import { Button } from '../ui/Button.js';
import { api } from '../../lib/api.js';

interface SidebarProps {
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onCloseMobile }) => {
  const { user, workspaces, activeWorkspace, setActiveWorkspace, refreshWorkspaces, logout } = useAuth();
  const navigate = useNavigate();

  const [isWorkspaceModalOpen, setIsWorkspaceModalOpen] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [newWorkspaceDesc, setNewWorkspaceDesc] = useState('');
  const [isCreatingWs, setIsCreatingWs] = useState(false);

  const navItems = [
    { label: 'Dashboard', path: '/app', icon: LayoutDashboard },
    { label: 'OmniMind Chat', path: '/app/chat', icon: MessageSquareCode, badge: 'AI' },
    { label: 'Upload Center', path: '/app/upload', icon: UploadCloud },
    { label: 'Knowledge Library', path: '/app/library', icon: FolderOpen },
    { label: 'Hybrid Search', path: '/app/search', icon: Search },
    { label: 'Workspaces', path: '/app/workspaces', icon: Layers },
    { label: 'Reports & Artifacts', path: '/app/reports', icon: FileText },
    { label: 'Settings', path: '/app/settings', icon: Settings },
  ];

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkspaceName.trim()) return;
    try {
      setIsCreatingWs(true);
      const { data } = await api.post('/workspaces', {
        name: newWorkspaceName.trim(),
        description: newWorkspaceDesc.trim(),
      });
      if (data.success && data.data) {
        await refreshWorkspaces();
        setActiveWorkspace(data.data);
        setIsWorkspaceModalOpen(false);
        setNewWorkspaceName('');
        setNewWorkspaceDesc('');
      }
    } catch (err) {
      console.error('Failed to create workspace:', err);
    } finally {
      setIsCreatingWs(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <aside className="w-64 h-full bg-surface-300 border-r border-slate-800 flex flex-col justify-between shrink-0">
      {/* Brand & Workspace Switcher */}
      <div>
        <div className="h-16 px-5 border-b border-slate-800 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Sparkles className="w-5 h-5 text-slate-950 font-bold" />
          </div>
          <div>
            <span className="font-bold text-slate-100 text-base tracking-tight">OmniMind</span>
            <span className="text-cyan-400 font-extrabold text-sm ml-1">AI</span>
            <span className="block text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Intelligence</span>
          </div>
        </div>

        {/* Workspace Dropdown */}
        <div className="p-3 border-b border-slate-800/60">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 px-2 mb-1.5 flex items-center justify-between">
            <span>Workspace</span>
            <button
              onClick={() => setIsWorkspaceModalOpen(true)}
              className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 text-[11px] normal-case"
              title="Create new workspace"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New</span>
            </button>
          </div>

          <div className="relative">
            <select
              value={activeWorkspace?.id || ''}
              onChange={(e) => {
                const found = workspaces.find((w) => w.id === e.target.value);
                if (found) setActiveWorkspace(found);
              }}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500 appearance-none pr-8 cursor-pointer truncate"
            >
              {workspaces.map((ws) => (
                <option key={ws.id} value={ws.id}>
                  {ws.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/app'}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                cn(
                  'flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all group',
                  isActive
                    ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-semibold'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                )
              }
            >
              <div className="flex items-center gap-2.5">
                <item.icon className="w-4 h-4 text-current transition-transform group-hover:scale-110" />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-1.5 py-0.5 rounded font-mono font-bold">
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* User info & Logout */}
      <div className="p-3 border-t border-slate-800">
        <div className="flex items-center justify-between px-2 py-1.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-cyan-400 shrink-0">
              {user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-200 truncate">{user?.displayName}</p>
              <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Log out"
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Create Workspace Modal */}
      <Modal
        isOpen={isWorkspaceModalOpen}
        onClose={() => setIsWorkspaceModalOpen(false)}
        title="Create Knowledge Workspace"
        description="Organize your multimodal documents, images, audio, and video files in a dedicated workspace."
      >
        <form onSubmit={handleCreateWorkspace} className="space-y-4 pt-2">
          <Input
            label="Workspace Name"
            placeholder="e.g. Multimodal AI Research or Q4 Financials"
            value={newWorkspaceName}
            onChange={(e) => setNewWorkspaceName(e.target.value)}
            required
            autoFocus
          />
          <Input
            label="Description (Optional)"
            placeholder="Briefly describe what sources this workspace collects..."
            value={newWorkspaceDesc}
            onChange={(e) => setNewWorkspaceDesc(e.target.value)}
          />
          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsWorkspaceModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" loading={isCreatingWs}>
              Create Workspace
            </Button>
          </div>
        </form>
      </Modal>
    </aside>
  );
};
