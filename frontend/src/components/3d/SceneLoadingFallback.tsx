import React from 'react';
import { Globe2 } from 'lucide-react';

interface SceneLoadingFallbackProps {
  message?: string;
  isError?: boolean;
}

export const SceneLoadingFallback: React.FC<SceneLoadingFallbackProps> = ({
  message = 'Initializing 3D Multimodal Environment...',
  isError = false,
}) => {
  return (
    <div className="w-full h-full min-h-[320px] flex flex-col items-center justify-center p-6 bg-surface-secondary/40 rounded-2xl border border-border-default text-center select-none relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute inset-0 bg-radial-gradient pointer-events-none opacity-40" />

      {/* Orbiting CSS Rings Fallback */}
      <div className="relative w-28 h-28 mb-4 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full border border-brand-300/40 animate-ping opacity-25" />
        <div className="absolute inset-2 rounded-full border border-dashed border-brand-500/60 animate-spin" style={{ animationDuration: '14s' }} />
        <div className="absolute inset-6 rounded-full border border-brand-400/30 animate-spin" style={{ animationDuration: '8s', animationDirection: 'reverse' }} />
        <div className="w-12 h-12 rounded-xl bg-brand-50 border border-brand-200 flex items-center justify-center text-brand-600 shadow-xs">
          <Globe2 className="w-6 h-6 animate-pulse" />
        </div>
      </div>

      <p className={`text-xs font-semibold ${isError ? 'text-rose-600' : 'text-text-primary'}`}>
        {message}
      </p>
      <p className="text-[11px] text-text-muted mt-1 max-w-xs">
        {isError
          ? 'WebGL acceleration is unavailable. Fallback high-contrast mode enabled.'
          : 'Compiling vertex shaders and spherical coordinate mesh.'}
      </p>
    </div>
  );
};
