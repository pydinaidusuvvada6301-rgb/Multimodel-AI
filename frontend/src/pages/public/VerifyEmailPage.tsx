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
    <div className="min-h-screen bg-[#F7F9FC] flex flex-col text-[#202938]">
      <PublicNavbar />

      <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md space-y-5">
          <div className="text-center space-y-2">
            <div className="w-9 h-9 rounded-md bg-[#356AE6] flex items-center justify-center mx-auto text-white shadow-xs">
              <Mail className="w-4 h-4" />
            </div>
            <h2 className="text-2xl font-bold text-[#202938]">Verify Your Email</h2>
            <p className="text-xs text-[#667085]">
              Activate your OmniMind AI account to begin processing multimodal intelligence
            </p>
          </div>

          <Card className="p-6 sm:p-8 space-y-5 bg-white border border-[#E5EAF1] rounded-xl shadow-xs">
            <div className="p-4 rounded-lg bg-[#EEF4FF] border border-[#D0D7E2] text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-[#356AE6] mx-auto" />
              <p className="text-sm font-semibold text-[#202938]">Verification Link Dispatched</p>
              <p className="text-xs text-[#667085] leading-relaxed">
                We sent a secure confirmation link to{' '}
                <span className="font-semibold text-[#2856C5]">{email || 'your email'}</span>.
                Please check your inbox (and spam folder) and click the link to confirm your account.
              </p>
            </div>

            {message && (
              <div className="p-3 rounded-lg bg-[#ECFDF3] border border-[#A6F4C5] text-[#027A48] text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{message}</span>
              </div>
            )}

            {error && (
              <div className="p-3 rounded-lg bg-[#FEF3F2] border border-[#FECDCA] text-[#B42318] text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-3 pt-2">
              <p className="text-xs text-[#667085] text-center">
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

            <div className="pt-2 border-t border-[#E5EAF1] flex items-center justify-between">
              <Link
                to="/login"
                className="text-xs text-[#356AE6] hover:text-[#2856C5] font-medium flex items-center gap-1"
              >
                <span>Proceed to Sign In</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                to="/register"
                className="text-xs text-[#667085] hover:text-[#202938]"
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
