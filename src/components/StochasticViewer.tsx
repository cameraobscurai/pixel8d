import React, { useRef, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import * as THREE from 'three';
import { SparkRenderer, SplatMesh, SparkControls } from '@sparkjsdev/spark';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { ArrowLeft } from 'lucide-react';
import { fetchCaptureSplatUrl } from '@/lib/luma';

interface StochasticViewerProps {
  captureId: string;
}

export const StochasticViewer: React.FC<StochasticViewerProps> = ({ captureId }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sparkRef = useRef<any>(null);
  const animationRef = useRef<number | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stochasticEnabled, setStochasticEnabled] = useState(true);
  const [maxStdDev, setMaxStdDev] = useState(Math.sqrt(5));

  useEffect(() => {
    if (!containerRef.current) return;

    let cancelled = false;
    const container = containerRef.current;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const localFrame = new THREE.Group();
    scene.add(localFrame);

    const spark = new SparkRenderer({ renderer, maxStdDev: Math.sqrt(5) } as any);
    (spark as any).defaultView.stochastic = true;
    sparkRef.current = spark;
    localFrame.add(spark as any);
    localFrame.add(camera);

    const controls = new SparkControls({ canvas: renderer.domElement } as any);
    const lastCameraPos = new THREE.Vector3(0, 0, 0);
    let background: any = null;

    const onResize = () => {
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', onResize);

    const animate = () => {
      (controls as any).update(localFrame);

      if (lastCameraPos.distanceTo(camera.position) > 0.5) {
        localFrame.position.copy(camera.position).multiplyScalar(-1);
      }
      lastCameraPos.copy(camera.position);

      renderer.render(scene, camera);
      animationRef.current = requestAnimationFrame(animate);
    };

    const load = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const splatUrl = await fetchCaptureSplatUrl(captureId);
        background = new SplatMesh({ url: splatUrl }) as any;
        background.quaternion.set(1, 0, 0, 0);
        scene.add(background);
        await background.loaded;
        if (!cancelled) setIsLoading(false);
      } catch (loadError) {
        console.error('Stochastic viewer failed:', loadError);
        if (!cancelled) {
          setError('Failed to load stochastic renderer.');
          setIsLoading(false);
        }
      }
    };

    animate();
    load();

    return () => {
      cancelled = true;
      window.removeEventListener('resize', onResize);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (background) scene.remove(background);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [captureId]);

  const handleStochasticToggle = (enabled: boolean) => {
    setStochasticEnabled(enabled);
    if (sparkRef.current) {
      (sparkRef.current as any).defaultView.stochastic = enabled;
    }
  };

  const handleMaxStdDevChange = (value: number[]) => {
    setMaxStdDev(value[0]);
    if (sparkRef.current) {
      sparkRef.current.maxStdDev = value[0];
    }
  };

  return (
    <div className="w-full h-screen flex flex-col bg-background relative overflow-hidden">
      <div className="glass-container glass-container--toolbar border-b border-white/20 dark:border-black/20 relative z-10">
        <div className="glass-filter"></div>
        <div className="glass-overlay"></div>
        <div className="glass-specular"></div>
        <div className="glass-content glass-content--toolbar">
          <div className="flex items-center gap-4">
            <Link to={`/?capture=${captureId}`}>
              <Button variant="ghost" size="sm"><ArrowLeft size={14} /></Button>
            </Link>
            <h1 className="text-3xl font-light tracking-tight bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 dark:from-slate-100 dark:via-slate-300 dark:to-slate-100 bg-clip-text text-transparent">
              stochastic sorting
            </h1>
            <div className="h-6 w-px bg-gradient-to-b from-transparent via-slate-300 to-transparent dark:via-slate-600" />
            <span className="text-sm text-slate-600 dark:text-slate-400 font-light">
              current capture • probabilistic splat rendering
            </span>
            {isLoading && (
              <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 ml-6">
                <div className="w-4 h-4 border border-current border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm font-light">loading...</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-light text-slate-600 dark:text-slate-400">stochastic</Label>
              <Switch
                checked={stochasticEnabled}
                onCheckedChange={handleStochasticToggle}
                className="glass-switch"
              />
            </div>

            <div className="flex items-center gap-2">
              <Label className="text-sm font-light text-slate-600 dark:text-slate-400">max std dev</Label>
              <div className="w-28">
                <Slider
                  value={[maxStdDev]}
                  onValueChange={handleMaxStdDevChange}
                  min={1}
                  max={5}
                  step={0.1}
                  className="glass-slider"
                />
              </div>
              <span className="text-xs font-mono text-slate-500 dark:text-slate-500 w-8">
                {maxStdDev.toFixed(1)}
              </span>
            </div>
          </div>
        </div>

        <svg className="glass-svg-filters">
          <filter id="lg-dist-stoch" x="0%" y="0%" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.008 0.008" numOctaves="2" seed="92" result="noise" />
            <feGaussianBlur in="noise" stdDeviation="2" result="blurred" />
            <feDisplacementMap in="SourceGraphic" in2="blurred" scale="70" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </svg>
      </div>

      <div ref={containerRef} className="flex-1 relative" style={{ touchAction: 'none' }}>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center backdrop-blur-md bg-white/30 dark:bg-black/30 z-10">
            <div className="glass-panel p-8 text-center rounded-2xl">
              <div className="w-12 h-12 border-2 border-slate-600 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
              <h2 className="text-2xl font-medium mb-2 bg-gradient-to-r from-slate-900 to-slate-600 dark:from-slate-100 dark:to-slate-400 bg-clip-text text-transparent">
                loading scene
              </h2>
              <p className="text-slate-600 dark:text-slate-400 text-sm">
                preparing stochastic renderer
              </p>
            </div>
          </div>
        )}

        {error && !isLoading && (
          <div className="absolute inset-0 flex items-center justify-center backdrop-blur-md bg-white/30 dark:bg-black/30 z-10">
            <div className="glass-panel p-8 text-center rounded-2xl max-w-md">
              <h2 className="text-xl font-medium mb-2 text-foreground">{error}</h2>
              <p className="text-muted-foreground text-sm">Spark could not initialize the selected capture.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
