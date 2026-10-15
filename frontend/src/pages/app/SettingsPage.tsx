import React, { useState, useEffect } from 'react';
import { Settings, Shield, User, Key, Cpu, Database, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { Card } from '../../components/ui/Card.js';
import { Button } from '../../components/ui/Button.js';
import { Input } from '../../components/ui/Input.js';
import { api } from '../../lib/api.js';

export const SettingsPage: React.FC = () => {
  const { user, logout } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );
  const [loading, setLoading] = useState(false);

  const [systemReadiness, setSystemReadiness] = useState<any>(null);

  useEffect(() => {
    const checkReadiness = async () => {
      try {
        const { data } = await api.get('/ready');
        setSystemReadiness(data);
      } catch (err) {
        console.warn('Readiness check error:', err);
      }
    };
    checkReadiness();
  }, []);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);

    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    if (newPassword.length < 8) {
      setPasswordMsg({ type: 'error', text: 'New password must be at least 8 characters long.' });
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post('/auth/change-password', {
        currentPassword,
        newPassword,
      });

      if (data.success) {
        setPasswordMsg({ type: 'success', text: 'Password successfully updated.' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err: any) {
      setPasswordMsg({
        type: 'error',
        text: err.response?.data?.error?.message || 'Failed to update password.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="pb-3 border-b border-slate-800">
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
          <Settings className="w-6 h-6 text-cyan-400" />
          Settings & Account Security
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Manage your profile identity, security credentials, and view system readiness.
        </p>
      </div>

      <div className="space-y-6">
        {/* Profile Card */}
        <Card className="p-6 space-y-4 bg-surface-200/90 border-slate-800">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
            <User className="w-4 h-4 text-cyan-400" />
            <span>Profile Identity</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="text-slate-400 text-[11px] font-medium">Display Name</label>
              <p className="text-slate-100 font-semibold mt-1 p-2 bg-slate-900 rounded-lg border border-slate-800">
                {user?.displayName}
              </p>
            </div>
            <div>
              <label className="text-slate-400 text-[11px] font-medium">Email Address</label>
              <p className="text-slate-100 font-semibold mt-1 p-2 bg-slate-900 rounded-lg border border-slate-800">
                {user?.email}
              </p>
            </div>
          </div>
        </Card>

        {/* Change Password Card */}
        <Card className="p-6 space-y-4 bg-surface-200/90 border-slate-800">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
            <Key className="w-4 h-4 text-cyan-400" />
            <span>Update Password</span>
          </div>

          {passwordMsg && (
            <div
              className={`p-3 rounded-lg text-xs ${
                passwordMsg.type === 'success'
                  ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/15 border border-rose-500/30 text-rose-300'
              }`}
            >
              {passwordMsg.text}
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-3.5 max-w-md">
            <Input
              label="Current Password"
              type="password"
              placeholder="••••••••"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
            <Input
              label="New Password"
              type="password"
              placeholder="Minimum 8 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
            <Input
              label="Confirm New Password"
              type="password"
              placeholder="Repeat new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            <Button type="submit" size="sm" loading={loading}>
              Update Password
            </Button>
          </form>
        </Card>

        {/* System & Architecture Status */}
        <Card className="p-6 space-y-4 bg-surface-200/90 border-slate-800">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <span>Infrastructure & Multimodal Engine Status</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-slate-400 text-[10px] uppercase font-semibold">Database Engine</span>
              <p className="text-slate-200 font-medium mt-1 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                {systemReadiness?.checks?.database === 'connected'
                  ? 'Supabase PostgreSQL (RLS)'
                  : 'Resilient PostgreSQL'}
              </p>
            </div>

            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-slate-400 text-[10px] uppercase font-semibold">Gemini AI Model</span>
              <p className="text-slate-200 font-medium mt-1 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                gemini-3.8-flash
              </p>
            </div>

            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-slate-400 text-[10px] uppercase font-semibold">Embedding Model</span>
              <p className="text-slate-200 font-medium mt-1 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                text-embedding-004 (768d)
              </p>
            </div>
          </div>
        </Card>

        {/* Danger Zone: Account Deletion */}
        <Card className="p-6 space-y-4 bg-surface-200/90 border-rose-900/40">
          <div className="flex items-center gap-2 text-sm font-semibold text-rose-400">
            <AlertCircle className="w-4 h-4 text-rose-400" />
            <span>Danger Zone: Account Deletion</span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Permanently delete your OmniMind AI account, workspaces, uploaded multimodal sources, and conversation history.
            This action cannot be undone. To prevent accidental deletion, you must explicitly confirm.
          </p>

          <DeleteAccountSection />
        </Card>
      </div>
    </div>
  );
};

const DeleteAccountSection: React.FC = () => {
  const { deleteAccount } = useAuth();
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (confirmText !== 'DELETE') {
      setError('You must type DELETE exactly to proceed.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await deleteAccount(confirmText);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to delete account. Please try again.');
      setLoading(false);
    }
  };

  if (!showConfirm) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="border-rose-800/60 text-rose-400 hover:bg-rose-950/40 hover:text-rose-300"
        onClick={() => setShowConfirm(true)}
      >
        Delete Account & All Data
      </Button>
    );
  }

  return (
    <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-900/50 space-y-3 max-w-lg">
      <p className="text-xs font-semibold text-rose-300">
        Please confirm: Type <span className="font-mono bg-rose-950 px-1.5 py-0.5 rounded text-rose-200">DELETE</span> below:
      </p>

      {error && (
        <div className="p-2 rounded bg-rose-900/40 border border-rose-800 text-rose-200 text-xs">
          {error}
        </div>
      )}

      <Input
        value={confirmText}
        onChange={(e) => setConfirmText(e.target.value)}
        placeholder="Type DELETE to confirm"
        className="font-mono"
      />

      <div className="flex items-center gap-3 pt-1">
        <Button
          type="button"
          size="sm"
          className="bg-rose-600 hover:bg-rose-500 text-white"
          disabled={confirmText !== 'DELETE' || loading}
          loading={loading}
          onClick={handleDelete}
        >
          Permanently Delete Account
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            setShowConfirm(false);
            setConfirmText('');
            setError(null);
          }}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
};
