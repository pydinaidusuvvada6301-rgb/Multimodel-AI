import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, Lock, Mail, User, Check, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { PublicNavbar } from '../../components/layout/PublicNavbar.js';
import { Button } from '../../components/ui/Button.js';
import { Input } from '../../components/ui/Input.js';
import { Card } from '../../components/ui/Card.js';
import { useAuth } from '../../context/AuthContext.js';

export const RegisterPage: React.FC = () => {
  const { register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Password strength calculation
  const hasMinLength = password.length >= 8;
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (!hasMinLength) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (!agreeTerms) {
      setError('Please accept the Terms of Service to continue.');
      return;
    }

    setLoading(true);
    try {
      const res = await register(name, email, password);
      if (res?.needsVerification) {
        navigate(`/verify-email?email=${encodeURIComponent(email)}`);
      } else {
        navigate('/app');
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || err.message || 'Registration failed.');
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
          'Google Sign-In requires entering your Google Cloud Client ID & Secret in Supabase Dashboard (Authentication > Providers > Google). You can register immediately with Email/Password below.'
        );
      } else {
        setError(msg || 'Google Sign-In could not be initialized.');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070B17] flex flex-col text-[#F4F7FF]">
      <PublicNavbar />

      <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md space-y-5">
          <div className="text-center space-y-2">
            <div className="w-9 h-9 rounded-lg bg-[#4F8CFF] flex items-center justify-center mx-auto text-white shadow-[0_0_15px_-2px_rgba(79,140,255,0.5)]">
              <Sparkles className="w-4 h-4" />
            </div>
            <h2 className="text-2xl font-bold text-[#F4F7FF]">Create an Account</h2>
            <p className="text-xs text-[#9AA8C7]">
              Join OmniMind AI to connect knowledge across all your modalities
            </p>
          </div>

          <Card className="p-6 sm:p-8 space-y-5 bg-[#0D1428]/85 backdrop-blur-xl border border-[#4F8CFF]/25 rounded-2xl shadow-2xl text-[#F4F7FF]">
            {/* Google OAuth Button */}
            <Button
              type="button"
              variant="outline"
              size="md"
              className="w-full flex items-center justify-center gap-2.5 border-[#4F8CFF]/25 hover:bg-[#4F8CFF]/15 text-[#F4F7FF] transition-colors"
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
              <div className="border-t border-[#4F8CFF]/20 w-full" />
              <span className="bg-[#0D1428] px-3 text-[11px] text-[#9AA8C7] uppercase tracking-wider absolute">
                or register with email
              </span>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Full Name"
                placeholder="Dr. Alex Vance"
                value={name}
                onChange={(e) => setName(e.target.value)}
                icon={<User className="w-4 h-4" />}
                required
              />

              <Input
                label="Email Address"
                type="email"
                placeholder="alex@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                icon={<Mail className="w-4 h-4" />}
                required
                autoComplete="email"
              />

              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                icon={<Lock className="w-4 h-4" />}
                rightElement={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-[#9AA8C7] hover:text-[#F4F7FF]"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
                required
              />

              {/* Password strength checklist */}
              <div className="p-2.5 rounded-lg bg-[#070B17]/70 border border-[#4F8CFF]/20 text-[11px] space-y-1">
                <span className="text-[#9AA8C7] font-medium">Password requirements:</span>
                <div className="grid grid-cols-2 gap-1 text-[#9AA8C7]">
                  <span className={hasMinLength ? 'text-emerald-400 font-semibold flex items-center gap-1' : ''}>
                    • 8+ characters
                  </span>
                  <span className={hasNumber ? 'text-emerald-400 font-semibold flex items-center gap-1' : ''}>
                    • Numbers
                  </span>
                  <span className={hasSpecial ? 'text-emerald-400 font-semibold flex items-center gap-1' : ''}>
                    • Symbols
                  </span>
                </div>
              </div>

              <Input
                label="Confirm Password"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Repeat password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                icon={<Lock className="w-4 h-4" />}
                rightElement={
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="text-[#9AA8C7] hover:text-[#F4F7FF]"
                    aria-label="Toggle confirm password visibility"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
                required
              />

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="agreeTerms"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="rounded border-[#4F8CFF]/30 bg-[#070B17] text-[#4F8CFF] focus:ring-[#42E8F5] cursor-pointer"
                />
                <label htmlFor="agreeTerms" className="text-xs text-[#9AA8C7] cursor-pointer">
                  I agree to the Terms of Service & Privacy Policy
                </label>
              </div>

              <Button type="submit" size="md" className="w-full" loading={loading}>
                Register Account
              </Button>
            </form>
          </Card>

          <p className="text-center text-xs text-[#9AA8C7]">
            Already have an account?{' '}
            <Link to="/login" className="text-[#42E8F5] hover:text-[#4F8CFF] font-medium">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
