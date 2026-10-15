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
      className={`relative w-full rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden flex flex-col ${className}`}
    >
      {/* Top Header Strip */}
      <div className="p-4 border-b border-slate-200 bg-slate-50/70 backdrop-blur-md flex flex-wrap items-center justify-between gap-2 z-10">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-600" />
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight">
              {title}
            </h3>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5 truncate max-w-sm sm:max-w-md">
            {subtitle}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Sparkles className="w-3 h-3 text-cyan-600" />
            <span>{isRotating ? 'Auto-Rotating' : 'Manual Orbit'}</span>
          </span>
        </div>
      </div>

      {/* 3D Canvas Area */}
      <div className="relative w-full h-[320px] sm:h-[400px] flex items-center justify-center bg-slate-900/5">
        <InteractiveGlobe ref={globeRef} autoRotateDefault={true} showControls={false} />

        {/* Floating Clean Intelligence Control HUD */}
        <div className="absolute bottom-4 right-4 z-20 flex items-center gap-1 bg-white/90 backdrop-blur-md p-1.5 rounded-xl border border-slate-200 shadow-md">
          <button
            type="button"
            onClick={handleToggleRotation}
            className="p-2 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-slate-100 transition-colors cursor-pointer"
            title={isRotating ? 'Pause Rotation' : 'Resume Rotation'}
            aria-label={isRotating ? 'Pause Rotation' : 'Resume Rotation'}
          >
            {isRotating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>

          <button
            type="button"
            onClick={handleZoomIn}
            className="p-2 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Zoom In"
            aria-label="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={handleZoomOut}
            className="p-2 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Zoom Out"
            aria-label="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={handleResetCamera}
            className="p-2 rounded-lg text-slate-600 hover:text-cyan-700 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Reset Camera Position"
            aria-label="Reset Camera Position"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Floating Interaction Hint */}
        <div className="absolute bottom-4 left-4 z-20 hidden sm:flex items-center gap-1.5 text-[11px] text-slate-500 bg-white/85 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-200 shadow-xs pointer-events-none font-medium">
          <Compass className="w-3.5 h-3.5 text-blue-600" />
          <span>Drag to orbit • Scroll to zoom • Use controls to inspect</span>
        </div>
      </div>
    </div>
  );
};

