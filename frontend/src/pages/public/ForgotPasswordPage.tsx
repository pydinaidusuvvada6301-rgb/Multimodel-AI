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
    <div className="min-h-screen bg-background flex flex-col">
      <PublicNavbar />

      <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md space-y-5">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-slate-100">Reset Password</h2>
            <p className="text-xs text-slate-400">
              Enter your email address and we'll send recovery instructions.
            </p>
          </div>

          <Card className="p-6 sm:p-8 space-y-5 bg-surface-200/90 border-slate-700/80 shadow-2xl">
            {submitted ? (
              <div className="text-center space-y-3 py-4">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                <h3 className="text-sm font-semibold text-slate-100">Instructions Dispatched</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
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

          <p className="text-center text-xs text-slate-400">
            <Link to="/login" className="text-cyan-400 hover:text-cyan-300 font-medium flex items-center justify-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
