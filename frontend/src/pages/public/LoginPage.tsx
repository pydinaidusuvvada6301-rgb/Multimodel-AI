import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, Eye, EyeOff, Lock, Mail, ArrowRight, Zap } from 'lucide-react';
import { PublicNavbar } from '../../components/layout/PublicNavbar.js';
import { Button } from '../../components/ui/Button.js';
import { Input } from '../../components/ui/Input.js';
import { Card } from '../../components/ui/Card.js';
import { useAuth } from '../../context/AuthContext.js';

export const LoginPage: React.FC = () => {
  const { login, loginWithGoogle, demoLogin } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUnverified, setIsUnverified] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsUnverified(false);
    setLoading(true);

    try {
      await login(email, password);
      navigate('/app');
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || err.message || 'Login failed. Please check your credentials.';
      setError(msg);
      if (
        msg.toLowerCase().includes('confirm') ||
        msg.toLowerCase().includes('verif') ||
        err.response?.data?.error?.code === 'EMAIL_NOT_VERIFIED'
      ) {
        setIsUnverified(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      await demoLogin();
      navigate('/app');
    } catch (err: any) {
      setError('Demo login failed. Please try registering an account.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setGoogleLoading(true);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      const msg = err.message || '';
      if (
        msg.toLowerCase().includes('provider is not enabled') ||
        msg.toLowerCase().includes('unsupported provider') ||
        msg.toLowerCase().includes('not configured')
      ) {
        setError(
          'Google Sign-In requires entering your Google Cloud Client ID & Secret in Supabase Dashboard (Authentication > Providers > Google). Use Email/Password or Instant Demo above to log in.'
        );
      } else {
        setError(msg || 'Google Sign-In could not be initialized.');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F9FC] flex flex-col text-[#202938]">
      <PublicNavbar />

      <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md space-y-5">
          <div className="text-center space-y-2">
            <div className="w-9 h-9 rounded-md bg-[#356AE6] flex items-center justify-center mx-auto text-white shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <h2 className="text-2xl font-bold text-[#202938]">Welcome Back</h2>
            <p className="text-xs text-[#667085]">Sign in to your OmniMind intelligence workspace</p>
          </div>

          <Card className="p-6 sm:p-8 space-y-5 bg-white border border-[#E5EAF1] rounded-xl shadow-xs">
            {/* Quick Demo Login Banner for Reviewers & Judges */}
            <div className="p-3 rounded-lg bg-[#EEF4FF] border border-[#D0D7E2] flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-[#2856C5] flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5" />
                  Judge / Reviewer Access
                </p>
                <p className="text-[11px] text-[#667085] mt-0.5">Explore with pre-seeded multimodal data</p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="primary"
                onClick={handleDemoLogin}
                loading={loading}
              >
                Instant Demo
              </Button>
            </div>

            {/* Google OAuth Button */}
            <Button
              type="button"
              variant="outline"
              size="md"
              className="w-full flex items-center justify-center gap-2.5 border-[#E5EAF1] hover:bg-[#F7F9FC] text-[#202938] transition-colors"
              onClick={handleGoogleSignIn}
              disabled={loading || googleLoading}
              loading={googleLoading}
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </Button>

            {/* Divider */}
            <div className="relative flex items-center justify-center">
              <div className="border-t border-[#E5EAF1] w-full" />
              <span className="bg-white px-3 text-[11px] text-[#98A2B3] uppercase tracking-wider absolute">
                or sign in with email
              </span>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-[#FEF3F2] border border-[#FECDCA] text-[#B42318] text-xs space-y-2">
                <p>{error}</p>
                {isUnverified && (
                  <div className="pt-1">
                    <Link
                      to={`/verify-email?email=${encodeURIComponent(email)}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#FEE4E2] text-[#B42318] text-xs font-semibold hover:bg-[#FECDCA] transition-colors"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      Verify or Resend Confirmation Link
                    </Link>
                  </div>
                )}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email Address"
                type="email"
                placeholder="you@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                icon={<Mail className="w-4 h-4" />}
                required
                autoComplete="email"
              />

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-[#202938]">Password</label>
                  <Link
                    to="/forgot-password"
                    className="text-[11px] text-[#356AE6] hover:text-[#2856C5]"
                  >
                    Forgot password?
                  </Link>
                </div>
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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

              <Button type="submit" size="md" className="w-full" loading={loading}>
                Sign In
              </Button>
            </form>
          </Card>

          <p className="text-center text-xs text-[#667085]">
            Don't have an account yet?{' '}
            <Link to="/register" className="text-[#356AE6] hover:text-[#2856C5] font-medium">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
