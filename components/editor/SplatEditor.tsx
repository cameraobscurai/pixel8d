"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import * as THREE from "three";
import { OrbitControls } from "three-stdlib";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  FolderOpen,
  Link as LinkIcon,
  Download,
  RotateCcw,
  Scissors,
  Bug,
  Camera,
  Trash2,
  Loader2,
  Move,
  Box,
} from "lucide-react";

interface LoadedSplat {
  id: string;
  fileName: string;
  mesh: THREE.Object3D & { opacity?: number; maxSh?: number; updateGenerator?: () => void };
  fileBytes?: Uint8Array;
  pathOrUrl: string;
}

export function SplatEditor() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const frameRef = useRef<THREE.Group | null>(null);
  const orbitControlsRef = useRef<OrbitControls | null>(null);
  const animationRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sparkRef = useRef<unknown>(null);
  const sparkControlsRef = useRef<unknown>(null);
  const gridRef = useRef<unknown>(null);

  // Dyno refs for clip planes
  const clipEnableRef = useRef<{ value: boolean }>({ value: false });
  const clipMinXRef = useRef<{ value: number }>({ value: -5 });
  const clipMaxXRef = useRef<{ value: number }>({ value: 5 });
  const clipMinYRef = useRef<{ value: number }>({ value: -5 });
  const clipMaxYRef = useRef<{ value: number }>({ value: 5 });
  const clipMinZRef = useRef<{ value: number }>({ value: -5 });
  const clipMaxZRef = useRef<{ value: number }>({ value: 5 });
  const normalColorRef = useRef<{ value: boolean }>({ value: false });

  const [loadedSplats, setLoadedSplats] = useState<LoadedSplat[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);

  // Camera & controls state
  const [useOrbit, setUseOrbit] = useState(false);
  const [autoRotate, setAutoRotate] = useState(false);
  const [openCv, setOpenCv] = useState(true);
  const [bgColor, setBgColor] = useState("#0a0a0f");
  const [gridOpacity, setGridOpacity] = useState(0);
  const [resetOnLoad, setResetOnLoad] = useState(true);

  // Clip state
  const [clipEnabled, setClipEnabled] = useState(false);
  const [clipMinX, setClipMinX] = useState(-5);
  const [clipMaxX, setClipMaxX] = useState(5);
  const [clipMinY, setClipMinY] = useState(-5);
  const [clipMaxY, setClipMaxY] = useState(5);
  const [clipMinZ, setClipMinZ] = useState(-5);
  const [clipMaxZ, setClipMaxZ] = useState(5);

  // Debug state
  const [showNormals, setShowNormals] = useState(false);
  const [showBoundingBoxes, setShowBoundingBoxes] = useState(false);
  const [stochastic, setStochastic] = useState(false);
  const [maxStdDev, setMaxStdDev] = useState(2.24);

  // Export state
  const [exportFilename, setExportFilename] = useState("gsplats");
  const [trimOpacity, setTrimOpacity] = useState(true);
  const [trimThreshold, setTrimThreshold] = useState(0);
  const [exportMaxSh, setExportMaxSh] = useState(3);
  const [fractionalBits, setFractionalBits] = useState(12);

  // URL loading
  const [urlInput, setUrlInput] = useState("");

  const resetFrameQuaternion = useCallback((isOpenCv: boolean) => {
    if (!frameRef.current) return;
    if (isOpenCv) {
      frameRef.current.quaternion.set(1, 0, 0, 0);
    } else {
      frameRef.current.quaternion.set(0, 0, 0, 1);
    }
  }, []);

  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    const initializeScene = async () => {
      // Import SparkJS dynamically
      const { SparkRenderer, SparkControls, SplatMesh, constructGrid, textSplats, dyno } = 
        await import("@sparkjsdev/spark");

      // Initialize dyno refs
      clipEnableRef.current = dyno.dynoBool(false);
      clipMinXRef.current = dyno.dynoFloat(-5);
      clipMaxXRef.current = dyno.dynoFloat(5);
      clipMinYRef.current = dyno.dynoFloat(-5);
      clipMaxYRef.current = dyno.dynoFloat(5);
      clipMinZRef.current = dyno.dynoFloat(-5);
      clipMaxZRef.current = dyno.dynoFloat(5);
      normalColorRef.current = dyno.dynoBool(false);

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(bgColor);
      const camera = new THREE.PerspectiveCamera(
        75,
        container.clientWidth / container.clientHeight,
        0.01,
        1000
      );
      camera.position.set(0, 0, 1);

      const canvas = document.createElement("canvas");
      canvas.style.width = "100%";
      canvas.style.height = "100%";
      canvas.style.display = "block";
      canvas.style.touchAction = "none";
      canvas.tabIndex = 0;
      container.appendChild(canvas);
      canvasRef.current = canvas;

      const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(container.clientWidth, container.clientHeight, false);
      rendererRef.current = renderer;

      const spark = new SparkRenderer({ renderer, maxStdDev: Math.sqrt(5) } as unknown);
      sparkRef.current = spark;
      scene.add(spark as THREE.Object3D);

      const frame = new THREE.Group();
      frame.quaternion.set(1, 0, 0, 0);
      scene.add(frame);
      frameRef.current = frame;

      sceneRef.current = scene;
      cameraRef.current = camera;

      // Grid
      const grid = new SplatMesh({
        constructSplats: (splats: unknown) =>
          constructGrid({
            splats,
            extents: new THREE.Box3(
              new THREE.Vector3(-10, -10, -10),
              new THREE.Vector3(10, 10, 10)
            ),
          }),
      } as unknown) as unknown;
      (grid as { opacity: number }).opacity = 0;
      scene.add(grid as THREE.Object3D);
      gridRef.current = grid;

      // Instructions text
      const instructions = textSplats({
        text: "Drag and Drop\na Gsplat file\nhere to view",
        textAlign: "center",
        fontSize: 64,
        objectScale: 0.1 / 64,
      } as unknown) as THREE.Object3D & { quaternion: THREE.Quaternion; enableWorldToView: boolean };
      instructions.quaternion.set(1, 0, 0, 0);
      instructions.enableWorldToView = true;
      frame.add(instructions);

      // Controls
      const sparkControls = new SparkControls({ canvas } as unknown);
      sparkControlsRef.current = sparkControls;

      const orbit = new OrbitControls(camera, canvas);
      orbit.enabled = false;
      orbit.target.set(0, 0, 0);
      orbit.minDistance = 0.1;
      orbit.maxDistance = 10;
      orbitControlsRef.current = orbit;

      const onResize = () => {
        const w = container.clientWidth;
        const h = container.clientHeight;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      };
      window.addEventListener("resize", onResize);

      let lastTime: number | null = null;
      const animate = (time: number) => {
        const deltaTime = time - (lastTime || time);
        lastTime = time;

        if (frameRef.current && autoRotate) {
          frameRef.current.rotation.y += deltaTime / 5000;
        }

        if (orbitControlsRef.current?.enabled) {
          orbitControlsRef.current.update();
        } else {
          (sparkControls as { update: (camera: THREE.Camera) => void }).update(camera);
        }

        renderer.render(scene, camera);
        animationRef.current = requestAnimationFrame(animate);
      };
      animationRef.current = requestAnimationFrame(animate);
      canvas.focus();
    };

    initializeScene();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (rendererRef.current) rendererRef.current.dispose();
      const canvas = canvasRef.current;
      if (canvas && containerRef.current?.contains(canvas)) {
        containerRef.current.removeChild(canvas);
      }
    };
  }, []);

  // Sync settings
  useEffect(() => {
    if (orbitControlsRef.current) orbitControlsRef.current.enabled = useOrbit;
  }, [useOrbit]);

  useEffect(() => {
    if (sceneRef.current) sceneRef.current.background = new THREE.Color(bgColor);
  }, [bgColor]);

  useEffect(() => {
    if (gridRef.current) (gridRef.current as { opacity: number }).opacity = gridOpacity;
  }, [gridOpacity]);

  useEffect(() => {
    clipEnableRef.current.value = clipEnabled;
    clipMinXRef.current.value = clipMinX;
    clipMaxXRef.current.value = clipMaxX;
    clipMinYRef.current.value = clipMinY;
    clipMaxYRef.current.value = clipMaxY;
    clipMinZRef.current.value = clipMinZ;
    clipMaxZRef.current.value = clipMaxZ;
  }, [clipEnabled, clipMinX, clipMaxX, clipMinY, clipMaxY, clipMinZ, clipMaxZ]);

  useEffect(() => {
    normalColorRef.current.value = showNormals;
  }, [showNormals]);

  useEffect(() => {
    resetFrameQuaternion(openCv);
  }, [openCv, resetFrameQuaternion]);

  // File handling
  const handleFileSelect = () => fileInputRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !frameRef.current) return;
    setIsLoading(true);
    setLoadProgress(0);

    const { SplatMesh } = await import("@sparkjsdev/spark");

    for (const file of Array.from(e.target.files)) {
      try {
        const fileBytes = new Uint8Array(await file.arrayBuffer());
        const splatMesh = new SplatMesh({
          fileBytes: fileBytes.slice(),
          fileName: file.name,
        } as unknown) as THREE.Object3D & { initialized: Promise<void> };
        
        await splatMesh.initialized;
        frameRef.current.add(splatMesh);

        const id = Math.random().toString(36).slice(2);
        setLoadedSplats((prev) => [
          ...prev,
          {
            id,
            fileName: file.name,
            mesh: splatMesh,
            fileBytes,
            pathOrUrl: file.name,
          },
        ]);

        setLoadProgress(100);
      } catch (error) {
        console.error("Error loading splat file:", error);
      }
    }

    setIsLoading(false);
  };

  const handleLoadUrl = async () => {
    if (!urlInput.trim() || !frameRef.current) return;
    setIsLoading(true);
    setLoadProgress(0);

    try {
      const { SplatMesh } = await import("@sparkjsdev/spark");
      const response = await fetch(urlInput, { mode: "cors" });
      const fileBytes = new Uint8Array(await response.arrayBuffer());
      const fileName = urlInput.split("/").pop()?.split("?")[0] || "downloaded-file";

      const splatMesh = new SplatMesh({
        fileBytes: fileBytes.slice(),
        fileName,
      } as unknown) as THREE.Object3D & { initialized: Promise<void> };
      
      await splatMesh.initialized;
      frameRef.current.add(splatMesh);

      const id = Math.random().toString(36).slice(2);
      setLoadedSplats((prev) => [
        ...prev,
        {
          id,
          fileName,
          mesh: splatMesh,
          fileBytes,
          pathOrUrl: urlInput,
        },
      ]);

      setUrlInput("");
    } catch (error) {
      console.error("Error loading URL:", error);
    }

    setIsLoading(false);
  };

  const handleRemoveSplat = (id: string) => {
    const splat = loadedSplats.find((s) => s.id === id);
    if (splat && frameRef.current) {
      frameRef.current.remove(splat.mesh);
      setLoadedSplats((prev) => prev.filter((s) => s.id !== id));
    }
  };

  const handleResetPose = () => {
    if (!cameraRef.current) return;
    cameraRef.current.position.set(0, 0, 1);
    cameraRef.current.quaternion.set(0, 0, 0, 1);
    cameraRef.current.fov = 75;
    cameraRef.current.updateProjectionMatrix();
    resetFrameQuaternion(openCv);
  };

  const handleExportSpz = async () => {
    const inputs = loadedSplats
      .filter((s) => s.fileBytes)
      .map((s) => ({
        fileBytes: new Uint8Array(s.fileBytes!),
        pathOrUrl: s.pathOrUrl,
        transform: {
          translate: s.mesh.position.toArray(),
          quaternion: s.mesh.quaternion.toArray(),
          scale: (s.mesh.scale.x + s.mesh.scale.y + s.mesh.scale.z) / 3,
        },
      }));

    if (inputs.length === 0) return;

    try {
      const { transcodeSpz } = await import("@sparkjsdev/spark");
      const clipXyz = clipEnabled
        ? {
            min: [clipMinX, clipMinY, clipMinZ],
            max: [clipMaxX, clipMaxY, clipMaxZ],
          }
        : undefined;

      const transcode = await (transcodeSpz as Function)({
        inputs,
        maxSh: exportMaxSh,
        clipXyz,
        fractionalBits,
        opacityThreshold: trimOpacity ? trimThreshold : undefined,
      });

      const blob = new Blob([transcode.fileBytes], { type: "application/octet-stream" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = (exportFilename || "gsplats") + ".spz";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export failed:", err);
    }
  };

  return (
    <div className="w-full h-[calc(100vh-64px)] flex bg-background overflow-hidden pt-16">
      <input
        ref={fileInputRef}
        type="file"
        accept=".ply,.spz,.splat,.ksplat,.zip"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Left sidebar - File & Splat management */}
      <div className="w-80 flex-shrink-0 border-r border-border overflow-y-auto glass-panel z-20">
        <div className="p-4 border-b border-border/50">
          <h2 className="text-lg font-semibold tracking-wide text-foreground mb-4 flex items-center gap-2">
            <Move size={18} />
            Splat Editor
          </h2>

          <div className="space-y-3">
            <Button
              onClick={handleFileSelect}
              variant="outline"
              className="w-full glass-button gap-2"
              size="sm"
            >
              <FolderOpen size={14} /> Select Files
            </Button>

            <div className="flex gap-2">
              <Input
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="Paste URL(s)..."
                className="glass-input text-xs flex-1"
                onKeyDown={(e) => e.key === "Enter" && handleLoadUrl()}
              />
              <Button
                onClick={handleLoadUrl}
                variant="outline"
                size="sm"
                className="glass-button"
              >
                <LinkIcon size={14} />
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">Reset on load</Label>
              <Switch
                checked={resetOnLoad}
                onCheckedChange={setResetOnLoad}
                className="scale-75"
              />
            </div>
          </div>
        </div>

        {/* Loading indicator */}
        {isLoading && (
          <div className="px-4 py-3 border-b border-border/50">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
              <Loader2 size={14} className="animate-spin" />
              Loading...
            </div>
            <Progress value={loadProgress} className="h-1" />
          </div>
        )}

        {/* Loaded splats */}
        <div className="p-4">
          <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">
            Loaded Splats ({loadedSplats.length})
          </Label>
          {loadedSplats.length === 0 && (
            <p className="text-xs text-muted-foreground italic">
              Drag & drop files onto the canvas
            </p>
          )}
          <Accordion type="multiple" className="space-y-1">
            {loadedSplats.map((splat) => (
              <AccordionItem
                key={splat.id}
                value={splat.id}
                className="border border-border/50 rounded-lg px-3"
              >
                <AccordionTrigger className="text-xs py-2 hover:no-underline">
                  <span className="truncate max-w-[180px]">{splat.fileName}</span>
                </AccordionTrigger>
                <AccordionContent className="space-y-3 pb-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Opacity</Label>
                    <Slider
                      value={[splat.mesh.opacity ?? 1]}
                      onValueChange={([v]) => {
                        if (splat.mesh.opacity !== undefined) splat.mesh.opacity = v;
                      }}
                      min={0}
                      max={1}
                      step={0.01}
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Scale</Label>
                    <Slider
                      value={[splat.mesh.scale.x]}
                      onValueChange={([v]) => {
                        splat.mesh.scale.setScalar(v);
                      }}
                      min={0.01}
                      max={4}
                      step={0.01}
                    />
                  </div>
                  <Button
                    onClick={() => handleRemoveSplat(splat.id)}
                    variant="destructive"
                    size="sm"
                    className="w-full gap-1"
                  >
                    <Trash2 size={12} /> Remove
                  </Button>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>

      {/* Center canvas */}
      <div ref={containerRef} className="flex-1 relative bg-black" />

      {/* Right sidebar - Settings */}
      <div className="w-72 flex-shrink-0 border-l border-border overflow-y-auto glass-panel z-20">
        <Accordion type="multiple" defaultValue={["camera", "clip"]} className="p-3">
          {/* Camera */}
          <AccordionItem value="camera" className="border-b border-border/50">
            <AccordionTrigger className="text-sm py-2">
              <span className="flex items-center gap-2">
                <Camera size={14} /> Camera
              </span>
            </AccordionTrigger>
            <AccordionContent className="space-y-3 pt-1">
              <Button
                onClick={handleResetPose}
                variant="outline"
                size="sm"
                className="w-full glass-button gap-1"
              >
                <RotateCcw size={12} /> Reset Pose
              </Button>
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">Orbit controls</Label>
                <Switch
                  checked={useOrbit}
                  onCheckedChange={setUseOrbit}
                  className="scale-75"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">Auto rotate</Label>
                <Switch
                  checked={autoRotate}
                  onCheckedChange={(v) => {
                    setAutoRotate(v);
                    if (v && frameRef.current) frameRef.current.rotation.y = 0;
                  }}
                  className="scale-75"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">OpenCV coords</Label>
                <Switch checked={openCv} onCheckedChange={setOpenCv} className="scale-75" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Background</Label>
                <input
                  type="color"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="w-full h-8 rounded border border-border cursor-pointer mt-1"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Grid opacity</Label>
                <Slider
                  value={[gridOpacity]}
                  onValueChange={([v]) => setGridOpacity(v)}
                  min={0}
                  max={1}
                  step={0.01}
                />
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Clip Planes */}
          <AccordionItem value="clip" className="border-b border-border/50">
            <AccordionTrigger className="text-sm py-2">
              <span className="flex items-center gap-2">
                <Scissors size={14} /> Clip Planes
              </span>
            </AccordionTrigger>
            <AccordionContent className="space-y-3 pt-1">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">Enable clipping</Label>
                <Switch
                  checked={clipEnabled}
                  onCheckedChange={setClipEnabled}
                  className="scale-75"
                />
              </div>
              {clipEnabled && (
                <div className="space-y-2">
                  {[
                    {
                      label: "X",
                      min: clipMinX,
                      max: clipMaxX,
                      setMin: setClipMinX,
                      setMax: setClipMaxX,
                    },
                    {
                      label: "Y",
                      min: clipMinY,
                      max: clipMaxY,
                      setMin: setClipMinY,
                      setMax: setClipMaxY,
                    },
                    {
                      label: "Z",
                      min: clipMinZ,
                      max: clipMaxZ,
                      setMin: setClipMinZ,
                      setMax: setClipMaxZ,
                    },
                  ].map(({ label, min, max, setMin, setMax }) => (
                    <div key={label}>
                      <Label className="text-xs text-muted-foreground">
                        {label} range [{min.toFixed(1)}, {max.toFixed(1)}]
                      </Label>
                      <div className="flex gap-1">
                        <Slider
                          value={[min]}
                          onValueChange={([v]) => setMin(v)}
                          min={-50}
                          max={50}
                          step={0.1}
                          className="flex-1"
                        />
                        <Slider
                          value={[max]}
                          onValueChange={([v]) => setMax(v)}
                          min={-50}
                          max={50}
                          step={0.1}
                          className="flex-1"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </AccordionContent>
          </AccordionItem>

          {/* Debug */}
          <AccordionItem value="debug" className="border-b border-border/50">
            <AccordionTrigger className="text-sm py-2">
              <span className="flex items-center gap-2">
                <Bug size={14} /> Debug
              </span>
            </AccordionTrigger>
            <AccordionContent className="space-y-3 pt-1">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">Normal colors</Label>
                <Switch
                  checked={showNormals}
                  onCheckedChange={setShowNormals}
                  className="scale-75"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">Bounding boxes</Label>
                <Switch
                  checked={showBoundingBoxes}
                  onCheckedChange={setShowBoundingBoxes}
                  className="scale-75"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">Stochastic sort-free</Label>
                <Switch
                  checked={stochastic}
                  onCheckedChange={setStochastic}
                  className="scale-75"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">
                  Max std dev ({maxStdDev.toFixed(2)})
                </Label>
                <Slider
                  value={[maxStdDev]}
                  onValueChange={([v]) => setMaxStdDev(v)}
                  min={0.1}
                  max={3}
                  step={0.01}
                />
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Export */}
          <AccordionItem value="export">
            <AccordionTrigger className="text-sm py-2">
              <span className="flex items-center gap-2">
                <Download size={14} /> Export SPZ
              </span>
            </AccordionTrigger>
            <AccordionContent className="space-y-3 pt-1">
              <div>
                <Label className="text-xs text-muted-foreground">Filename</Label>
                <Input
                  value={exportFilename}
                  onChange={(e) => setExportFilename(e.target.value)}
                  className="glass-input text-xs mt-1"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">Trim low opacity</Label>
                <Switch
                  checked={trimOpacity}
                  onCheckedChange={setTrimOpacity}
                  className="scale-75"
                />
              </div>
              {trimOpacity && (
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Threshold ({trimThreshold.toFixed(2)})
                  </Label>
                  <Slider
                    value={[trimThreshold]}
                    onValueChange={([v]) => setTrimThreshold(v)}
                    min={0}
                    max={1}
                    step={0.01}
                  />
                </div>
              )}
              <div>
                <Label className="text-xs text-muted-foreground">Max SH ({exportMaxSh})</Label>
                <Slider
                  value={[exportMaxSh]}
                  onValueChange={([v]) => setExportMaxSh(v)}
                  min={0}
                  max={3}
                  step={1}
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">
                  Fractional bits ({fractionalBits})
                </Label>
                <Slider
                  value={[fractionalBits]}
                  onValueChange={([v]) => setFractionalBits(v)}
                  min={6}
                  max={24}
                  step={1}
                />
              </div>
              <Button
                onClick={handleExportSpz}
                disabled={loadedSplats.length === 0}
                className="w-full gap-1"
                size="sm"
              >
                <Download size={12} /> Download .spz
              </Button>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
}
