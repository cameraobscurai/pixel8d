import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import * as THREE from 'three';
import { OrbitControls } from 'three-stdlib';
import {
  SparkRenderer, SparkControls, SplatMesh, constructGrid, textSplats, dyno,
  transcodeSpz, isPcSogs, LN_SCALE_MIN, LN_SCALE_MAX
} from '@sparkjsdev/spark';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import {
  FolderOpen, Link as LinkIcon, Download, RotateCcw, Eye, EyeOff,
  Scissors, Bug, Camera, Upload, Trash2, Box, ArrowLeft
} from 'lucide-react';
import { CAPTURES_BY_ID } from '@/lib/captures';

interface LoadedSplat {
  id: string;
  fileName: string;
  mesh: any;
  fileBytes?: Uint8Array;
  pathOrUrl: string;
}

interface SplatEditorProps {
  captureId?: string | null;
}

export const SplatEditor: React.FC<SplatEditorProps> = ({ captureId }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sparkRef = useRef<any>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const frameRef = useRef<THREE.Group | null>(null);
  const gridRef = useRef<any>(null);
  const orbitControlsRef = useRef<OrbitControls | null>(null);
  const sparkControlsRef = useRef<any>(null);
  const animationRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dyno refs for clip planes and debug
  const clipEnableRef = useRef(dyno.dynoBool(false));
  const clipMinXRef = useRef(dyno.dynoFloat(-5));
  const clipMaxXRef = useRef(dyno.dynoFloat(5));
  const clipMinYRef = useRef(dyno.dynoFloat(-5));
  const clipMaxYRef = useRef(dyno.dynoFloat(5));
  const clipMinZRef = useRef(dyno.dynoFloat(-5));
  const clipMaxZRef = useRef(dyno.dynoFloat(5));
  const normalColorRef = useRef(dyno.dynoBool(false));

  const [loadedSplats, setLoadedSplats] = useState<LoadedSplat[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);

  // Camera & controls state
  const [useOrbit, setUseOrbit] = useState(false);
  const [autoRotate, setAutoRotate] = useState(false);
  const [openCv, setOpenCv] = useState(true);
  const [bgColor, setBgColor] = useState('#000000');
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
  const [exportFilename, setExportFilename] = useState('gsplats');
  const [trimOpacity, setTrimOpacity] = useState(true);
  const [trimThreshold, setTrimThreshold] = useState(0);
  const [exportMaxSh, setExportMaxSh] = useState(3);
  const [fractionalBits, setFractionalBits] = useState(12);

  // URL loading
  const [urlInput, setUrlInput] = useState('');

  const makeWorldModifier = useCallback((mesh: any) => {
    const context = mesh.context;
    return dyno.dynoBlock(
      { gsplat: dyno.Gsplat }, { gsplat: dyno.Gsplat },
      ({ gsplat }: any) => {
        let worldNormal = dyno.gsplatNormal(gsplat);
        let { rgb, center, opacity } = dyno.splitGsplat(gsplat).outputs;

        const worldToView = context.worldToView;
        const viewGsplat = worldToView.applyGsplat(gsplat);
        const viewCenter = dyno.splitGsplat(viewGsplat).outputs.center;
        let normal = dyno.gsplatNormal(viewGsplat);
        const dot = dyno.dot(viewCenter, normal);
        const sameDir = dyno.greaterThanEqual(dot, dyno.dynoConst('float', 0));
        normal = dyno.select(sameDir, dyno.neg(worldNormal), worldNormal);
        const normalRgb = dyno.add(dyno.mul(normal, dyno.dynoConst('float', 0.5)), dyno.dynoConst('float', 0.5));
        rgb = dyno.select(normalColorRef.current, normalRgb, rgb);

        const { x, y, z } = dyno.split(center).outputs;
        const xWithin = dyno.and(dyno.greaterThanEqual(x, clipMinXRef.current), dyno.lessThanEqual(x, clipMaxXRef.current));
        const yWithin = dyno.and(dyno.greaterThanEqual(y, clipMinYRef.current), dyno.lessThanEqual(y, clipMaxYRef.current));
        const zWithin = dyno.and(dyno.greaterThanEqual(z, clipMinZRef.current), dyno.lessThanEqual(z, clipMaxZRef.current));
        const within = dyno.and(dyno.and(xWithin, yWithin), zWithin);
        const splatEnabled = dyno.or(dyno.not(clipEnableRef.current), within);
        opacity = dyno.select(splatEnabled, opacity, dyno.dynoConst('float', 0));

        gsplat = dyno.combineGsplat({ gsplat, rgb, opacity });
        return { gsplat };
      }
    );
  }, []);

  const updateFrameSplats = useCallback(() => {
    if (!frameRef.current) return;
    frameRef.current.children.forEach((child: any) => {
      if (child instanceof SplatMesh || child.isSplatMesh) {
        child.updateVersion();
      }
    });
  }, []);

  const resetFrameQuaternion = useCallback((isOpenCv: boolean) => {
    if (!frameRef.current) return;
    if (isOpenCv) {
      frameRef.current.quaternion.set(1, 0, 0, 0);
    } else {
      frameRef.current.quaternion.set(0, 0, 0, 1);
    }
  }, []);

  // Initialize Three.js
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#000000');
    const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.01, 1000);
    camera.position.set(0, 0, 1);

    const canvas = document.createElement('canvas');
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.display = 'block';
    canvas.style.touchAction = 'none';
    canvas.tabIndex = 0;
    container.appendChild(canvas);
    canvasRef.current = canvas;

    const renderer = new THREE.WebGLRenderer({ canvas });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight, false);
    rendererRef.current = renderer;

    const spark = new SparkRenderer({ renderer, maxStdDev: Math.sqrt(5) } as any);
    sparkRef.current = spark;
    scene.add(spark as any);

    const frame = new THREE.Group();
    frame.quaternion.set(1, 0, 0, 0);
    scene.add(frame);
    frameRef.current = frame;

    sceneRef.current = scene;
    cameraRef.current = camera;

    // Grid
    const grid = new SplatMesh({
      constructSplats: (splats: any) => constructGrid({
        splats,
        extents: new THREE.Box3(new THREE.Vector3(-10, -10, -10), new THREE.Vector3(10, 10, 10)),
      }),
    } as any) as any;
    grid.opacity = 0;
    scene.add(grid);
    gridRef.current = grid;

    // Instructions text
    const instructions = textSplats({
      text: 'Drag and Drop\na Gsplat file\nhere to view',
      textAlign: 'center',
      fontSize: 64,
      objectScale: 0.1 / 64,
    } as any) as any;
    instructions.quaternion.set(1, 0, 0, 0);
    instructions.enableWorldToView = true;
    instructions.worldModifier = makeWorldModifier(instructions);
    instructions.updateGenerator();
    frame.add(instructions);

    // Controls
    const sparkControls = new SparkControls({ canvas } as any);
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
    window.addEventListener('resize', onResize);

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
        (sparkControls as any).update(camera);
      }

      renderer.render(scene, camera);
      animationRef.current = requestAnimationFrame(animate);
    };
    animationRef.current = requestAnimationFrame(animate);
    canvas.focus();

    return () => {
      window.removeEventListener('resize', onResize);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      renderer.dispose();
      if (container.contains(canvas)) container.removeChild(canvas);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync autoRotate into animation loop via ref
  const autoRotateRef = useRef(autoRotate);
  useEffect(() => { autoRotateRef.current = autoRotate; }, [autoRotate]);
  // Patch animate to use ref
  useEffect(() => {
    // This is handled inside the animation loop via frameRef rotation
  }, [autoRotate]);

  // Sync orbit controls
  useEffect(() => {
    if (orbitControlsRef.current) orbitControlsRef.current.enabled = useOrbit;
  }, [useOrbit]);

  // Sync background color
  useEffect(() => {
    if (sceneRef.current) sceneRef.current.background = new THREE.Color(bgColor);
  }, [bgColor]);

  // Sync grid opacity
  useEffect(() => {
    if (gridRef.current) gridRef.current.opacity = gridOpacity;
  }, [gridOpacity]);

  // Sync clip planes
  useEffect(() => {
    clipEnableRef.current.value = clipEnabled;
    clipMinXRef.current.value = clipMinX;
    clipMaxXRef.current.value = clipMaxX;
    clipMinYRef.current.value = clipMinY;
    clipMaxYRef.current.value = clipMaxY;
    clipMinZRef.current.value = clipMinZ;
    clipMaxZRef.current.value = clipMaxZ;
    updateFrameSplats();
  }, [clipEnabled, clipMinX, clipMaxX, clipMinY, clipMaxY, clipMinZ, clipMaxZ, updateFrameSplats]);

  // Sync debug
  useEffect(() => {
    normalColorRef.current.value = showNormals;
    updateFrameSplats();
  }, [showNormals, updateFrameSplats]);

  useEffect(() => {
    if (sparkRef.current) {
      (sparkRef.current as any).defaultView.stochastic = stochastic;
      sparkRef.current.needsUpdate = true;
    }
  }, [stochastic]);

  useEffect(() => {
    if (sparkRef.current) {
      sparkRef.current.maxStdDev = maxStdDev;
    }
  }, [maxStdDev]);

  useEffect(() => {
    if (!frameRef.current) return;
    frameRef.current.children.forEach((child: any) => {
      if (child instanceof THREE.Box3Helper) {
        child.visible = showBoundingBoxes;
      }
    });
  }, [showBoundingBoxes]);

  // OpenCV coordinates
  useEffect(() => {
    resetFrameQuaternion(openCv);
  }, [openCv, resetFrameQuaternion]);

  // Auto-load capture from gallery
  useEffect(() => {
    if (!captureId || !frameRef.current) return;
    const capture = CAPTURES_BY_ID[captureId];
    if (!capture) return;

    // Fetch the PLY download URL from Luma API
    fetch(`https://webapp.engineeringlumalabs.com/api/v3/captures/${captureId}/public`)
      .then(r => r.json())
      .then(data => {
        const artifacts = data?.response?.artifacts || [];
        const plyArtifact = artifacts.find((a: any) => a.type === 'gaussian_splatting_point_cloud.ply');
        if (plyArtifact?.url) {
          loadFiles([plyArtifact.url]);
          setExportFilename(capture.title.replace(/\s+/g, '_').toLowerCase());
        }
      })
      .catch(err => console.error('Failed to load capture for editing:', err));
  }, [captureId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Drag and drop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      canvas.style.opacity = '0.5';
    };
    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      canvas.style.opacity = '1';
    };
    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      canvas.style.opacity = '1';

      const textData = e.dataTransfer?.getData('text/plain');
      if (textData) {
        const urls = parseURLsFromText(textData);
        if (urls.length > 0) {
          loadFiles(urls);
          return;
        }
      }

      const files = Array.from(e.dataTransfer?.files || []);
      const splatFiles = files.filter(f => /\.(ply|spz|splat|ksplat|zip|sog)$/i.test(f.name));
      if (splatFiles.length > 0) loadFiles(splatFiles);
    };

    canvas.addEventListener('dragover', handleDragOver);
    canvas.addEventListener('dragleave', handleDragLeave);
    canvas.addEventListener('drop', handleDrop);

    return () => {
      canvas.removeEventListener('dragover', handleDragOver);
      canvas.removeEventListener('dragleave', handleDragLeave);
      canvas.removeEventListener('drop', handleDrop);
    };
  }, [resetOnLoad]); // eslint-disable-line react-hooks/exhaustive-deps

  function parseURLsFromText(text: string): string[] {
    const exts = ['.ply', '.spz', '.splat', '.ksplat', '.zip', '.json'];
    return text.trim().split(/[\r\n,;]+/)
      .map(s => s.trim())
      .filter(s => (s.startsWith('http://') || s.startsWith('https://'))
        && exts.some(ext => s.toLowerCase().includes(ext)));
  }

  async function fetchWithProgress(url: string): Promise<Uint8Array> {
    const response = await fetch(url, { mode: 'cors', cache: 'default' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const contentLength = response.headers.get('content-length');
    const total = contentLength ? parseInt(contentLength, 10) : null;
    const reader = response.body!.getReader();
    const chunks: Uint8Array[] = [];
    let loaded = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      loaded += value.length;
      setLoadProgress(total ? loaded / total : loaded / (loaded + 10 * 1024 * 1024));
    }

    const result = new Uint8Array(loaded);
    let offset = 0;
    for (const chunk of chunks) { result.set(chunk, offset); offset += chunk.length; }
    return result;
  }

  async function loadFiles(splatFiles: (File | string)[]) {
    if (!frameRef.current) return;
    setIsLoading(true);
    setLoadProgress(0);

    if (resetOnLoad) {
      // Remove existing splat meshes & box helpers
      const toRemove = frameRef.current.children.filter(
        (c: any) => c instanceof SplatMesh || c.isSplatMesh || c instanceof THREE.Box3Helper
      );
      toRemove.forEach((c: any) => frameRef.current!.remove(c));
      setLoadedSplats([]);
      setExportFilename('');
    }

    setAutoRotate(false);
    resetFrameQuaternion(true);

    for (const splatFile of splatFiles) {
      try {
        let fileBytes: Uint8Array;
        let fileName: string;
        let url: string | null = null;

        if (typeof splatFile === 'string') {
          fileBytes = await fetchWithProgress(splatFile);
          fileName = splatFile.split('/').pop()?.split('?')[0] || 'downloaded-file';
          if (isPcSogs(fileBytes)) url = splatFile;
        } else {
          fileBytes = new Uint8Array(await splatFile.arrayBuffer());
          fileName = splatFile.name;
        }

        if (!exportFilename) setExportFilename(fileName.split('.')[0]);

        const init: any = url ? { url } : { fileBytes: fileBytes.slice(), fileName };
        const splatMesh = new SplatMesh(init) as any;
        splatMesh.enableWorldToView = true;
        splatMesh.worldModifier = makeWorldModifier(splatMesh);
        await splatMesh.initialized;

        frameRef.current!.add(splatMesh);

        // Bounding box
        const box = splatMesh.getBoundingBox();
        const boxHelper = new THREE.Box3Helper(box, new THREE.Color(0x00ff00));
        boxHelper.visible = showBoundingBoxes;
        frameRef.current!.add(boxHelper);

        const id = Math.random().toString(36).slice(2);
        setLoadedSplats(prev => [...prev, {
          id,
          fileName,
          mesh: splatMesh,
          fileBytes: url ? undefined : fileBytes,
          pathOrUrl: fileName,
        }]);

        console.log(`Loaded ${fileName} with ${splatMesh.numSplats} splats`);
      } catch (error) {
        console.error('Error loading splat file:', error);
      }
    }

    setIsLoading(false);
    canvasRef.current?.focus();
  }

  const handleFileSelect = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) loadFiles(Array.from(e.target.files));
  };

  const handleLoadUrl = () => {
    if (!urlInput.trim()) return;
    const urls = parseURLsFromText(urlInput);
    if (urls.length > 0) {
      loadFiles(urls);
      setUrlInput('');
    } else {
      // Try direct URL
      if (urlInput.startsWith('http')) {
        loadFiles([urlInput.trim()]);
        setUrlInput('');
      }
    }
  };

  const handleRemoveSplat = (id: string) => {
    const splat = loadedSplats.find(s => s.id === id);
    if (splat && frameRef.current) {
      frameRef.current.remove(splat.mesh);
      setLoadedSplats(prev => prev.filter(s => s.id !== id));
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
      .filter(s => s.fileBytes)
      .map(s => ({
        fileBytes: new Uint8Array(s.fileBytes!),
        pathOrUrl: s.pathOrUrl,
        transform: {
          translate: s.mesh.position.toArray(),
          quaternion: s.mesh.quaternion.toArray(),
          scale: (s.mesh.scale.x + s.mesh.scale.y + s.mesh.scale.z) / 3,
        },
      }));

    if (inputs.length === 0) return;

    const clipXyz = clipEnabled ? {
      min: [clipMinX, clipMinY, clipMinZ],
      max: [clipMaxX, clipMaxY, clipMaxZ],
    } : undefined;

    try {
      const transcode = await (transcodeSpz as any)({
        inputs,
        maxSh: exportMaxSh,
        clipXyz,
        fractionalBits,
        opacityThreshold: trimOpacity ? trimThreshold : undefined,
      });

      if (transcode.clippedCount > 0) {
        console.warn(`Clipped ${transcode.clippedCount} splats.`);
      }

      const blob = new Blob([transcode.fileBytes], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = (exportFilename || 'gsplats') + '.spz';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  return (
    <div className="w-full h-screen flex bg-background overflow-hidden">
      <input
        ref={fileInputRef}
        type="file"
        accept=".ply,.spz,.splat,.ksplat,.zip"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Left sidebar - File & Splat management */}
      <div className="w-80 flex-shrink-0 border-r border-border overflow-y-auto bg-background/95 backdrop-blur-sm z-20">
        <div className="p-4 border-b border-border">
          <h2 className="text-lg font-light tracking-wide text-foreground mb-4">splat editor</h2>

          <div className="space-y-3">
            <Button onClick={handleFileSelect} variant="outline" className="w-full glass-button gap-2" size="sm">
              <FolderOpen size={14} /> Select Files
            </Button>

            <div className="flex gap-2">
              <Input
                value={urlInput}
                onChange={e => setUrlInput(e.target.value)}
                placeholder="Paste URL(s)..."
                className="glass-input text-xs flex-1"
                onKeyDown={e => e.key === 'Enter' && handleLoadUrl()}
              />
              <Button onClick={handleLoadUrl} variant="outline" size="sm" className="glass-button">
                <LinkIcon size={14} />
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">Reset on load</Label>
              <Switch checked={resetOnLoad} onCheckedChange={setResetOnLoad} className="glass-switch scale-75" />
            </div>
          </div>
        </div>

        {/* Loading indicator */}
        {isLoading && (
          <div className="px-4 py-2 border-b border-border">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
              Loading...
            </div>
            <div className="mt-1 h-1 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary transition-all" style={{ width: `${loadProgress * 100}%` }} />
            </div>
          </div>
        )}

        {/* Loaded splats */}
        <div className="p-4">
          <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">
            Loaded Splats ({loadedSplats.length})
          </Label>
          {loadedSplats.length === 0 && (
            <p className="text-xs text-muted-foreground italic">Drag & drop files onto the canvas</p>
          )}
          <Accordion type="multiple" className="space-y-1">
            {loadedSplats.map(splat => (
              <AccordionItem key={splat.id} value={splat.id} className="border rounded-md px-2">
                <AccordionTrigger className="text-xs py-2 hover:no-underline">
                  <span className="truncate max-w-[180px]">{splat.fileName}</span>
                </AccordionTrigger>
                <AccordionContent className="space-y-3 pb-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Opacity</Label>
                    <Slider
                      value={[splat.mesh.opacity ?? 1]}
                      onValueChange={([v]) => { splat.mesh.opacity = v; }}
                      min={0} max={1} step={0.01}
                    />
                  </div>
                  {['x', 'y', 'z'].map(axis => (
                    <div key={axis}>
                      <Label className="text-xs text-muted-foreground">Position {axis.toUpperCase()}</Label>
                      <Slider
                        value={[splat.mesh.position[axis as 'x'|'y'|'z']]}
                        onValueChange={([v]) => { splat.mesh.position[axis as 'x'|'y'|'z'] = v; }}
                        min={-10} max={10} step={0.01}
                      />
                    </div>
                  ))}
                  <div>
                    <Label className="text-xs text-muted-foreground">Scale</Label>
                    <Slider
                      value={[splat.mesh.scale.x]}
                      onValueChange={([v]) => { splat.mesh.scale.setScalar(v); }}
                      min={0.01} max={4} step={0.01}
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Max SH</Label>
                    <Slider
                      value={[splat.mesh.maxSh ?? 3]}
                      onValueChange={([v]) => { splat.mesh.maxSh = v; splat.mesh.updateGenerator(); }}
                      min={0} max={3} step={1}
                    />
                  </div>
                  <Button onClick={() => handleRemoveSplat(splat.id)} variant="destructive" size="sm" className="w-full gap-1">
                    <Trash2 size={12} /> Remove
                  </Button>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>

      {/* Center canvas */}
      <div ref={containerRef} className="flex-1 relative" />

      {/* Right sidebar - Settings */}
      <div className="w-72 flex-shrink-0 border-l border-border overflow-y-auto bg-background/95 backdrop-blur-sm z-20">
        <Accordion type="multiple" defaultValue={['camera', 'clip']} className="p-3">

          {/* Camera */}
          <AccordionItem value="camera">
            <AccordionTrigger className="text-sm py-2">
              <span className="flex items-center gap-2"><Camera size={14} /> Camera</span>
            </AccordionTrigger>
            <AccordionContent className="space-y-3 pt-1">
              <Button onClick={handleResetPose} variant="outline" size="sm" className="w-full glass-button gap-1">
                <RotateCcw size={12} /> Reset Pose
              </Button>
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">Orbit controls</Label>
                <Switch checked={useOrbit} onCheckedChange={setUseOrbit} className="glass-switch scale-75" />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">Auto rotate</Label>
                <Switch
                  checked={autoRotate}
                  onCheckedChange={v => {
                    setAutoRotate(v);
                    if (v && frameRef.current) frameRef.current.rotation.y = 0;
                  }}
                  className="glass-switch scale-75"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">OpenCV coords</Label>
                <Switch checked={openCv} onCheckedChange={setOpenCv} className="glass-switch scale-75" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Background</Label>
                <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)}
                  className="w-full h-8 rounded border border-border cursor-pointer mt-1" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Grid opacity</Label>
                <Slider value={[gridOpacity]} onValueChange={([v]) => setGridOpacity(v)} min={0} max={1} step={0.01} />
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Clip Planes */}
          <AccordionItem value="clip">
            <AccordionTrigger className="text-sm py-2">
              <span className="flex items-center gap-2"><Scissors size={14} /> Clip Planes</span>
            </AccordionTrigger>
            <AccordionContent className="space-y-3 pt-1">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">Enable clipping</Label>
                <Switch checked={clipEnabled} onCheckedChange={setClipEnabled} className="glass-switch scale-75" />
              </div>
              {clipEnabled && (
                <div className="space-y-2">
                  {[
                    { label: 'X', min: clipMinX, max: clipMaxX, setMin: setClipMinX, setMax: setClipMaxX },
                    { label: 'Y', min: clipMinY, max: clipMaxY, setMin: setClipMinY, setMax: setClipMaxY },
                    { label: 'Z', min: clipMinZ, max: clipMaxZ, setMin: setClipMinZ, setMax: setClipMaxZ },
                  ].map(({ label, min, max, setMin, setMax }) => (
                    <div key={label}>
                      <Label className="text-xs text-muted-foreground">{label} range [{min.toFixed(1)}, {max.toFixed(1)}]</Label>
                      <div className="flex gap-1">
                        <Slider value={[min]} onValueChange={([v]) => setMin(v)} min={-50} max={50} step={0.1} className="flex-1" />
                        <Slider value={[max]} onValueChange={([v]) => setMax(v)} min={-50} max={50} step={0.1} className="flex-1" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </AccordionContent>
          </AccordionItem>

          {/* Debug */}
          <AccordionItem value="debug">
            <AccordionTrigger className="text-sm py-2">
              <span className="flex items-center gap-2"><Bug size={14} /> Debug</span>
            </AccordionTrigger>
            <AccordionContent className="space-y-3 pt-1">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">Normal colors</Label>
                <Switch checked={showNormals} onCheckedChange={setShowNormals} className="glass-switch scale-75" />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">Bounding boxes</Label>
                <Switch checked={showBoundingBoxes} onCheckedChange={setShowBoundingBoxes} className="glass-switch scale-75" />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">Stochastic sort-free</Label>
                <Switch checked={stochastic} onCheckedChange={setStochastic} className="glass-switch scale-75" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Max std dev ({maxStdDev.toFixed(2)})</Label>
                <Slider value={[maxStdDev]} onValueChange={([v]) => setMaxStdDev(v)} min={0.1} max={3} step={0.01} />
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Export */}
          <AccordionItem value="export">
            <AccordionTrigger className="text-sm py-2">
              <span className="flex items-center gap-2"><Download size={14} /> Export SPZ</span>
            </AccordionTrigger>
            <AccordionContent className="space-y-3 pt-1">
              <div>
                <Label className="text-xs text-muted-foreground">Filename</Label>
                <Input value={exportFilename} onChange={e => setExportFilename(e.target.value)} className="glass-input text-xs mt-1" />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">Trim low opacity</Label>
                <Switch checked={trimOpacity} onCheckedChange={setTrimOpacity} className="glass-switch scale-75" />
              </div>
              {trimOpacity && (
                <div>
                  <Label className="text-xs text-muted-foreground">Threshold ({trimThreshold.toFixed(2)})</Label>
                  <Slider value={[trimThreshold]} onValueChange={([v]) => setTrimThreshold(v)} min={0} max={1} step={0.01} />
                </div>
              )}
              <div>
                <Label className="text-xs text-muted-foreground">Max SH ({exportMaxSh})</Label>
                <Slider value={[exportMaxSh]} onValueChange={([v]) => setExportMaxSh(v)} min={0} max={3} step={1} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Fractional bits ({fractionalBits})</Label>
                <Slider value={[fractionalBits]} onValueChange={([v]) => setFractionalBits(v)} min={6} max={24} step={1} />
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
};
