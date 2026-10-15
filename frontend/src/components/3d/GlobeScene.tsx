import React, { useRef, useState } from 'react';
import {
  Play,
  Pause,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Compass,
  Sparkles,
} from 'lucide-react';
import {
  InteractiveGlobe,
  GlobeController,
} from './InteractiveGlobe.js';

interface GlobeSceneProps {
  title?: string;
  subtitle?: string;
  className?: string;
}

export const GlobeScene: React.FC<GlobeSceneProps> = ({
  title = 'Global Multimodal Lattice',
  subtitle = 'Real-time cross-source neural embeddings anchored across global vectors',
  className = '',
}) => {
  const globeRef = useRef<GlobeController>(null);
  const [isRotating, setIsRotating] = useState(true);

  const handleToggleRotation = () => {
    globeRef.current?.toggleRotation();
    setIsRotating((prev) => !prev);
  };

  const handleZoomIn = () => {
    globeRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    globeRef.current?.zoomOut();
  };

  const handleResetCamera = () => {
    globeRef.current?.resetCamera();
  };

  return (
    <div
      className={`relative w-full rounded-2xl bg-deep-bg/95 border border-deep-border shadow-2xl overflow-hidden flex flex-col ${className}`}
    >
      {/* Top Header Strip */}
      <div className="p-4 border-b border-deep-border bg-deep-surface/90 backdrop-blur-md flex flex-wrap items-center justify-between gap-2 z-10">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyanAccent animate-pulse" />
            <h3 className="text-xs sm:text-sm font-semibold text-nearwhite tracking-tight">
              {title}
            </h3>
          </div>
          <p className="text-[11px] text-bluegray mt-0.5 truncate max-w-sm sm:max-w-md">
            {subtitle}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-electric/15 text-electric border border-electric/30">
            <Sparkles className="w-3 h-3 text-cyanAccent" />
            <span>{isRotating ? 'Auto-Rotating' : 'Manual Orbit'}</span>
          </span>
        </div>
      </div>

      {/* 3D Canvas Area */}
      <div className="relative w-full h-[320px] sm:h-[400px] flex items-center justify-center bg-gradient-to-b from-deep-bg via-deep-surface/50 to-deep-bg">
        <InteractiveGlobe ref={globeRef} autoRotateDefault={true} />

        {/* Floating Translucent Control HUD */}
        <div className="absolute bottom-4 right-4 z-20 flex items-center gap-1.5 bg-deep-surface/90 backdrop-blur-md p-1.5 rounded-xl border border-deep-border shadow-lg">
          <button
            type="button"
            onClick={handleToggleRotation}
            className="p-2 rounded-lg text-bluegray hover:text-cyanAccent hover:bg-electric/20 transition-colors"
            title={isRotating ? 'Pause Rotation' : 'Resume Rotation'}
            aria-label={isRotating ? 'Pause Rotation' : 'Resume Rotation'}
          >
            {isRotating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>

          <button
            type="button"
            onClick={handleZoomIn}
            className="p-2 rounded-lg text-bluegray hover:text-cyanAccent hover:bg-electric/20 transition-colors"
            title="Zoom In"
            aria-label="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={handleZoomOut}
            className="p-2 rounded-lg text-bluegray hover:text-cyanAccent hover:bg-electric/20 transition-colors"
            title="Zoom Out"
            aria-label="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={handleResetCamera}
            className="p-2 rounded-lg text-bluegray hover:text-cyanAccent hover:bg-electric/20 transition-colors"
            title="Reset Camera Position"
            aria-label="Reset Camera Position"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Floating Interaction Hint */}
        <div className="absolute bottom-4 left-4 z-20 hidden sm:flex items-center gap-1.5 text-[11px] text-bluegray bg-deep-surface/85 backdrop-blur-md px-3 py-1.5 rounded-lg border border-deep-border shadow-lg pointer-events-none">
          <Compass className="w-3.5 h-3.5 text-cyanAccent" />
          <span>Drag to orbit • Scroll to zoom • Click buttons to control</span>
        </div>
      </div>
    </div>
  );
};
