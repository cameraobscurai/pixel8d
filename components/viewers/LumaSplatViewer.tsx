"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import {
  WebGLRenderer,
  PerspectiveCamera,
  Scene,
  Vector3,
  MathUtils,
  FogExp2,
  Color,
} from "three";
import { OrbitControls } from "three-stdlib";
import { ViewerToolbar } from "./ViewerToolbar";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, RotateCcw } from "lucide-react";

interface CameraState {
  position: { x: number; y: number; z: number };
  rotation: { roll: number; pitch: number; yaw: number };
  focalLength: number;
}

interface CameraPreset {
  name: string;
  position: { x: number; y: number; z: number };
  rotation: { roll: number; pitch: number; yaw: number };
  focalLength: number;
}

interface LumaSplatViewerProps {
  captureSource?: string;
  className?: string;
  showToolbar?: boolean;
}

const INITIAL_CAMERA_STATE: CameraState = {
  position: { x: -2.76, y: 0.03, z: -2.25 },
  rotation: { roll: -179.35, pitch: -179.16, yaw: -50.84 },
  focalLength: 20.1,
};

const RESET_CAMERA_PRESET: CameraPreset = {
  name: "Reset",
  ...INITIAL_CAMERA_STATE,
};

const CAMERA_PRESETS: CameraPreset[] = [
  { name: "Front", position: { x: 0, y: 0, z: 3 }, rotation: { roll: 0, pitch: 0, yaw: 0 }, focalLength: 35 },
  { name: "Side", position: { x: 3, y: 0, z: 0 }, rotation: { roll: 0, pitch: 0, yaw: 90 }, focalLength: 35 },
  { name: "Top", position: { x: 0, y: 3, z: 0 }, rotation: { roll: 0, pitch: -90, yaw: 0 }, focalLength: 35 },
  { name: "Perspective", position: { x: 2, y: 1, z: 2 }, rotation: { roll: 0, pitch: -15, yaw: 45 }, focalLength: 28 },
];

const QUALITY_PRESETS = {
  ultra: { pixelRatio: 2, antialias: true, dampingFactor: 0.05 },
  high: { pixelRatio: 1.5, antialias: true, dampingFactor: 0.1 },
  medium: { pixelRatio: 1, antialias: false, dampingFactor: 0.15 },
  low: { pixelRatio: 0.75, antialias: false, dampingFactor: 0.2 },
};

