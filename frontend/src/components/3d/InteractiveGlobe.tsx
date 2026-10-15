import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { SceneLoadingFallback } from './SceneLoadingFallback.js';

export interface InteractiveGlobeProps {
  autoRotateDefault?: boolean;
  rotationSpeed?: number;
  className?: string;
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
>(({ autoRotateDefault = true, rotationSpeed = 0.003, className = '' }, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasWebGLError, setHasWebGLError] = useState(false);
  const [isRotating, setIsRotating] = useState(autoRotateDefault);
  const [isLoaded, setIsLoaded] = useState(false);

  // References for Three.js objects
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const globeGroupRef = useRef<THREE.Group | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  // Interaction tracking
  const isDraggingRef = useRef(false);
  const previousPointerPosRef = useRef({ x: 0, y: 0 });
  const touchStartDistRef = useRef<number | null>(null);
  const isRotatingRef = useRef(autoRotateDefault);

  // Camera defaults
  const DEFAULT_CAMERA_POS = { x: 0, y: 0.5, z: 4.8 };
  const MIN_CAMERA_Z = 2.4;
  const MAX_CAMERA_Z = 8.0;

  // Sync state to ref for animation loop
  useEffect(() => {
    isRotatingRef.current = isRotating;
  }, [isRotating]);

  // Reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) {
      setIsRotating(false);
      isRotatingRef.current = false;
    }
  }, []);

  const toggleRotation = useCallback(() => {
    setIsRotating((prev) => !prev);
  }, []);

  const zoomIn = useCallback(() => {
    if (!cameraRef.current) return;
    cameraRef.current.position.z = Math.max(
      MIN_CAMERA_Z,
      cameraRef.current.position.z - 0.6
    );
  }, []);

  const zoomOut = useCallback(() => {
    if (!cameraRef.current) return;
    cameraRef.current.position.z = Math.min(
      MAX_CAMERA_Z,
      cameraRef.current.position.z + 0.6
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

  // Expose controller methods via ref
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
      renderer.toneMappingExposure = 1.2;
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
    
    // Core translucent material with subtle blue sheen
    const sphereMaterial = new THREE.MeshPhongMaterial({
      color: 0xEEF4FF,
      emissive: 0x356AE6,
      emissiveIntensity: 0.15,
      transparent: true,
      opacity: 0.85,
      shininess: 40,
    });
    const coreSphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    globeGroup.add(coreSphere);

    // 6. Dot Grid Points on Sphere Surface (Representing multimodal neural network)
    const pointsCount = 1200;
    const pointsGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(pointsCount * 3);
    const colors = new Float32Array(pointsCount * 3);

    const colorBrand = new THREE.Color(0x356AE6);
    const colorCyan = new THREE.Color(0x2856C5);
    const colorEmerald = new THREE.Color(0x12B76A);

    for (let i = 0; i < pointsCount; i++) {
      const phi = Math.acos(-1 + (2 * i) / pointsCount);
      const theta = Math.sqrt(pointsCount * Math.PI) * phi;

      const r = sphereRadius + 0.02;
      const x = r * Math.cos(theta) * Math.sin(phi);
      const y = r * Math.sin(theta) * Math.sin(phi);
      const z = r * Math.cos(phi);

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      // Color variation across nodes
      const rand = Math.random();
      const nodeColor = rand > 0.8 ? colorEmerald : rand > 0.4 ? colorCyan : colorBrand;
      colors[i * 3] = nodeColor.r;
      colors[i * 3 + 1] = nodeColor.g;
      colors[i * 3 + 2] = nodeColor.b;
    }

    pointsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    pointsGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const pointsMaterial = new THREE.PointsMaterial({
      size: 0.038,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
    });
    const globePoints = new THREE.Points(pointsGeometry, pointsMaterial);
    globeGroup.add(globePoints);

    // 7. Atmospheric Glow Layer
    const atmosphereGeometry = new THREE.SphereGeometry(sphereRadius + 0.12, 32, 32);
    const atmosphereMaterial = new THREE.MeshBasicMaterial({
      color: 0x356AE6,
      transparent: true,
      opacity: 0.08,
      side: THREE.BackSide,
    });
    const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    globeGroup.add(atmosphere);

    // 8. Orbital Ring 1 (Equatorial tilt)
    const ringGeometry1 = new THREE.RingGeometry(2.1, 2.14, 64);
    const ringMaterial1 = new THREE.MeshBasicMaterial({
      color: 0x356AE6,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.45,
    });
    const ring1 = new THREE.Mesh(ringGeometry1, ringMaterial1);
    ring1.rotation.x = Math.PI / 2.5;
    globeGroup.add(ring1);

    // 9. Orbital Ring 2 (Polar tilt)
    const ringGeometry2 = new THREE.RingGeometry(2.35, 2.38, 64);
    const ringMaterial2 = new THREE.MeshBasicMaterial({
      color: 0x12B76A,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.3,
    });
    const ring2 = new THREE.Mesh(ringGeometry2, ringMaterial2);
    ring2.rotation.y = Math.PI / 3;
    globeGroup.add(ring2);

    // 10. Intelligent Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const directionalLight1 = new THREE.DirectionalLight(0xffffff, 1.2);
    directionalLight1.position.set(5, 4, 6);
    scene.add(directionalLight1);

    const directionalLight2 = new THREE.DirectionalLight(0x356AE6, 0.8);
    directionalLight2.position.set(-5, -2, -3);
    scene.add(directionalLight2);

    setIsLoaded(true);

    // 11. Responsive Resize Handler
    const handleResize = () => {
      if (!container || !camera || !renderer) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // 12. Animation Loop
    const animate = () => {
      animFrameIdRef.current = requestAnimationFrame(animate);

      if (globeGroup) {
        if (isRotatingRef.current && !isDraggingRef.current) {
          globeGroup.rotation.y += rotationSpeed;
          ring1.rotation.z += 0.002;
          ring2.rotation.z -= 0.0015;
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    // Cleanup resources correctly on unmount
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

  // Pointer Interaction Handlers (Mouse & Touch)
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
      -Math.PI / 4,
      Math.min(Math.PI / 4, globeGroupRef.current.rotation.x + deltaY * 0.006)
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
      ref={containerRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onWheel={onWheel}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      className={`relative w-full h-full min-h-[300px] touch-none cursor-grab active:cursor-grabbing select-none overflow-hidden ${className}`}
      role="region"
      aria-label="Interactive 3D Multimodal Intelligence Globe"
    >
      {!isLoaded && <SceneLoadingFallback />}
    </div>
  );
});

InteractiveGlobe.displayName = 'InteractiveGlobe';
