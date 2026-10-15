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
    <div className="min-h-screen bg-background text-[#F4F7FF] flex flex-col font-sans relative overflow-x-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#4F8CFF]/10 rounded-full blur-[120px] pointer-events-none" />
      <PublicNavbar />

      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 relative z-10">
        <div className="w-full max-w-md space-y-5">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#4F8CFF] to-[#42E8F5] flex items-center justify-center mx-auto text-white shadow-lg shadow-[#4F8CFF]/25">
              <Mail className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold font-display text-[#F4F7FF]">Verify Your Email</h2>
            <p className="text-xs text-[#9AA8C7]">
              Activate your OmniMind AI account to begin processing multimodal intelligence
            </p>
          </div>

          <div className="glass-card p-6 sm:p-8 space-y-5 rounded-2xl border border-[rgba(79,140,255,0.2)] bg-[#0D1428]/80 backdrop-blur-xl shadow-2xl">
            <div className="p-4 rounded-xl bg-[#070B17]/60 border border-[rgba(79,140,255,0.2)] text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-[#42E8F5] mx-auto animate-pulse" />
              <p className="text-sm font-semibold text-[#F4F7FF]">Verification Link Dispatched</p>
              <p className="text-xs text-[#9AA8C7] leading-relaxed">
                We sent a secure confirmation link to{' '}
                <span className="font-semibold text-[#42E8F5]">{email || 'your email'}</span>.
                Please check your inbox (and spam folder) and click the link to confirm your account.
              </p>
            </div>

            {message && (
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{message}</span>
              </div>
            )}

            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-3 pt-2">
              <p className="text-xs text-[#9AA8C7] text-center">
                Didn't receive the verification email?
              </p>
              <Button
                type="button"
                variant="outline"
                size="md"
                className="w-full flex items-center justify-center gap-2 border-[rgba(79,140,255,0.3)] hover:bg-[#4F8CFF]/15 text-[#F4F7FF]"
                onClick={handleResend}
                disabled={cooldown > 0 || loading}
                loading={loading}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                {cooldown > 0 ? `Resend available in ${cooldown}s` : 'Resend Verification Email'}
              </Button>
            </div>

            <div className="pt-2 border-t border-[rgba(79,140,255,0.15)] flex items-center justify-between">
              <Link
                to="/login"
                className="text-xs text-[#4F8CFF] hover:text-[#42E8F5] font-medium flex items-center gap-1 transition-colors"
              >
                <span>Proceed to Sign In</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                to="/register"
                className="text-xs text-[#9AA8C7] hover:text-[#F4F7FF] transition-colors"
              >
                Change Email
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