export function LumaSplatViewer({
  captureSource = "https://lumalabs.ai/capture/e769d12e-a0ac-4338-93bd-a82f078e0efc",
  className = "",
  showToolbar = true,
}: LumaSplatViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<WebGLRenderer | null>(null);
  const sceneRef = useRef<Scene | null>(null);
  const cameraRef = useRef<PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const splatsRef = useRef<unknown>(null);
  const animationIdRef = useRef<number>();
  const hasInitializedRef = useRef(false);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [qualityPreset, setQualityPreset] = useState<keyof typeof QUALITY_PRESETS>("high");
  const [autoRotate, setAutoRotate] = useState(false);

  const calculateFOVFromFocalLength = useCallback((focalLength: number) => {
    const sensorHeight = 24;
    const fov = 2 * Math.atan(sensorHeight / (2 * focalLength)) * (180 / Math.PI);
    return Math.max(10, Math.min(120, fov));
  }, []);

  const getContainerDimensions = useCallback(() => {
    const container = canvasRef.current?.parentElement;
    if (container) {
      const width = container.clientWidth;
      const height = container.clientHeight;
      const aspectRatio = width / height;
      if (isFinite(aspectRatio) && aspectRatio > 0) {
        return { width, height, aspectRatio };
      }
    }
    return { width: 1920, height: 1080, aspectRatio: 16 / 9 };
  }, []);

  const animateToPreset = useCallback((preset: CameraPreset) => {
    if (!cameraRef.current || !controlsRef.current) return;

    const camera = cameraRef.current;
    const controls = controlsRef.current;
    const startPos = camera.position.clone();
    const startFov = camera.fov;
    const targetFov = calculateFOVFromFocalLength(preset.focalLength);
    const duration = 1000;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);

      camera.position.lerpVectors(
        startPos,
        new Vector3(preset.position.x, preset.position.y, preset.position.z),
        easeProgress
      );
      camera.fov = startFov + (targetFov - startFov) * easeProgress;
      camera.updateProjectionMatrix();
      controls.update();

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [calculateFOVFromFocalLength]);

  const resetCamera = useCallback(() => {
    animateToPreset(RESET_CAMERA_PRESET);
  }, [animateToPreset]);

  useEffect(() => {
    const initViewer = async () => {
      if (!canvasRef.current) return;

      try {
        const { width, height, aspectRatio } = getContainerDimensions();
        const { LumaSplatsThree } = await import("@lumaai/luma-web");

        const qualitySettings = QUALITY_PRESETS[qualityPreset];
        const renderer = new WebGLRenderer({
          canvas: canvasRef.current,
          antialias: qualitySettings.antialias,
          alpha: true,
          powerPreference: "high-performance",
          preserveDrawingBuffer: true,
        });

        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, qualitySettings.pixelRatio));

        const scene = new Scene();
        scene.fog = new FogExp2(new Color(0xe0e1ff), 0.02);

        const camera = new PerspectiveCamera(75, aspectRatio, 0.1, 1000);
        camera.position.set(
          INITIAL_CAMERA_STATE.position.x,
          INITIAL_CAMERA_STATE.position.y,
          INITIAL_CAMERA_STATE.position.z
        );
        camera.rotation.set(
          MathUtils.degToRad(INITIAL_CAMERA_STATE.rotation.pitch),
          MathUtils.degToRad(INITIAL_CAMERA_STATE.rotation.yaw),
          MathUtils.degToRad(INITIAL_CAMERA_STATE.rotation.roll)
        );
        const initialFOV = calculateFOVFromFocalLength(INITIAL_CAMERA_STATE.focalLength);
        camera.fov = initialFOV;
        camera.updateProjectionMatrix();

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = qualitySettings.dampingFactor;
        controls.screenSpacePanning = false;
        controls.minDistance = 0.5;
        controls.maxDistance = 15;
        controls.maxPolarAngle = Math.PI;
        controls.minPolarAngle = 0;
        controls.enablePan = true;
        controls.panSpeed = 0.8;
        controls.rotateSpeed = 0.5;
        controls.zoomSpeed = 0.8;
        controls.target.set(0, 0, 0);
        controls.update();

        // Clear previous splats
        if (splatsRef.current && sceneRef.current) {
          sceneRef.current.remove(splatsRef.current as THREE.Object3D);
        }

        // Load Luma Splats directly (no iframe)
        const splats = new LumaSplatsThree({
          source: captureSource,
          particleRevealEnabled: true,
          enableThreeShaderIntegration: false,
          loadingAnimationEnabled: true,
        });

        splats.onLoad = () => {
          setIsLoading(false);
          try {
            splats.captureCubemap(renderer).then((texture: unknown) => {
              if (texture) {
                scene.environment = texture as THREE.Texture;
              }
            }).catch(() => {});
          } catch {}
        };

        scene.add(splats);

        rendererRef.current = renderer;
        sceneRef.current = scene;
        cameraRef.current = camera;
        controlsRef.current = controls;
        splatsRef.current = splats;

        setTimeout(() => {
          hasInitializedRef.current = true;
        }, 200);

        const animate = () => {
          if (rendererRef.current && sceneRef.current && controlsRef.current && cameraRef.current) {
            if (autoRotate && controlsRef.current) {
              controlsRef.current.autoRotate = true;
              controlsRef.current.autoRotateSpeed = 0.5;
            } else if (controlsRef.current) {
              controlsRef.current.autoRotate = false;
            }
            controlsRef.current.update();
            rendererRef.current.render(sceneRef.current, cameraRef.current);
          }
          animationIdRef.current = requestAnimationFrame(animate);
        };
        animate();

        const handleResize = () => {
          const { width, height, aspectRatio } = getContainerDimensions();
          renderer.setSize(width, height);
          if (cameraRef.current) {
            cameraRef.current.aspect = aspectRatio;
            cameraRef.current.updateProjectionMatrix();
          }
        };
        window.addEventListener("resize", handleResize);

        return () => {
          window.removeEventListener("resize", handleResize);
        };
      } catch (err) {
        console.error("Failed to initialize viewer:", err);
        setError("Failed to initialize 3D viewer. Please check your connection.");
        setIsLoading(false);
      }
    };

    setIsLoading(true);
    setError(null);
    initViewer();

    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      if (controlsRef.current) {
        controlsRef.current.dispose();
      }
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
    };
  }, [captureSource, qualityPreset, autoRotate, calculateFOVFromFocalLength, getContainerDimensions]);

  return (
    <div className={`viewer-container ${className}`}>
      {/* Background grid */}
      <div className="absolute inset-0 opacity-10 grid-pattern pointer-events-none" />

      {/* Canvas */}
      <div className="canvas-wrapper">
        <canvas ref={canvasRef} className="w-full h-full" />
      </div>

      {/* Loading overlay */}
      {isLoading && (
        <div className="loading-overlay">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading Gaussian Splat...</p>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="loading-overlay">
          <div className="glass-card p-6 max-w-md text-center">
            <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-4" />
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </div>
        </div>
      )}

      {/* Toolbar */}
      {showToolbar && !isLoading && !error && (
        <ViewerToolbar
          qualityPreset={qualityPreset}
          onQualityChange={setQualityPreset}
          autoRotate={autoRotate}
          onAutoRotateChange={setAutoRotate}
          onResetCamera={resetCamera}
          cameraPresets={CAMERA_PRESETS}
          onPresetSelect={animateToPreset}
        />
      )}
    </div>
  );
}
