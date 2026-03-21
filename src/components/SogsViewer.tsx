import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three-stdlib';
import { SplatMesh } from '@sparkjsdev/spark';
import { Label } from '@/components/ui/label';

export const SogsViewer: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.01, 1000);
    camera.position.set(0, 1.5, -1.2);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    // Load SOGS compressed splat
    const splatUrl = 'https://sparkjs.dev/assets/splats/sutro.zip';
    const sutroTower = new SplatMesh({ url: splatUrl }) as any;
    sutroTower.quaternion.set(1, 0, 0, 0);
    scene.add(sutroTower);
    sutroTower.loaded.then(() => setIsLoading(false));

    // Sky
    // three-stdlib may not have Sky, so we use a gradient background instead
    scene.background = new THREE.Color(0x87ceeb);
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(1, 2, -1);
    scene.add(dirLight);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 1.5, 0);
    controls.minDistance = 0.2;
    controls.maxDistance = 8.0;
    controls.enablePan = false;
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;

    const onResize = () => {
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', onResize);

    let animId: number;
    const animate = () => {
      controls.update();
      renderer.render(scene, camera);
      animId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(animId);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="w-full h-screen flex flex-col bg-background relative overflow-hidden">
      {/* Controls bar */}
      <div className="glass-container glass-container--toolbar border-b border-white/20 dark:border-black/20 relative z-10">
        <div className="glass-filter"></div>
        <div className="glass-overlay"></div>
        <div className="glass-specular"></div>
        <div className="glass-content glass-content--toolbar">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-light tracking-tight bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 dark:from-slate-100 dark:via-slate-300 dark:to-slate-100 bg-clip-text text-transparent">
              SOGS
            </h1>
            <div className="h-6 w-px bg-gradient-to-b from-transparent via-slate-300 to-transparent dark:via-slate-600" />
            <span className="text-sm text-slate-600 dark:text-slate-400 font-light">
              compressed gaussian splat format
            </span>
            {isLoading && (
              <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 ml-6">
                <div className="w-4 h-4 border border-current border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm font-light">loading...</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            <Label className="text-sm font-light text-slate-600 dark:text-slate-400">
              sutro tower • .sog compressed
            </Label>
          </div>
        </div>

        <svg className="glass-svg-filters">
          <filter id="lg-dist-sogs" x="0%" y="0%" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.008 0.008" numOctaves="2" seed="92" result="noise" />
            <feGaussianBlur in="noise" stdDeviation="2" result="blurred" />
            <feDisplacementMap in="SourceGraphic" in2="blurred" scale="70" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </svg>
      </div>

      {/* Viewer */}
      <div ref={containerRef} className="flex-1 relative" style={{ touchAction: 'none' }}>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center backdrop-blur-md bg-white/30 dark:bg-black/30 z-10">
            <div className="glass-panel p-8 text-center rounded-2xl">
              <div className="w-12 h-12 border-2 border-slate-600 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
              <h2 className="text-2xl font-medium mb-2 bg-gradient-to-r from-slate-900 to-slate-600 dark:from-slate-100 dark:to-slate-400 bg-clip-text text-transparent">
                loading SOGS
              </h2>
              <p className="text-slate-600 dark:text-slate-400 text-sm">
                decompressing gaussian splats
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
