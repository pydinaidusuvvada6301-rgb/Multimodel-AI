import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, Eye, EyeOff, Lock, Mail, ArrowRight, Zap } from 'lucide-react';
import { PublicNavbar } from '../../components/layout/PublicNavbar.js';
import { Button } from '../../components/ui/Button.js';
import { Input } from '../../components/ui/Input.js';
import { Card } from '../../components/ui/Card.js';
import { useAuth } from '../../context/AuthContext.js';

export const LoginPage: React.FC = () => {
  const { login, demoLogin } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
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
      const msg = err.response?.data?.error?.message || 'Login failed. Please check your credentials.';
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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PublicNavbar />

      <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md space-y-5">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center mx-auto shadow-xl shadow-cyan-500/20">
              <Sparkles className="w-6 h-6 text-slate-950 font-bold" />
            </div>
            <h2 className="text-2xl font-bold text-slate-100">Welcome Back</h2>
            <p className="text-xs text-slate-400">Sign in to your OmniMind intelligence workspace</p>
          </div>

          <Card className="p-6 sm:p-8 space-y-5 bg-surface-200/90 border-slate-700/80 shadow-2xl">
            {/* Quick Demo Login Banner for Reviewers & Judges */}
            <div className="p-3 rounded-lg bg-gradient-to-r from-cyan-500/10 via-indigo-500/10 to-transparent border border-cyan-500/30 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-cyan-300 flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5" />
                  Judge / Reviewer Access
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">Explore with pre-seeded multimodal data</p>
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

            {error && (
              <div className="p-3.5 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs space-y-2">
                <p>{error}</p>
                {isUnverified && (
                  <div className="pt-1">
                    <Link
                      to={`/verify-email?email=${encodeURIComponent(email)}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-semibold transition-colors"
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
                  <label className="text-xs font-medium text-slate-300">Password</label>
                  <Link
                    to="/forgot-password"
                    className="text-[11px] text-cyan-400 hover:text-cyan-300"
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
                      className="text-slate-400 hover:text-slate-200"
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

          <p className="text-center text-xs text-slate-400">
            Don't have an account yet?{' '}
            <Link to="/register" className="text-cyan-400 hover:text-cyan-300 font-medium">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
