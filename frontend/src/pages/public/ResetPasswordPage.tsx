import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, Sparkles, ArrowRight } from 'lucide-react';
import { PublicNavbar } from '../../components/layout/PublicNavbar.js';
import { Button } from '../../components/ui/Button.js';
import { Input } from '../../components/ui/Input.js';
import { Card } from '../../components/ui/Card.js';
import { useAuth } from '../../context/AuthContext.js';
import { supabaseClient } from '../../lib/supabase.js';

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const emailParam = searchParams.get('email') || '';
  const navigate = useNavigate();
  const { resetPassword } = useAuth();

  const [email, setEmail] = useState(emailParam);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if opened from Supabase Auth recovery link
  useEffect(() => {
    if (supabaseClient) {
      supabaseClient.auth.onAuthStateChange(async (event, session) => {
        if (event === 'PASSWORD_RECOVERY') {
          if (session?.user?.email) {
            setEmail(session.user.email);
          }
        }
      });
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      if (supabaseClient) {
        // Direct Supabase session update if present
        const { error: supaErr } = await supabaseClient.auth.updateUser({
          password: newPassword,
        });
        if (supaErr) {
          // Fall back to backend reset endpoint
          await resetPassword(email, newPassword);
        }
      } else {
        await resetPassword(email, newPassword);
      }
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || err.message || 'Failed to reset password. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PublicNavbar />

      <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md space-y-5">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center mx-auto shadow-xl shadow-cyan-500/20">
              <Lock className="w-6 h-6 text-slate-950 font-bold" />
            </div>
            <h2 className="text-2xl font-bold text-slate-100">Set New Password</h2>
            <p className="text-xs text-slate-400">
              Create a strong password to protect your multimodal knowledge workspace
            </p>
          </div>

          <Card className="p-6 sm:p-8 space-y-5 bg-surface-200/90 border-slate-700/80 shadow-2xl">
            {success ? (
              <div className="text-center space-y-4 py-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                <h3 className="text-sm font-semibold text-slate-100">Password Updated Successfully</h3>
                <p className="text-xs text-slate-300">
                  Your new credentials are now active. You can safely sign in with your updated password.
                </p>
                <Button
                  size="md"
                  className="w-full mt-2"
                  onClick={() => navigate('/login')}
                >
                  Proceed to Sign In
                </Button>
              </div>
            ) : (
              <>
                {error && (
                  <div className="p-3 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  {!emailParam && (
                    <Input
                      label="Account Email"
                      type="email"
                      placeholder="you@domain.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  )}

                  <div>
                    <label className="text-xs font-medium text-slate-300 mb-1.5 block">
                      New Password
                    </label>
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Minimum 8 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      icon={<Lock className="w-4 h-4" />}
                      rightElement={
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="text-slate-400 hover:text-slate-200"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      }
                      required
                    />
                  </div>

                  <Input
                    label="Confirm New Password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Repeat new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    icon={<Lock className="w-4 h-4" />}
                    required
                  />

                  <Button type="submit" size="md" className="w-full" loading={loading}>
                    Update Password
                  </Button>
                </form>
              </>
            )}
          </Card>

          <p className="text-center text-xs text-slate-400">
            Remembered your password?{' '}
            <Link to="/login" className="text-cyan-400 hover:text-cyan-300 font-medium">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
