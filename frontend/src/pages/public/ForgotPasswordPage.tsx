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
    <div className="min-h-screen bg-[#F7F9FC] flex flex-col text-[#202938]">
      <PublicNavbar />

      <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md space-y-5">
          <div className="text-center space-y-2">
            <div className="w-9 h-9 rounded-md bg-[#356AE6] flex items-center justify-center mx-auto text-white shadow-xs">
              <Mail className="w-4 h-4" />
            </div>
            <h2 className="text-2xl font-bold text-[#202938]">Reset Password</h2>
            <p className="text-xs text-[#667085]">
              Enter your email address and we'll send recovery instructions.
            </p>
          </div>

          <Card className="p-6 sm:p-8 space-y-5 bg-white border border-[#E5EAF1] rounded-xl shadow-xs">
            {submitted ? (
              <div className="text-center space-y-3 py-4">
                <CheckCircle2 className="w-10 h-10 text-[#12B76A] mx-auto" />
                <h3 className="text-sm font-semibold text-[#202938]">Instructions Dispatched</h3>
                <p className="text-xs text-[#667085] leading-relaxed">
                  If an account exists for {email}, a password reset link has been dispatched.
                </p>
                <Link to="/login" className="inline-block pt-2">
                  <Button variant="outline" size="sm">
                    Return to Login
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
                <Button type="submit" size="md" className="w-full" loading={loading}>
                  Send Reset Link
                </Button>
              </form>
            )}
          </Card>

          <p className="text-center text-xs text-[#667085]">
            <Link
              to="/login"
              className="text-[#356AE6] hover:text-[#2856C5] font-medium flex items-center justify-center gap-1.5"
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
