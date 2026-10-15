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
    <div className="min-h-screen bg-[#F7F9FC] flex flex-col text-[#202938]">
      <PublicNavbar />

      <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md space-y-5">
          <div className="text-center space-y-2">
            <div className="w-9 h-9 rounded-md bg-[#356AE6] flex items-center justify-center mx-auto text-white shadow-xs">
              <Lock className="w-4 h-4" />
            </div>
            <h2 className="text-2xl font-bold text-[#202938]">Set New Password</h2>
            <p className="text-xs text-[#667085]">
              Create a strong password to protect your multimodal knowledge workspace
            </p>
          </div>

          <Card className="p-6 sm:p-8 space-y-5 bg-white border border-[#E5EAF1] rounded-xl shadow-xs">
            {success ? (
              <div className="text-center space-y-4 py-3">
                <CheckCircle2 className="w-10 h-10 text-[#12B76A] mx-auto" />
                <h3 className="text-sm font-semibold text-[#202938]">Password Updated Successfully</h3>
                <p className="text-xs text-[#667085]">
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
                  <div className="p-3 rounded-lg bg-[#FEF3F2] border border-[#FECDCA] text-[#B42318] text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
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
                    <label className="text-xs font-medium text-[#202938] mb-1.5 block">
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
                          className="text-[#667085] hover:text-[#202938]"
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

          <p className="text-center text-xs text-[#667085]">
            Remembered your password?{' '}
            <Link to="/login" className="text-[#356AE6] hover:text-[#2856C5] font-medium">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
