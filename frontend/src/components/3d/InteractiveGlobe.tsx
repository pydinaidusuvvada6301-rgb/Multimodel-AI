import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { Play, Pause, ZoomIn, ZoomOut, RotateCcw, Compass } from 'lucide-react';
import { SceneLoadingFallback } from './SceneLoadingFallback.js';

export interface InteractiveGlobeProps {
  autoRotateDefault?: boolean;
  rotationSpeed?: number;
  className?: string;
  showControls?: boolean;
  onRotationToggle?: (isRotating: boolean) => void;
}

export interface GlobeController {
  toggleRotation: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetCamera: () => void;
  isRotating: boolean;
}

export const InteractiveGlobe = React.forwardRef<
  GlobeController,
  InteractiveGlobeProps
>(({
  autoRotateDefault = true,
  rotationSpeed = 0.003,
  className = '',
  showControls = true,
  onRotationToggle
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasWebGLError, setHasWebGLError] = useState(false);
  const [isRotating, setIsRotating] = useState(autoRotateDefault);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // References for Three.js objects
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const globeGroupRef = useRef<THREE.Group | null>(null);
  const ringsRef = useRef<{ ring1: THREE.Mesh; ring2: THREE.Mesh } | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  // Interaction tracking
  const isDraggingRef = useRef(false);
  const previousPointerPosRef = useRef({ x: 0, y: 0 });
  const touchStartDistRef = useRef<number | null>(null);
  const isRotatingRef = useRef(autoRotateDefault);
  const isVisibleRef = useRef(true);

  // Camera limits & defaults
  const DEFAULT_CAMERA_POS = { x: 0, y: 0.4, z: 4.6 };
  const MIN_CAMERA_Z = 2.4;
  const MAX_CAMERA_Z = 7.5;

  // Sync state to ref for animation loop
  useEffect(() => {
    isRotatingRef.current = isRotating;
    if (onRotationToggle) {
      onRotationToggle(isRotating);
    }
  }, [isRotating, onRotationToggle]);

  // Reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) {
      setIsRotating(false);
      isRotatingRef.current = false;
    }
  }, []);

  // Pause rendering when tab is hidden to save GPU cycles
  useEffect(() => {
    const handleVisibilityChange = () => {
      isVisibleRef.current = !document.hidden;
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const toggleRotation = useCallback(() => {
    setIsRotating((prev) => !prev);
  }, []);

  const zoomIn = useCallback(() => {
    if (!cameraRef.current) return;
    cameraRef.current.position.z = Math.max(
      MIN_CAMERA_Z,
      cameraRef.current.position.z - 0.5
    );
  }, []);

  const zoomOut = useCallback(() => {
    if (!cameraRef.current) return;
    cameraRef.current.position.z = Math.min(
      MAX_CAMERA_Z,
      cameraRef.current.position.z + 0.5
    );
  }, []);

  const resetCamera = useCallback(() => {
    if (!cameraRef.current || !globeGroupRef.current) return;
    cameraRef.current.position.set(
      DEFAULT_CAMERA_POS.x,
      DEFAULT_CAMERA_POS.y,
      DEFAULT_CAMERA_POS.z
    );
    globeGroupRef.current.rotation.set(0, 0, 0);
  }, []);

  // Expose controller methods via imperative handle
  React.useImperativeHandle(ref, () => ({
    toggleRotation,
    zoomIn,
    zoomOut,
    resetCamera,
    isRotating,
  }));

  // Initialize Three.js scene
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Check for WebGL capability safely
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) {
        setHasWebGLError(true);
        return;
      }
    } catch {
      setHasWebGLError(true);
      return;
    }

    const width = container.clientWidth || 400;
    const height = container.clientHeight || 400;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(DEFAULT_CAMERA_POS.x, DEFAULT_CAMERA_POS.y, DEFAULT_CAMERA_POS.z);
    cameraRef.current = camera;

    // 3. Renderer with antialiasing and alpha
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.15;
      container.appendChild(renderer.domElement);
      rendererRef.current = renderer;
    } catch (e) {
      console.warn('WebGL initialization failed, falling back:', e);
      setHasWebGLError(true);
      return;
    }

    // 4. Globe Group for composite rotations
    const globeGroup = new THREE.Group();
    scene.add(globeGroup);
    globeGroupRef.current = globeGroup;

    // 5. Core Spherical Lattice Mesh
    const sphereRadius = 1.6;
    const segments = 48;
    const sphereGeometry = new THREE.SphereGeometry(sphereRadius, segments, segments);
    
    // Core sphere with clean blue/cyan translucent sheen
    const sphereMaterial = new THREE.MeshPhongMaterial({
      color: 0x0F172A,
      emissive: 0x2563EB,
      emissiveIntensity: 0.18,
      transparent: true,
      opacity: 0.88,
      shininess: 70,
    });
    const coreSphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    globeGroup.add(coreSphere);

    // 6. Dot Grid Points on Sphere Surface (Representing multimodal neural topology)
    const pointsCount = 1350;
    const pointsGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(pointsCount * 3);
    const colors = new Float32Array(pointsCount * 3);

    const colorBlue = new THREE.Color(0x2563EB); // Royal Blue
    const colorCyan = new THREE.Color(0x06B6D4); // Cyan
    const colorLight = new THREE.Color(0xE2E8F0); // Crisp light

    for (let i = 0; i < pointsCount; i++) {
      const phi = Math.acos(-1 + (2 * i) / pointsCount);
      const theta = Math.sqrt(pointsCount * Math.PI) * phi;

      const r = sphereRadius + 0.025;
      const x = r * Math.cos(theta) * Math.sin(phi);
      const y = r * Math.sin(theta) * Math.sin(phi);
      const z = r * Math.cos(phi);

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      // Color distribution: Royal blue, vibrant cyan, and pure crisp white
      const rand = Math.random();
      const nodeColor = rand > 0.65 ? colorLight : rand > 0.3 ? colorCyan : colorBlue;
      colors[i * 3] = nodeColor.r;
      colors[i * 3 + 1] = nodeColor.g;
      colors[i * 3 + 2] = nodeColor.b;
    }

    pointsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    pointsGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const pointsMaterial = new THREE.PointsMaterial({
      size: 0.046,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
    });
    const globePoints = new THREE.Points(pointsGeometry, pointsMaterial);
    globeGroup.add(globePoints);

    // 7. Atmospheric Glow Layer
    const atmosphereGeometry = new THREE.SphereGeometry(sphereRadius + 0.14, 32, 32);
    const atmosphereMaterial = new THREE.MeshBasicMaterial({
      color: 0x06B6D4,
      transparent: true,
      opacity: 0.14,
      side: THREE.BackSide,
    });
    const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    globeGroup.add(atmosphere);

    // 8. Orbital Ring 1 (Equatorial tilt - Royal Blue)
    const ringGeometry1 = new THREE.RingGeometry(2.12, 2.16, 64);
    const ringMaterial1 = new THREE.MeshBasicMaterial({
      color: 0x2563EB,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.7,
    });
    const ring1 = new THREE.Mesh(ringGeometry1, ringMaterial1);
    ring1.rotation.x = Math.PI / 2.4;
    globeGroup.add(ring1);

    // 9. Orbital Ring 2 (Polar tilt - Cyan)
    const ringGeometry2 = new THREE.RingGeometry(2.38, 2.41, 64);
    const ringMaterial2 = new THREE.MeshBasicMaterial({
      color: 0x06B6D4,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.55,
    });
    const ring2 = new THREE.Mesh(ringGeometry2, ringMaterial2);
    ring2.rotation.y = Math.PI / 3.2;
    globeGroup.add(ring2);

    ringsRef.current = { ring1, ring2 };

    // 10. Intelligent Lighting for Clean Surfaces
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.1);
    scene.add(ambientLight);

    const directionalLight1 = new THREE.DirectionalLight(0xffffff, 1.4);
    directionalLight1.position.set(5, 5, 6);
    scene.add(directionalLight1);

    const directionalLight2 = new THREE.DirectionalLight(0x06B6D4, 0.9);
    directionalLight2.position.set(-5, -2, -3);
    scene.add(directionalLight2);

    setIsLoaded(true);

    // 11. Responsive Resize Handler
    const handleResize = () => {
      if (!container || !camera || !renderer) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w === 0 || h === 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // 12. Animation Loop with Visibility Check
    const animate = () => {
      animFrameIdRef.current = requestAnimationFrame(animate);

      if (!isVisibleRef.current) return;

      if (globeGroup) {
        if (isRotatingRef.current && !isDraggingRef.current) {
          globeGroup.rotation.y += rotationSpeed;
          ring1.rotation.z += 0.0018;
          ring2.rotation.z -= 0.0014;
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    // Cleanup resources on unmount
    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      resizeObserver.disconnect();

      // Dispose geometries & materials
      sphereGeometry.dispose();
      sphereMaterial.dispose();
      pointsGeometry.dispose();
      pointsMaterial.dispose();
      atmosphereGeometry.dispose();
      atmosphereMaterial.dispose();
      ringGeometry1.dispose();
      ringMaterial1.dispose();
      ringGeometry2.dispose();
      ringMaterial2.dispose();

      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [rotationSpeed]);

  // Pointer Interaction Handlers (Mouse & Touch Dragging)
  const onPointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    previousPointerPosRef.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current || !globeGroupRef.current) return;
    const deltaX = e.clientX - previousPointerPosRef.current.x;
    const deltaY = e.clientY - previousPointerPosRef.current.y;

    globeGroupRef.current.rotation.y += deltaX * 0.006;
    globeGroupRef.current.rotation.x = Math.max(
      -Math.PI / 3.5,
      Math.min(Math.PI / 3.5, globeGroupRef.current.rotation.x + deltaY * 0.006)
    );

    previousPointerPosRef.current = { x: e.clientX, y: e.clientY };
  };

  const onPointerUp = (e: React.PointerEvent) => {
    isDraggingRef.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
  };

  // Wheel Zoom Interaction
  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (!cameraRef.current) return;
    const delta = e.deltaY * 0.003;
    cameraRef.current.position.z = Math.max(
      MIN_CAMERA_Z,
      Math.min(MAX_CAMERA_Z, cameraRef.current.position.z + delta)
    );
  };

  // Touch Pinch Zoom Handler
  const onTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && cameraRef.current) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (touchStartDistRef.current !== null) {
        const delta = (touchStartDistRef.current - dist) * 0.01;
        cameraRef.current.position.z = Math.max(
          MIN_CAMERA_Z,
          Math.min(MAX_CAMERA_Z, cameraRef.current.position.z + delta)
        );
      }
      touchStartDistRef.current = dist;
    }
  };

  const onTouchEnd = () => {
    touchStartDistRef.current = null;
  };

  if (hasWebGLError) {
    return <SceneLoadingFallback isError message="3D acceleration unavailable on device." />;
  }

  return (
    <div
      className={`relative w-full h-full min-h-[320px] select-none overflow-hidden group ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="region"
      aria-label="Interactive 3D Multimodal Intelligence Globe"
    >
      {/* 3D Canvas Container */}
      <div
        ref={containerRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onWheel={onWheel}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        className="w-full h-full touch-none cursor-grab active:cursor-grabbing"
      >
        {!isLoaded && <SceneLoadingFallback />}
      </div>

      {/* Floating Clean Intelligence Interactive Controls */}
      {showControls && isLoaded && (
        <div
          className={`absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1 px-2 py-1 rounded-full bg-white/90 backdrop-blur-md border border-slate-200 shadow-md text-slate-700 transition-opacity duration-200 z-10 ${
            isHovered ? 'opacity-100' : 'opacity-85 sm:opacity-90'
          }`}
        >
          {/* Play/Pause Rotation Button */}
          <button
            type="button"
            onClick={toggleRotation}
            className={`p-1.5 rounded-full transition-colors ${
              isRotating
                ? 'text-blue-600 hover:bg-blue-50'
                : 'text-slate-500 hover:bg-slate-100'
            }`}
            title={isRotating ? 'Pause auto-rotation' : 'Resume auto-rotation'}
            aria-label={isRotating ? 'Pause rotation' : 'Resume rotation'}
          >
            {isRotating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>

          <div className="w-[1px] h-3.5 bg-slate-200 mx-0.5" />

          {/* Zoom In Button */}
          <button
            type="button"
            onClick={zoomIn}
            className="p-1.5 rounded-full text-slate-600 hover:text-blue-600 hover:bg-slate-100 transition-colors"
            title="Zoom in (+)"
            aria-label="Zoom in"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          {/* Zoom Out Button */}
          <button
            type="button"
            onClick={zoomOut}
            className="p-1.5 rounded-full text-slate-600 hover:text-blue-600 hover:bg-slate-100 transition-colors"
            title="Zoom out (-)"
            aria-label="Zoom out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>

          <div className="w-[1px] h-3.5 bg-slate-200 mx-0.5" />

          {/* Reset Camera View Button */}
          <button
            type="button"
            onClick={resetCamera}
            className="p-1.5 rounded-full text-slate-600 hover:text-cyan-600 hover:bg-slate-100 transition-colors"
            title="Reset perspective (↺)"
            aria-label="Reset perspective"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Helpful Subtle Gesture Hint */}
      <div className="absolute top-2.5 right-3 pointer-events-none">
        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-500 bg-white/80 backdrop-blur-sm px-2 py-0.5 rounded-full border border-slate-200 shadow-xs">
          <Compass className="w-3 h-3 text-blue-500 animate-spin-slow" />
          Drag to rotate • Scroll to zoom
        </span>
      </div>
    </div>
  );
});

InteractiveGlobe.displayName = 'InteractiveGlobe';

