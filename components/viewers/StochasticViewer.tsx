"use client";

import { useRef, useEffect, useState } from "react";
import * as THREE from "three";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Shuffle, Loader2, Activity, Zap, Clock } from "lucide-react";

export function StochasticViewer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sparkRef = useRef<unknown>(null);
  const animationRef = useRef<number | null>(null);
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());

  const [isLoading, setIsLoading] = useState(true);
  const [stochasticEnabled, setStochasticEnabled] = useState(true);
  const [maxStdDev, setMaxStdDev] = useState(Math.sqrt(5));
  const [sampleRate, setSampleRate] = useState(100);
  const [fps, setFps] = useState(0);
  const [renderTime, setRenderTime] = useState(0);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    const initScene = async () => {
      const { SparkRenderer, SplatMesh, SparkControls } = await import("@sparkjsdev/spark");

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(
        60,
        container.clientWidth / container.clientHeight,
        0.1,
        1000
      );

      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(container.clientWidth, container.clientHeight);
      container.appendChild(renderer.domElement);
      rendererRef.current = renderer;

      const localFrame = new THREE.Group();
      scene.add(localFrame);

      const spark = new SparkRenderer({ renderer, maxStdDev: Math.sqrt(5) } as unknown);
      (spark as { defaultView: { stochastic: boolean } }).defaultView.stochastic = true;
      sparkRef.current = spark;
      localFrame.add(spark as THREE.Object3D);
      localFrame.add(camera);

      const splatUrl = "https://sparkjs.dev/assets/splats/valley.spz";
      const background = new SplatMesh({ url: splatUrl }) as THREE.Object3D & {
        quaternion: THREE.Quaternion;
        loaded: Promise<void>;
      };
      background.quaternion.set(1, 0, 0, 0);
      background.scale.setScalar(0.5);
      scene.add(background);

      background.loaded.then(() => setIsLoading(false));

      const controls = new SparkControls({ canvas: renderer.domElement } as unknown);
      let lastCameraPos = new THREE.Vector3(0, 0, 0);

      const onResize = () => {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
      };
      window.addEventListener("resize", onResize);

      const animate = () => {
        const startTime = performance.now();

        (controls as { update: (frame: THREE.Object3D) => void }).update(localFrame);

        if (lastCameraPos.distanceTo(camera.position) > 0.5) {
          localFrame.position.copy(camera.position).multiplyScalar(-1);
        }
        lastCameraPos.copy(camera.position);

        renderer.render(scene, camera);

        // Performance metrics
        const endTime = performance.now();
        setRenderTime(endTime - startTime);

        frameCountRef.current++;
        if (endTime - lastTimeRef.current >= 1000) {
          setFps(frameCountRef.current);
          frameCountRef.current = 0;
          lastTimeRef.current = endTime;
        }

        animationRef.current = requestAnimationFrame(animate);
      };
      animate();

      return () => {
        window.removeEventListener("resize", onResize);
      };
    };

    initScene();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (rendererRef.current) {
        rendererRef.current.dispose();
        const domElement = rendererRef.current.domElement;
        if (containerRef.current?.contains(domElement)) {
          containerRef.current.removeChild(domElement);
        }
      }
    };
  }, []);

  const handleStochasticToggle = (enabled: boolean) => {
    setStochasticEnabled(enabled);
    if (sparkRef.current) {
      (sparkRef.current as { defaultView: { stochastic: boolean } }).defaultView.stochastic = enabled;
    }
  };

  const handleMaxStdDevChange = (value: number[]) => {
    setMaxStdDev(value[0]);
  };

  return (
    <div className="w-full h-[calc(100vh-64px)] flex flex-col bg-background relative overflow-hidden pt-16">
      {/* Controls bar */}
      <div className="glass-toolbar mx-4 mt-4 p-4 flex flex-wrap items-center justify-between gap-4 relative z-10">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Shuffle className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-semibold">Stochastic Rendering</h1>
          </div>
          <span className="text-sm text-muted-foreground hidden sm:inline">
            Probabilistic splat sorting
          </span>
          {isLoading && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 size={16} className="animate-spin" />
              <span className="text-sm">Loading...</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Label className="text-sm text-muted-foreground">Stochastic</Label>
            <Switch checked={stochasticEnabled} onCheckedChange={handleStochasticToggle} />
          </div>

          <div className="flex items-center gap-2">
            <Label className="text-sm text-muted-foreground">Max Std Dev</Label>
            <Slider
              value={[maxStdDev]}
              onValueChange={handleMaxStdDevChange}
              min={1}
              max={5}
              step={0.1}
              className="w-24"
            />
            <span className="text-xs font-mono text-muted-foreground w-8">
              {maxStdDev.toFixed(1)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Label className="text-sm text-muted-foreground">Sample Rate</Label>
            <Slider
              value={[sampleRate]}
              onValueChange={([v]) => setSampleRate(v)}
              min={10}
              max={100}
              step={10}
              className="w-24"
            />
            <span className="text-xs font-mono text-muted-foreground w-10">
              {sampleRate}%
            </span>
          </div>
        </div>
      </div>

      {/* Performance metrics */}
      <div className="mx-4 mt-2 flex gap-2">
        <Card className="glass">
          <CardContent className="p-3 flex items-center gap-2">
            <Activity size={14} className="text-primary" />
            <span className="text-xs text-muted-foreground">FPS:</span>
            <Badge variant={fps > 50 ? "default" : fps > 30 ? "secondary" : "destructive"}>
              {fps}
            </Badge>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardContent className="p-3 flex items-center gap-2">
            <Clock size={14} className="text-primary" />
            <span className="text-xs text-muted-foreground">Render:</span>
            <Badge variant="secondary">{renderTime.toFixed(1)}ms</Badge>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardContent className="p-3 flex items-center gap-2">
            <Zap size={14} className="text-primary" />
            <span className="text-xs text-muted-foreground">Mode:</span>
            <Badge variant={stochasticEnabled ? "default" : "outline"}>
              {stochasticEnabled ? "Stochastic" : "Standard"}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Viewer canvas */}
      <div ref={containerRef} className="flex-1 relative mx-4 mb-4 mt-2 rounded-xl overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center glass z-10 rounded-xl">
            <div className="text-center">
              <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
              <h2 className="text-xl font-medium mb-2">Loading Scene</h2>
              <p className="text-muted-foreground text-sm">
                Preparing stochastic renderer
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
