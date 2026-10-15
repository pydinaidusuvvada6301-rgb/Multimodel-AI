import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface AIVisualizationProps {
  isThinking?: boolean;
  className?: string;
}

export const AIVisualization: React.FC<AIVisualizationProps> = ({
  isThinking = false,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      return;
    }

    const width = container.clientWidth || 240;
    const height = container.clientHeight || 120;
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 50);
    camera.position.z = 4.5;

    // Node Lattice with Connecting Line Segments
    const nodesCount = 36;
    const nodePositions: THREE.Vector3[] = [];
    const geometry = new THREE.BufferGeometry();
    const posArray = new Float32Array(nodesCount * 3);

    for (let i = 0; i < nodesCount; i++) {
      const x = (Math.random() - 0.5) * 3;
      const y = (Math.random() - 0.5) * 1.8;
      const z = (Math.random() - 0.5) * 2;
      nodePositions.push(new THREE.Vector3(x, y, z));
      posArray[i * 3] = x;
      posArray[i * 3 + 1] = y;
      posArray[i * 3 + 2] = z;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

    // Nodes material
    const pointsMat = new THREE.PointsMaterial({
      color: 0x356AE6,
      size: 0.08,
      transparent: true,
      opacity: 0.9,
    });
    const points = new THREE.Points(geometry, pointsMat);
    scene.add(points);

    // Connecting lines between nearby nodes
    const lineIndices: number[] = [];
    for (let i = 0; i < nodesCount; i++) {
      for (let j = i + 1; j < nodesCount; j++) {
        if (nodePositions[i].distanceTo(nodePositions[j]) < 1.1) {
          lineIndices.push(i, j);
        }
      }
    }

    const linesGeometry = new THREE.BufferGeometry();
    linesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    linesGeometry.setIndex(lineIndices);

    const linesMat = new THREE.LineBasicMaterial({
      color: 0x356AE6,
      transparent: true,
      opacity: 0.28,
    });
    const lines = new THREE.LineSegments(linesGeometry, linesMat);
    scene.add(lines);

    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();
      const speed = isThinking ? 0.02 : 0.005;

      points.rotation.y += speed;
      lines.rotation.y += speed;

      if (isThinking) {
        pointsMat.size = 0.08 + Math.sin(elapsed * 6) * 0.03;
        linesMat.opacity = 0.4 + Math.sin(elapsed * 5) * 0.2;
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      geometry.dispose();
      pointsMat.dispose();
      linesGeometry.dispose();
      linesMat.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [isThinking]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full min-h-[100px] pointer-events-none ${className}`}
      aria-hidden="true"
    />
  );
};
