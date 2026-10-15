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
    <aside className="w-64 h-full bg-[#0D1428]/95 backdrop-blur-md border-r border-[#4F8CFF]/20 flex flex-col justify-between shrink-0 select-none text-[#F4F7FF]">
      {/* Brand & Workspace Switcher */}
      <div>
        <div className="h-15 px-5 border-b border-[#4F8CFF]/20 flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#4F8CFF] flex items-center justify-center shadow-[0_0_15px_-2px_rgba(79,140,255,0.5)] text-white">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-center">
              <span className="font-semibold text-[#F4F7FF] text-sm tracking-tight">OmniMind</span>
              <span className="text-[#42E8F5] font-semibold text-xs ml-1 bg-[#42E8F5]/15 border border-[#42E8F5]/30 px-1 py-0.2 rounded text-[10px]">AI</span>
            </div>
            <span className="block text-[10px] text-[#9AA8C7] uppercase tracking-wider font-medium">3D Intelligence</span>
          </div>
        </div>

        {/* Workspace Dropdown */}
        <div className="p-3 border-b border-[#4F8CFF]/20">
          <div className="text-[11px] font-medium uppercase tracking-wider text-[#9AA8C7] px-2 mb-1.5 flex items-center justify-between">
            <span>Workspace</span>
            <button
              onClick={() => setIsWorkspaceModalOpen(true)}
              className="text-[#42E8F5] hover:text-[#4F8CFF] flex items-center gap-1 text-[11px] font-medium normal-case transition-colors"
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
              className="w-full bg-[#070B17]/80 border border-[#4F8CFF]/25 hover:border-[#42E8F5]/40 rounded-lg px-2.5 py-1.5 text-xs text-[#F4F7FF] focus:outline-none focus:ring-2 focus:ring-[#42E8F5]/25 focus:border-[#42E8F5] appearance-none pr-8 cursor-pointer truncate font-medium transition-colors"
            >
              {workspaces.map((ws) => (
                <option key={ws.id} value={ws.id} className="bg-[#0D1428] text-[#F4F7FF]">
                  {ws.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-[#9AA8C7] absolute right-2.5 top-2.5 pointer-events-none" />
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
                    ? 'bg-[#4F8CFF]/20 text-[#42E8F5] font-semibold border border-[#42E8F5]/30 shadow-[0_0_12px_-2px_rgba(66,232,245,0.25)]'
                    : 'text-[#9AA8C7] hover:bg-[#4F8CFF]/10 hover:text-[#F4F7FF]'
                )
              }
            >
              <div className="flex items-center gap-2.5">
                <item.icon className="w-4 h-4 text-current transition-colors" />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="text-[10px] bg-[#42E8F5]/15 text-[#42E8F5] px-1.5 py-0.2 rounded font-semibold border border-[#42E8F5]/30">
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* User info & Logout */}
      <div className="p-3 border-t border-[#4F8CFF]/20 bg-[#070B17]/50">
        <div className="flex items-center justify-between px-2 py-1">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-full bg-[#4F8CFF]/20 border border-[#4F8CFF]/40 flex items-center justify-center font-semibold text-xs text-[#42E8F5] shrink-0">
              {user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-[#F4F7FF] truncate">{user?.displayName}</p>
              <p className="text-[10px] text-[#9AA8C7] truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Log out"
            aria-label="Log out"
            className="p-1.5 text-[#9AA8C7] hover:text-[#F04438] hover:bg-[#F04438]/15 rounded-md transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
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
          <div className="flex justify-end gap-2.5 pt-3 border-t border-[#E5EAF1]">
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
