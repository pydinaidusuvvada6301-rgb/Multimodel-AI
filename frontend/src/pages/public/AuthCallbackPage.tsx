import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Sparkles, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { supabaseClient } from '../../lib/supabase.js';
import { setAccessToken } from '../../lib/api.js';
import { Card } from '../../components/ui/Card.js';
import { Button } from '../../components/ui/Button.js';

export const AuthCallbackPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        if (!supabaseClient) {
          // No client configured, direct to login
          navigate('/login');
          return;
        }

        // Check if there is an active session established by Supabase client
        const { data, error } = await supabaseClient.auth.getSession();
        if (error) {
          setStatus('error');
          setErrorMessage(error.message || 'Verification link expired or invalid.');
          return;
        }

        // Check hash fragments
        const hash = window.location.hash;
        const search = window.location.search;
        const params = new URLSearchParams(hash.replace(/^#/, '') || search);
        const type = params.get('type');
        const errorCode = params.get('error_code');
        const errorDescription = params.get('error_description');

        if (errorCode) {
          setStatus('error');
          setErrorMessage(errorDescription || 'Authentication callback failed.');
          return;
        }

        if (type === 'recovery') {
          // Password recovery link
          navigate('/reset-password');
          return;
        }

        if (data.session) {
          setAccessToken(data.session.access_token);
        }

        if (data.session || type === 'signup' || type === 'email_change') {
          setStatus('success');
          setTimeout(() => {
            navigate('/app');
          }, 1200);
          return;
        }

        // Default redirect to app or login
        setTimeout(() => {
          navigate('/login');
        }, 1200);
      } catch (err: any) {
        setStatus('error');
        setErrorMessage(err.message || 'An unexpected error occurred during verification.');
      }
    };

    handleAuthCallback();
  }, [navigate, location]);

  return (
    <div className="min-h-screen bg-background text-[#F4F7FF] flex items-center justify-center p-4 font-sans relative overflow-x-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#4F8CFF]/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="w-full max-w-md relative z-10">
        <div className="glass-card p-8 text-center space-y-4 rounded-2xl border border-[rgba(79,140,255,0.2)] bg-[#0D1428]/80 backdrop-blur-xl shadow-2xl">
          {status === 'verifying' && (
            <div className="space-y-4 py-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#4F8CFF] to-[#42E8F5] flex items-center justify-center mx-auto text-white shadow-lg shadow-[#4F8CFF]/25">
                <Loader2 className="w-6 h-6 animate-spin text-white" />
              </div>
              <h2 className="text-lg font-bold font-display text-[#F4F7FF]">Verifying Security Credentials</h2>
              <p className="text-xs text-[#9AA8C7]">
                Please wait while OmniMind AI authenticates your session...
              </p>
            </div>
          )}

          {status === 'success' && (
            <div className="space-y-4 py-4">
              <CheckCircle2 className="w-12 h-12 text-[#12B76A] mx-auto animate-bounce" />
              <h2 className="text-lg font-bold font-display text-[#F4F7FF]">Account Verified!</h2>
              <p className="text-xs text-[#9AA8C7]">
                Your session is verified. Redirecting you to your multimodal workspace...
              </p>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-4 py-2">
              <AlertCircle className="w-12 h-12 text-[#F04438] mx-auto" />
              <h2 className="text-lg font-bold font-display text-[#F4F7FF]">Verification Failed</h2>
              <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 p-3 rounded-lg leading-relaxed">
                {errorMessage || 'This verification link is invalid, has expired, or has already been used.'}
              </p>
              <div className="pt-2 flex flex-col gap-2">
                <Button
                  size="md"
                  className="bg-gradient-to-r from-[#4F8CFF] to-[#42E8F5] text-[#070B17] font-semibold"
                  onClick={() => navigate('/login')}
                >
                  Proceed to Login
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-[rgba(79,140,255,0.3)] text-[#F4F7FF] hover:bg-[#4F8CFF]/15"
                  onClick={() => navigate('/verify-email')}
                >
                  Resend Verification Email
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
