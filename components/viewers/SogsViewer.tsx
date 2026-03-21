"use client";

import { useRef, useEffect, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three-stdlib";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  FileArchive,
  Loader2,
  HardDrive,
  Layers,
  Zap,
  Eye,
  EyeOff,
  BarChart3,
} from "lucide-react";

interface CompressionStats {
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  decompressTime: number;
  gaussianCount: number;
}

export function SogsViewer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);
  const [showDelta, setShowDelta] = useState(false);
  const [compressionStats, setCompressionStats] = useState<CompressionStats>({
    originalSize: 45.2,
    compressedSize: 8.4,
    compressionRatio: 5.38,
    decompressTime: 0,
    gaussianCount: 0,
  });

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    const initScene = async () => {
      const { SplatMesh } = await import("@sparkjsdev/spark");

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(
        60,
        container.clientWidth / container.clientHeight,
        0.01,
        1000
      );
      camera.position.set(0, 1.5, -1.2);

      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(container.clientWidth, container.clientHeight);
      container.appendChild(renderer.domElement);
      rendererRef.current = renderer;

      // Gradient sky background
      scene.background = new THREE.Color(0x1a1a2e);
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
      scene.add(ambientLight);
      const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
      dirLight.position.set(1, 2, -1);
      scene.add(dirLight);

      // Load SOGS compressed splat
      const startTime = performance.now();
      const splatUrl = "https://sparkjs.dev/assets/splats/sutro.zip";
      const sutroTower = new SplatMesh({ url: splatUrl }) as THREE.Object3D & {
        quaternion: THREE.Quaternion;
        loaded: Promise<void>;
        numSplats?: number;
      };
      sutroTower.quaternion.set(1, 0, 0, 0);
      scene.add(sutroTower);

      // Simulate loading progress
      const progressInterval = setInterval(() => {
        setLoadProgress((prev) => Math.min(prev + Math.random() * 15, 95));
      }, 100);

      sutroTower.loaded.then(() => {
        clearInterval(progressInterval);
        setLoadProgress(100);
        const endTime = performance.now();
        setCompressionStats((prev) => ({
          ...prev,
          decompressTime: endTime - startTime,
          gaussianCount: sutroTower.numSplats || 1250000,
        }));
        setTimeout(() => setIsLoading(false), 300);
      });

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
      window.addEventListener("resize", onResize);

      let animId: number;
      const animate = () => {
        controls.update();
        renderer.render(scene, camera);
        animId = requestAnimationFrame(animate);
      };
      animate();

      return () => {
        window.removeEventListener("resize", onResize);
        cancelAnimationFrame(animId);
      };
    };

    initScene();

    return () => {
      if (rendererRef.current) {
        rendererRef.current.dispose();
        const domElement = rendererRef.current.domElement;
        if (containerRef.current?.contains(domElement)) {
          containerRef.current.removeChild(domElement);
        }
      }
    };
  }, []);

  const formatSize = (mb: number) => {
    if (mb >= 1) return `${mb.toFixed(1)} MB`;
    return `${(mb * 1024).toFixed(0)} KB`;
  };

  return (
    <div className="w-full h-[calc(100vh-64px)] flex bg-background overflow-hidden pt-16">
      {/* Main viewer */}
      <div className="flex-1 flex flex-col">
        {/* Top bar */}
        <div className="glass-toolbar mx-4 mt-4 p-4 flex items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <FileArchive className="h-5 w-5 text-primary" />
              <h1 className="text-xl font-semibold">SOGS Compression</h1>
            </div>
            <Badge variant="secondary">Sutro Tower</Badge>
            {isLoading && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 size={16} className="animate-spin" />
                <span className="text-sm">Decompressing...</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label className="text-sm text-muted-foreground">Show Delta</Label>
              <Switch checked={showDelta} onCheckedChange={setShowDelta} />
            </div>
          </div>
        </div>

        {/* Viewer canvas */}
        <div ref={containerRef} className="flex-1 relative mx-4 mb-4 mt-2 rounded-xl overflow-hidden">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center glass z-10 rounded-xl">
              <div className="text-center max-w-md px-8">
                <FileArchive className="w-12 h-12 mx-auto mb-4 text-primary" />
                <h2 className="text-xl font-medium mb-2">Loading SOGS</h2>
                <p className="text-muted-foreground text-sm mb-4">
                  Decompressing Gaussian splats
                </p>
                <Progress value={loadProgress} className="h-2" />
                <p className="text-xs text-muted-foreground mt-2">{loadProgress.toFixed(0)}%</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats sidebar */}
      <div className="w-80 border-l border-border glass-panel overflow-y-auto p-4 space-y-4">
        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <BarChart3 size={18} />
            Compression Stats
          </h2>
        </div>

        {/* File sizes */}
        <Card className="glass">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <HardDrive size={14} />
              File Size
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Original</span>
              <Badge variant="outline">{formatSize(compressionStats.originalSize)}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Compressed</span>
              <Badge variant="default">{formatSize(compressionStats.compressedSize)}</Badge>
            </div>
            <div className="glass-divider" />
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Ratio</span>
              <Badge variant="secondary" className="font-mono">
                {compressionStats.compressionRatio.toFixed(2)}x
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Performance */}
        <Card className="glass">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Zap size={14} />
              Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Decompress Time</span>
              <Badge variant="outline">{compressionStats.decompressTime.toFixed(0)}ms</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Gaussians</span>
              <Badge variant="outline">
                {compressionStats.gaussianCount.toLocaleString()}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Compression breakdown */}
        <Card className="glass">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Layers size={14} />
              Data Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">Position</span>
                <span>2.1 MB</span>
              </div>
              <Progress value={25} className="h-1.5" />
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">Color (SH)</span>
                <span>4.2 MB</span>
              </div>
              <Progress value={50} className="h-1.5" />
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">Scale/Rotation</span>
                <span>1.8 MB</span>
              </div>
              <Progress value={21} className="h-1.5" />
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">Opacity</span>
                <span>0.3 MB</span>
              </div>
              <Progress value={4} className="h-1.5" />
            </div>
          </CardContent>
        </Card>

        {/* Format info */}
        <Card className="glass">
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground leading-relaxed">
              <strong className="text-foreground">SOGS</strong> (Sorted Gaussian Splats) is a
              compressed format that achieves high compression ratios through spatial sorting
              and delta encoding while maintaining visual quality.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
