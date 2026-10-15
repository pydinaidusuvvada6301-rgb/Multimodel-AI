import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface Floating3DObjectsProps {
  className?: string;
}

export const Floating3DObjects: React.FC<Floating3DObjectsProps> = ({ className = '' }) => {
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

    const width = container.clientWidth || 300;
    const height = container.clientHeight || 200;
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 50);
    camera.position.z = 7;

    // Ambient & Directional Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0x356AE6, 2, 20);
    pointLight.position.set(2, 4, 5);
    scene.add(pointLight);

    // 4 Floating Multimodal Geometric Prisms
    // 1. Document: Faceted Blue Cube
    const docGeo = new THREE.BoxGeometry(0.9, 1.2, 0.2);
    const docMat = new THREE.MeshPhongMaterial({
      color: 0xEEF4FF,
      emissive: 0x356AE6,
      emissiveIntensity: 0.25,
      transparent: true,
      opacity: 0.9,
    });
    const docMesh = new THREE.Mesh(docGeo, docMat);
    docMesh.position.set(-2.2, 0.4, 0);
    scene.add(docMesh);

    // 2. Image: Octahedron
    const imgGeo = new THREE.OctahedronGeometry(0.7, 0);
    const imgMat = new THREE.MeshPhongMaterial({
      color: 0xE0F2FE,
      emissive: 0x0284C7,
      emissiveIntensity: 0.3,
      transparent: true,
      opacity: 0.9,
    });
    const imgMesh = new THREE.Mesh(imgGeo, imgMat);
    imgMesh.position.set(-0.7, -0.6, 0.5);
    scene.add(imgMesh);

    // 3. Audio: Torus Soundwave Ring
    const audioGeo = new THREE.TorusGeometry(0.65, 0.18, 16, 48);
    const audioMat = new THREE.MeshPhongMaterial({
      color: 0xECFDF5,
      emissive: 0x12B76A,
      emissiveIntensity: 0.35,
      transparent: true,
      opacity: 0.9,
    });
    const audioMesh = new THREE.Mesh(audioGeo, audioMat);
    audioMesh.position.set(0.9, 0.7, -0.2);
    scene.add(audioMesh);

    // 4. Video: Icosahedron
    const vidGeo = new THREE.IcosahedronGeometry(0.75, 0);
    const vidMat = new THREE.MeshPhongMaterial({
      color: 0xFAF5FF,
      emissive: 0x7C3AED,
      emissiveIntensity: 0.25,
      transparent: true,
      opacity: 0.88,
    });
    const vidMesh = new THREE.Mesh(vidGeo, vidMat);
    vidMesh.position.set(2.3, -0.3, 0.2);
    scene.add(vidMesh);

    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Harmonic floating animation
      docMesh.position.y = 0.4 + Math.sin(elapsed * 1.5) * 0.15;
      docMesh.rotation.x += 0.008;
      docMesh.rotation.y += 0.01;

      imgMesh.position.y = -0.6 + Math.cos(elapsed * 1.8) * 0.12;
      imgMesh.rotation.x += 0.012;
      imgMesh.rotation.z += 0.009;

      audioMesh.position.y = 0.7 + Math.sin(elapsed * 1.6 + 1) * 0.14;
      audioMesh.rotation.x += 0.01;
      audioMesh.rotation.y += 0.015;

      vidMesh.position.y = -0.3 + Math.cos(elapsed * 1.4 + 2) * 0.16;
      vidMesh.rotation.y += 0.009;
      vidMesh.rotation.z += 0.011;

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      docGeo.dispose();
      docMat.dispose();
      imgGeo.dispose();
      imgMat.dispose();
      audioGeo.dispose();
      audioMat.dispose();
      vidGeo.dispose();
      vidMat.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full min-h-[160px] pointer-events-none ${className}`}
      aria-hidden="true"
    />
  );
};
