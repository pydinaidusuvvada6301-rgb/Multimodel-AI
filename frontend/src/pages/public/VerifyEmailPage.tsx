import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Mail, CheckCircle2, ArrowRight, RefreshCw, AlertCircle, Sparkles } from 'lucide-react';
import { PublicNavbar } from '../../components/layout/PublicNavbar.js';
import { Button } from '../../components/ui/Button.js';
import { Card } from '../../components/ui/Card.js';
import { useAuth } from '../../context/AuthContext.js';

export const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialEmail = searchParams.get('email') || '';
  const [email, setEmail] = useState(initialEmail);
  const { resendVerification } = useAuth();

  const [cooldown, setCooldown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let timer: any;
    if (cooldown > 0) {
      timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleResend = async () => {
    if (!email) {
      setError('Please provide an email address.');
      return;
    }
    if (cooldown > 0) return;

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const res = await resendVerification(email);
      setMessage(res.message || 'Verification email resent successfully.');
      setCooldown(60); // 60s cooldown
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Could not resend email. Please try again later.');
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
              <Mail className="w-6 h-6 text-slate-950 font-bold" />
            </div>
            <h2 className="text-2xl font-bold text-slate-100">Verify Your Email</h2>
            <p className="text-xs text-slate-400">
              Activate your OmniMind AI account to begin processing multimodal intelligence
            </p>
          </div>

          <Card className="p-6 sm:p-8 space-y-5 bg-surface-200/90 border-slate-700/80 shadow-2xl">
            <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-800/40 text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-cyan-400 mx-auto" />
              <p className="text-sm font-semibold text-slate-100">Verification Link Sent</p>
              <p className="text-xs text-slate-300 leading-relaxed">
                We sent a secure confirmation link to{' '}
                <span className="font-semibold text-cyan-300">{email || 'your email'}</span>.
                Please check your inbox (and spam folder) and click the link to confirm your account.
              </p>
            </div>

            {message && (
              <div className="p-3 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{message}</span>
              </div>
            )}

            {error && (
              <div className="p-3 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-3 pt-2">
              <p className="text-xs text-slate-400 text-center">
                Didn't receive the verification email?
              </p>
              <Button
                type="button"
                variant="outline"
                size="md"
                className="w-full flex items-center justify-center gap-2"
                onClick={handleResend}
                disabled={cooldown > 0 || loading}
                loading={loading}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                {cooldown > 0 ? `Resend available in ${cooldown}s` : 'Resend Verification Email'}
              </Button>
            </div>

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
              <Link
                to="/login"
                className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1"
              >
                <span>Proceed to Sign In</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                to="/register"
                className="text-xs text-slate-400 hover:text-slate-300"
              >
                Change Email
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
