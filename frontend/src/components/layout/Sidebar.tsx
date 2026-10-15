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
    <aside className="w-64 h-full bg-white border-r border-[#E5EAF1] flex flex-col justify-between shrink-0 select-none">
      {/* Brand & Workspace Switcher */}
      <div>
        <div className="h-15 px-5 border-b border-[#E5EAF1] flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-[#356AE6] flex items-center justify-center shadow-xs text-white">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-center">
              <span className="font-semibold text-[#202938] text-sm tracking-tight">OmniMind</span>
              <span className="text-[#356AE6] font-semibold text-xs ml-1 bg-[#EEF4FF] px-1 py-0.2 rounded text-[10px]">AI</span>
            </div>
            <span className="block text-[10px] text-[#98A2B3] uppercase tracking-wider font-medium">Minimal Intelligence</span>
          </div>
        </div>

        {/* Workspace Dropdown */}
        <div className="p-3 border-b border-[#E5EAF1]">
          <div className="text-[11px] font-medium uppercase tracking-wider text-[#667085] px-2 mb-1.5 flex items-center justify-between">
            <span>Workspace</span>
            <button
              onClick={() => setIsWorkspaceModalOpen(true)}
              className="text-[#356AE6] hover:text-[#2856C5] flex items-center gap-1 text-[11px] font-medium normal-case transition-colors"
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
              className="w-full bg-[#F7F9FC] border border-[#E5EAF1] hover:border-[#D0D7E2] rounded-md px-2.5 py-1.5 text-xs text-[#202938] focus:outline-none focus:ring-2 focus:ring-[#356AE6]/20 focus:border-[#356AE6] appearance-none pr-8 cursor-pointer truncate font-medium transition-colors"
            >
              {workspaces.map((ws) => (
                <option key={ws.id} value={ws.id}>
                  {ws.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-[#667085] absolute right-2.5 top-2.5 pointer-events-none" />
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
                  'flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-colors group',
                  isActive
                    ? 'bg-[#EEF4FF] text-[#2856C5] font-semibold border border-[#D0D7E2]'
                    : 'text-[#667085] hover:bg-[#F7F9FC] hover:text-[#202938]'
                )
              }
            >
              <div className="flex items-center gap-2.5">
                <item.icon className="w-4 h-4 text-current transition-colors" />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="text-[10px] bg-[#EEF4FF] text-[#356AE6] px-1.5 py-0.2 rounded font-semibold border border-[#D0D7E2]">
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* User info & Logout */}
      <div className="p-3 border-t border-[#E5EAF1] bg-[#F7F9FC]/50">
        <div className="flex items-center justify-between px-2 py-1">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-full bg-[#EEF4FF] border border-[#D0D7E2] flex items-center justify-center font-semibold text-xs text-[#356AE6] shrink-0">
              {user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-[#202938] truncate">{user?.displayName}</p>
              <p className="text-[10px] text-[#667085] truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Log out"
            aria-label="Log out"
            className="p-1.5 text-[#667085] hover:text-[#D92D20] hover:bg-[#FEF3F2] rounded-md transition-colors"
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
