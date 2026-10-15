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
                  ? 'Supabase PostgreSQL'
                  : 'Resilient Local PostgreSQL'}
              </p>
            </div>

            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-slate-400 text-[10px] uppercase font-semibold">Gemini AI Model</span>
              <p className="text-slate-200 font-medium mt-1 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                gemini-2.5-flash
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
      </div>
    </div>
  );
};
