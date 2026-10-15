import React, { useState, useEffect } from 'react';
import { Settings, User, Key, Cpu, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { Card } from '../../components/ui/Card.js';
import { Button } from '../../components/ui/Button.js';
import { Input } from '../../components/ui/Input.js';
import { api } from '../../lib/api.js';

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();

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
      {/* Header */}
      <div className="pb-4 border-b border-border-default">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600 shadow-xs">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold font-display text-text-primary tracking-tight">
              Settings & Account Security
            </h1>
            <p className="text-xs sm:text-sm text-text-secondary mt-0.5">
              Manage your profile identity, security credentials, and view system readiness.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Profile Card */}
        <Card className="p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-text-primary">
            <User className="w-4 h-4 text-brand-600" />
            <span>Profile Identity</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="text-text-secondary text-xs font-medium">Display Name</label>
              <p className="text-text-primary font-semibold mt-1 p-3 bg-surface-secondary rounded-xl border border-border-default">
                {user?.displayName || 'Authorized User'}
              </p>
            </div>
            <div>
              <label className="text-text-secondary text-xs font-medium">Email Address</label>
              <p className="text-text-primary font-semibold mt-1 p-3 bg-surface-secondary rounded-xl border border-border-default">
                {user?.email}
              </p>
            </div>
          </div>
        </Card>

        {/* Change Password Card */}
        <Card className="p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-text-primary">
            <Key className="w-4 h-4 text-brand-600" />
            <span>Update Password</span>
          </div>

          {passwordMsg && (
            <div
              className={`p-3 rounded-xl text-xs font-medium border ${
                passwordMsg.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : 'bg-rose-50 border-rose-200 text-rose-700'
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
            <Button
              type="submit"
              size="sm"
              loading={loading}
              className="bg-brand-600 hover:bg-brand-700 text-white font-medium"
            >
              Update Password
            </Button>
          </form>
        </Card>

        {/* System & Architecture Status */}
        <Card className="p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-text-primary">
            <Cpu className="w-4 h-4 text-brand-600" />
            <span>Infrastructure & Multimodal Engine Status</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-surface-secondary border border-border-default">
              <span className="text-text-muted text-[10px] uppercase font-semibold tracking-wider">Database Engine</span>
              <p className="text-text-primary font-medium mt-1 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                {systemReadiness?.checks?.database === 'connected'
                  ? 'Supabase PostgreSQL (RLS)'
                  : 'Resilient PostgreSQL'}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-surface-secondary border border-border-default">
              <span className="text-text-muted text-[10px] uppercase font-semibold tracking-wider">Gemini AI Model</span>
              <p className="text-text-primary font-medium mt-1 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                gemini-2.5-flash (multimodal)
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-surface-secondary border border-border-default">
              <span className="text-text-muted text-[10px] uppercase font-semibold tracking-wider">Embedding Model</span>
              <p className="text-text-primary font-medium mt-1 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                text-embedding-004 (768d)
              </p>
            </div>
          </div>
        </Card>

        {/* Danger Zone: Account Deletion */}
        <Card className="p-5 sm:p-6 space-y-4 border border-rose-200 bg-rose-50/30">
          <div className="flex items-center gap-2 text-sm font-semibold text-rose-600">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <span>Danger Zone: Account Deletion</span>
          </div>

          <p className="text-xs text-text-secondary leading-relaxed">
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
        variant="danger"
        size="sm"
        onClick={() => setShowConfirm(true)}
      >
        Delete Account & All Data
      </Button>
    );
  }

  return (
    <div className="p-4 rounded-xl bg-surface-primary border border-rose-200 space-y-3 max-w-lg shadow-sm">
      <p className="text-xs font-semibold text-rose-600">
        Please confirm: Type <span className="font-mono bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded border border-rose-300">DELETE</span> below:
      </p>

      {error && (
        <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 text-xs">
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
          variant="danger"
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

