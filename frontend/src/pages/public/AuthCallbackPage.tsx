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
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="p-8 text-center space-y-4 bg-surface-200/90 border-slate-700/80 shadow-2xl">
          {status === 'verifying' && (
            <div className="space-y-3 py-4">
              <Loader2 className="w-10 h-10 text-cyan-400 animate-spin mx-auto" />
              <h2 className="text-lg font-bold text-slate-100">Verifying Security Credentials</h2>
              <p className="text-xs text-slate-400">
                Please wait while OmniMind AI authenticates your session...
              </p>
            </div>
          )}

          {status === 'success' && (
            <div className="space-y-3 py-4">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
              <h2 className="text-lg font-bold text-slate-100">Account Verified!</h2>
              <p className="text-xs text-slate-300">
                Your email has been confirmed. Redirecting you to your multimodal workspace...
              </p>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-4 py-2">
              <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
              <h2 className="text-lg font-bold text-slate-100">Verification Failed</h2>
              <p className="text-xs text-rose-300 leading-relaxed">
                {errorMessage || 'This verification link is invalid, has expired, or has already been used.'}
              </p>
              <div className="pt-2 flex flex-col gap-2">
                <Button size="md" onClick={() => navigate('/login')}>
                  Proceed to Login
                </Button>
                <Button variant="outline" size="sm" onClick={() => navigate('/verify-email')}>
                  Resend Verification Email
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
