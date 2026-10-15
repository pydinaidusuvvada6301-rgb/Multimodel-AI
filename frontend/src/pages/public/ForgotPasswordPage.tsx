import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { PublicNavbar } from '../../components/layout/PublicNavbar.js';
import { Button } from '../../components/ui/Button.js';
import { Input } from '../../components/ui/Input.js';
import { Card } from '../../components/ui/Card.js';
import { useAuth } from '../../context/AuthContext.js';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const { requestPasswordReset } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      await requestPasswordReset(email);
      setSubmitted(true);
    } catch {
      setSubmitted(true);
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
            <h2 className="text-2xl font-bold font-display text-[#F4F7FF]">Reset Password</h2>
            <p className="text-xs text-[#9AA8C7]">
              Enter your email address and we'll send recovery instructions.
            </p>
          </div>

          <div className="glass-card p-6 sm:p-8 space-y-5 rounded-2xl border border-[rgba(79,140,255,0.2)] bg-[#0D1428]/80 backdrop-blur-xl shadow-2xl">
            {submitted ? (
              <div className="text-center space-y-3 py-4">
                <CheckCircle2 className="w-12 h-12 text-[#12B76A] mx-auto animate-bounce" />
                <h3 className="text-base font-semibold text-[#F4F7FF]">Instructions Dispatched</h3>
                <p className="text-xs text-[#9AA8C7] leading-relaxed">
                  If an account exists for <span className="text-[#42E8F5] font-medium">{email}</span>, a secure password reset link has been dispatched to your inbox.
                </p>
                <Link to="/login" className="inline-block pt-3 w-full">
                  <Button variant="outline" size="md" className="w-full border-[rgba(79,140,255,0.3)] text-[#F4F7FF] hover:bg-[#4F8CFF]/15">
                    Return to Sign In
                  </Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Registered Email Address"
                  type="email"
                  placeholder="you@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  icon={<Mail className="w-4 h-4" />}
                  required
                />
                <Button
                  type="submit"
                  size="md"
                  className="w-full bg-gradient-to-r from-[#4F8CFF] to-[#42E8F5] text-[#070B17] font-semibold shadow-lg shadow-[#4F8CFF]/20"
                  loading={loading}
                >
                  Send Reset Link
                </Button>
              </form>
            )}
          </div>

          <p className="text-center text-xs text-[#9AA8C7]">
            <Link
              to="/login"
              className="text-[#4F8CFF] hover:text-[#42E8F5] font-medium flex items-center justify-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
