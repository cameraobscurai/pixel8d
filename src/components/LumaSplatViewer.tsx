import React, { useRef, useEffect, useState, useCallback } from 'react';
import { WebGLRenderer, PerspectiveCamera, Scene, Vector3, MathUtils, FogExp2, Color } from 'three';
import { OrbitControls } from 'three-stdlib';
import { CameraControls } from './CameraControls';
import { ViewerToolbar } from './ViewerToolbar';
import { SettingsPanel } from './SettingsPanel';
import { ExportDialog } from './ExportDialog';

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

const INITIAL_CAMERA_STATE: CameraState = {
  position: { x: -2.76, y: 0.03, z: -2.25 },
  rotation: { roll: -179.35, pitch: -179.16, yaw: -50.84 },
  focalLength: 20.10
};

const RESET_CAMERA_PRESET: CameraPreset = {
  name: 'Reset',
  ...INITIAL_CAMERA_STATE
};

const CAMERA_PRESETS: CameraPreset[] = [
  { name: 'Front', position: { x: 0, y: 0, z: 3 }, rotation: { roll: 0, pitch: 0, yaw: 0 }, focalLength: 35 },
  { name: 'Side', position: { x: 3, y: 0, z: 0 }, rotation: { roll: 0, pitch: 0, yaw: 90 }, focalLength: 35 },
  { name: 'Top', position: { x: 0, y: 3, z: 0 }, rotation: { roll: 0, pitch: -90, yaw: 0 }, focalLength: 35 },
  { name: 'Perspective', position: { x: 2, y: 1, z: 2 }, rotation: { roll: 0, pitch: -15, yaw: 45 }, focalLength: 28 }
];

const BOUNDS = {
  position: { min: -10, max: 10 },
  rotation: { min: -180, max: 180 },
  focalLength: { min: 10, max: 100 }
};

const QUALITY_PRESETS = {
  ultra: { pixelRatio: 2, antialias: true, dampingFactor: 0.05 },
  high: { pixelRatio: 1.5, antialias: true, dampingFactor: 0.1 },
  medium: { pixelRatio: 1, antialias: false, dampingFactor: 0.15 },
  low: { pixelRatio: 0.75, antialias: false, dampingFactor: 0.2 }
};

export const LumaSplatViewer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<WebGLRenderer | null>(null);
  const sceneRef = useRef<Scene | null>(null);
  const cameraRef = useRef<PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const splatsRef = useRef<any>(null);
  const animationIdRef = useRef<number>();
  const isManualUpdateRef = useRef(false);
  const hasInitializedRef = useRef(false);
  const isSliderActiveRef = useRef(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const [cameraState, setCameraState] = useState<CameraState>(INITIAL_CAMERA_STATE);
  const [aspectRatio, setAspectRatio] = useState(16/9);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [smoothness, setSmoothness] = useState(0.1);
  const [showSettings, setShowSettings] = useState(false);
  const [qualityPreset, setQualityPreset] = useState('high');
  const [showGrid, setShowGrid] = useState(false);
  const [depthBufferEnabled, setDepthBufferEnabled] = useState(true);
  const [semanticMask, setSemanticMask] = useState('all');

  const constrainValue = useCallback((value: number, min: number, max: number) => {
    return MathUtils.clamp(value, min, max);
  }, []);

  const calculateFOVFromFocalLength = useCallback((focalLength: number, currentAspectRatio: number) => {
    const sensorHeight = 24;
    const fov = 2 * Math.atan(sensorHeight / (2 * focalLength)) * (180 / Math.PI);
    return Math.max(10, Math.min(120, fov));
  }, []);

  const calculateFocalLengthFromFOV = useCallback((fov: number, currentAspectRatio: number) => {
    const sensorHeight = 24;
    return sensorHeight / (2 * Math.tan(MathUtils.degToRad(fov / 2)));
  }, []);

  const getContainerDimensions = useCallback(() => {
    const container = canvasRef.current?.parentElement;
    if (container) {
      const width = container.clientWidth;
      const height = container.clientHeight;
      const newAspectRatio = width / height;
      
      if (isFinite(newAspectRatio) && newAspectRatio > 0) {
        return { width, height, aspectRatio: newAspectRatio };
      }
    }
    return { width: 1920, height: 1080, aspectRatio: 16/9 };
  }, []);

  const exportScreenshot = useCallback(async (options: { 
    resolution: string; 
    quality: number; 
    format: 'png' | 'jpeg';
    filename?: string;
  }) => {
    if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return;

    const renderer = rendererRef.current;
    const scene = sceneRef.current;
    const camera = cameraRef.current;

    setIsExporting(true);

    try {
      // Parse resolution
      const [width, height] = options.resolution.split('x').map(Number);
      
      // Store original renderer size
      const originalSize = renderer.getSize(new Vector3());
      const originalPixelRatio = renderer.getPixelRatio();

      // Create high-resolution render target
      const pixelRatio = Math.min(window.devicePixelRatio, 2);
      const renderWidth = width * pixelRatio;
      const renderHeight = height * pixelRatio;

      // Temporarily update renderer for high-res capture
      renderer.setSize(renderWidth, renderHeight, false);
      renderer.setPixelRatio(1);

      // Update camera aspect ratio temporarily
      const originalAspect = camera.aspect;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();

      // Render the scene at high resolution
      renderer.render(scene, camera);

      // Get the canvas data
      const canvas = renderer.domElement;
      const dataURL = canvas.toDataURL(
        options.format === 'jpeg' ? 'image/jpeg' : 'image/png',
        options.quality / 100
      );

      // Create and trigger download
      const link = document.createElement('a');
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
      const filename = options.filename || `pixel8d-export-${timestamp}`;
      link.download = `${filename}.${options.format}`;
      link.href = dataURL;
      link.click();

      // Restore original renderer settings
      renderer.setSize(originalSize.x, originalSize.y, false);
      renderer.setPixelRatio(originalPixelRatio);
      
      // Restore camera aspect ratio
      camera.aspect = originalAspect;
      camera.updateProjectionMatrix();

      console.log(`PIXEL8D: Screenshot exported at ${options.resolution} (${options.format.toUpperCase()}, ${options.quality}% quality)`);
      
    } catch (error) {
      console.error('PIXEL8D: Export failed:', error);
    } finally {
      setIsExporting(false);
      setShowExportDialog(false);
    }
  }, []);

  const applyQualityPreset = useCallback((preset: string) => {
    const settings = QUALITY_PRESETS[preset as keyof typeof QUALITY_PRESETS];
    if (!settings || !rendererRef.current) return;

    const renderer = rendererRef.current;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, settings.pixelRatio));
    
    if (controlsRef.current) {
      controlsRef.current.dampingFactor = settings.dampingFactor;
    }

    setSmoothness(settings.dampingFactor);
    console.log('PIXEL8D: Quality preset applied:', preset);
  }, []);

  const updateCameraFromControls = useCallback(() => {
    if (!cameraRef.current || !controlsRef.current || 
        isManualUpdateRef.current || !hasInitializedRef.current || isSliderActiveRef.current) return;

    const camera = cameraRef.current;
    const position = camera.position;
    
    // Extract rotation from camera's current orientation
    const rotation = {
      roll: MathUtils.radToDeg(camera.rotation.z),
      pitch: MathUtils.radToDeg(camera.rotation.x),
      yaw: MathUtils.radToDeg(camera.rotation.y)
    };

    // Calculate focal length from current FOV
    const focalLength = calculateFocalLengthFromFOV(camera.fov, aspectRatio);

    setCameraState(prev => ({
      ...prev,
      position: { x: position.x, y: position.y, z: position.z },
      rotation,
      focalLength
    }));
  }, [aspectRatio, calculateFocalLengthFromFOV]);

  const updateCameraManually = useCallback(() => {
    if (!cameraRef.current || !controlsRef.current) return;

    console.log('PIXEL8D: Updating camera manually to:', cameraState);
    isManualUpdateRef.current = true;
    
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    const { position, rotation, focalLength } = cameraState;

    // Update camera position
    camera.position.set(position.x, position.y, position.z);

    // Update camera rotation (convert degrees to radians)
    camera.rotation.set(
      MathUtils.degToRad(rotation.pitch),
      MathUtils.degToRad(rotation.yaw),
      MathUtils.degToRad(rotation.roll)
    );

    // Update camera focal length
    const fov = calculateFOVFromFocalLength(focalLength, aspectRatio);
    camera.fov = fov;
    camera.aspect = aspectRatio;
    camera.updateProjectionMatrix();

    // Ensure OrbitControls references the correct camera
    if (controls.object !== camera) {
      controls.object = camera;
    }

    // Update OrbitControls to match the new camera state
    controls.object.position.copy(camera.position);
    controls.object.rotation.copy(camera.rotation);
    controls.target.set(0, 0, 0);
    controls.update();

    console.log('PIXEL8D: Manual camera update complete');

    // Allow OrbitControls to take over again after a brief delay
    setTimeout(() => {
      isManualUpdateRef.current = false;
    }, 50);
  }, [cameraState, aspectRatio, calculateFOVFromFocalLength]);

  const animateToPreset = useCallback((preset: CameraPreset) => {
    if (!cameraRef.current) return;

    console.log('PIXEL8D: Animating to preset:', preset.name);
    
    const startState = { ...cameraState };
    const duration = 1000;
    const startTime = performance.now();
    
    isManualUpdateRef.current = true;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Smooth easing function
      const easeProgress = 1 - Math.pow(1 - progress, 3);

      const interpolatedState: CameraState = {
        position: {
          x: startState.position.x + (preset.position.x - startState.position.x) * easeProgress,
          y: startState.position.y + (preset.position.y - startState.position.y) * easeProgress,
          z: startState.position.z + (preset.position.z - startState.position.z) * easeProgress,
        },
        rotation: {
          roll: startState.rotation.roll + (preset.rotation.roll - startState.rotation.roll) * easeProgress,
          pitch: startState.rotation.pitch + (preset.rotation.pitch - startState.rotation.pitch) * easeProgress,
          yaw: startState.rotation.yaw + (preset.rotation.yaw - startState.rotation.yaw) * easeProgress,
        },
        focalLength: startState.focalLength + (preset.focalLength - startState.focalLength) * easeProgress
      };

      setCameraState(interpolatedState);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        console.log('PIXEL8D: Preset animation complete');
        setTimeout(() => {
          isManualUpdateRef.current = false;
        }, 100);
      }
    };

    requestAnimationFrame(animate);
  }, [cameraState]);

  useEffect(() => {
    const initViewer = async () => {
      if (!canvasRef.current) return;

      try {
        console.log('PIXEL8D: Initializing viewer...');
        
        const { width, height, aspectRatio: initialAspectRatio } = getContainerDimensions();
        setAspectRatio(initialAspectRatio);
        
        const { LumaSplatsThree } = await import('@lumaai/luma-web');

        // Initialize renderer
        const qualitySettings = QUALITY_PRESETS[qualityPreset as keyof typeof QUALITY_PRESETS];
        const renderer = new WebGLRenderer({
          canvas: canvasRef.current,
          antialias: qualitySettings.antialias,
          alpha: true,
          powerPreference: "high-performance",
          preserveDrawingBuffer: true
        });
        
        const updateSize = () => {
          const { width, height, aspectRatio: newAspectRatio } = getContainerDimensions();
          
          renderer.setSize(width, height);
          setAspectRatio(newAspectRatio);
          
          if (cameraRef.current) {
            cameraRef.current.aspect = newAspectRatio;
            cameraRef.current.updateProjectionMatrix();
          }
        };
        
        updateSize();
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, qualitySettings.pixelRatio));

        const scene = new Scene();
        scene.fog = new FogExp2(new Color(0xe0e1ff), 0.02);
        
        // Create camera
        const camera = new PerspectiveCamera(75, initialAspectRatio, 0.1, 1000);
        camera.position.set(INITIAL_CAMERA_STATE.position.x, INITIAL_CAMERA_STATE.position.y, INITIAL_CAMERA_STATE.position.z);
        camera.rotation.set(
          MathUtils.degToRad(INITIAL_CAMERA_STATE.rotation.pitch),
          MathUtils.degToRad(INITIAL_CAMERA_STATE.rotation.yaw),
          MathUtils.degToRad(INITIAL_CAMERA_STATE.rotation.roll)
        );
        
        const initialFOV = calculateFOVFromFocalLength(INITIAL_CAMERA_STATE.focalLength, initialAspectRatio);
        camera.fov = initialFOV;
        camera.updateProjectionMatrix();

        // Initialize controls
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

        // Load Luma Splats
        const splats = new LumaSplatsThree({
          source: 'https://lumalabs.ai/capture/e769d12e-a0ac-4338-93bd-a82f078e0efc',
          particleRevealEnabled: true,
          enableThreeShaderIntegration: false,
          loadingAnimationEnabled: true
        });

        splats.onLoad = () => {
          console.log('PIXEL8D: Luma splats loaded successfully');
          setIsLoading(false);
          
          try {
            splats.captureCubemap(renderer).then((texture: any) => {
              if (texture) {
                scene.environment = texture;
                console.log('PIXEL8D: Environment cubemap captured');
              }
            }).catch((err: any) => {
              console.warn('PIXEL8D: Failed to capture cubemap:', err);
            });
          } catch (err) {
            console.warn('PIXEL8D: Cubemap capture not supported:', err);
          }
        };

        scene.add(splats);

        // Store references
        rendererRef.current = renderer;
        sceneRef.current = scene;
        cameraRef.current = camera;
        controlsRef.current = controls;
        splatsRef.current = splats;

        setTimeout(() => {
          hasInitializedRef.current = true;
          console.log('PIXEL8D: Camera initialization complete');
        }, 200);

        // Animation loop
        const animate = () => {
          if (rendererRef.current && sceneRef.current && controlsRef.current && cameraRef.current) {
            controlsRef.current.update();
            rendererRef.current.render(sceneRef.current, cameraRef.current);
          }
          animationIdRef.current = requestAnimationFrame(animate);
        };
        animate();

        const handleResize = () => updateSize();
        window.addEventListener('resize', handleResize);

        return () => {
          window.removeEventListener('resize', handleResize);
        };
      } catch (err) {
        console.error('PIXEL8D: Failed to initialize viewer:', err);
        setError('Failed to initialize 3D viewer. Please check your connection and try again.');
        setIsLoading(false);
      }
    };

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
  }, []);

  useEffect(() => {
    if (cameraRef.current && controlsRef.current && !hasInitializedRef.current) {
      console.log('PIXEL8D: Setting initial camera state');
      updateCameraManually();
    }
  }, [updateCameraManually]);

  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.dampingFactor = smoothness;
    }
  }, [smoothness]);

  const handleCameraChange = useCallback((updates: Partial<CameraState>) => {
    isSliderActiveRef.current = true;

    setCameraState(prev => {
      const newState = { ...prev, ...updates };
      
      if (newState.position) {
        newState.position.x = constrainValue(newState.position.x, BOUNDS.position.min, BOUNDS.position.max);
        newState.position.y = constrainValue(newState.position.y, BOUNDS.position.min, BOUNDS.position.max);
        newState.position.z = constrainValue(newState.position.z, BOUNDS.position.min, BOUNDS.position.max);
      }
      
      if (newState.rotation) {
        newState.rotation.roll = constrainValue(newState.rotation.roll, BOUNDS.rotation.min, BOUNDS.rotation.max);
        newState.rotation.pitch = constrainValue(newState.rotation.pitch, BOUNDS.rotation.min, BOUNDS.rotation.max);
        newState.rotation.yaw = constrainValue(newState.rotation.yaw, BOUNDS.rotation.min, BOUNDS.rotation.max);
      }
      
      if (newState.focalLength) {
        newState.focalLength = constrainValue(newState.focalLength, BOUNDS.focalLength.min, BOUNDS.focalLength.max);
      }
      
      return newState;
    });

    setTimeout(() => {
      updateCameraManually();
      setTimeout(() => {
        isSliderActiveRef.current = false;
      }, 100);
    }, 0);
  }, [constrainValue, updateCameraManually]);

  const resetCamera = useCallback(() => {
    console.log('PIXEL8D: Resetting camera to initial state');
    animateToPreset(RESET_CAMERA_PRESET);
  }, [animateToPreset]);

  const handlePresetSelect = useCallback((preset: CameraPreset) => {
    animateToPreset(preset);
  }, [animateToPreset]);

  // Settings handlers
  const handleQualityChange = useCallback((preset: string) => {
    setQualityPreset(preset);
    applyQualityPreset(preset);
  }, [applyQualityPreset]);

  const handleDepthBufferToggle = useCallback((enabled: boolean) => {
    setDepthBufferEnabled(enabled);
    console.log('PIXEL8D: Depth buffer setting changed to:', enabled);
  }, []);

  const handleSemanticMaskChange = useCallback((mask: string) => {
    setSemanticMask(mask);
    console.log('PIXEL8D: Semantic mask changed to:', mask);
  }, []);

  return (
    <div className="w-full h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 flex flex-col relative overflow-hidden">
      {/* Background grid pattern */}
      <div className="absolute inset-0 opacity-20 dark:opacity-10">
        <div 
          className="w-full h-full"
          style={{
            backgroundImage: `
              linear-gradient(90deg, rgb(0 0 0 / 0.1) 1px, transparent 1px),
              linear-gradient(180deg, rgb(0 0 0 / 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '45px 45px',
            backgroundPosition: '16.2px 14.4px'
          }}
        />
      </div>

      <ViewerToolbar 
        onReset={resetCamera} 
        isLoading={isLoading}
        presets={CAMERA_PRESETS}
        onPresetSelect={handlePresetSelect}
        showSettings={showSettings}
        onSettingsToggle={() => setShowSettings(prev => !prev)}
        onExportScreenshot={() => setShowExportDialog(true)}
      />
      
      <div className="flex-1 flex relative">
        <div className="flex-1 relative">
          <canvas
            ref={canvasRef}
            className="w-full h-full"
          />
          
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center backdrop-blur-md bg-white/30 dark:bg-black/30">
              <div className="glass-panel p-8 text-center">
                <div className="w-12 h-12 border-2 border-slate-600 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
                <h2 className="text-2xl font-medium mb-2 bg-gradient-to-r from-slate-900 to-slate-600 dark:from-slate-100 dark:to-slate-400 bg-clip-text text-transparent">
                  loading pixel8d
                </h2>
                <p className="text-slate-600 dark:text-slate-400 text-sm">
                  initializing gaussian splat viewer
                </p>
              </div>
            </div>
          )}

          {isExporting && (
            <div className="absolute inset-0 flex items-center justify-center backdrop-blur-md bg-white/30 dark:bg-black/30 z-50">
              <div className="glass-panel p-8 text-center">
                <div className="w-12 h-12 border-2 border-slate-600 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
                <h2 className="text-2xl font-medium mb-2 bg-gradient-to-r from-slate-900 to-slate-600 dark:from-slate-100 dark:to-slate-400 bg-clip-text text-transparent">
                  exporting image
                </h2>
                <p className="text-slate-600 dark:text-slate-400 text-sm">
                  rendering high-resolution output
                </p>
              </div>
            </div>
          )}
          
          {error && (
            <div className="absolute inset-0 flex items-center justify-center backdrop-blur-md bg-white/30 dark:bg-black/30">
              <div className="glass-panel p-8 text-center max-w-md">
                <div className="text-4xl mb-4">⚠️</div>
                <h2 className="text-xl font-medium mb-4 text-red-600 dark:text-red-400">{error}</h2>
                <button 
                  onClick={() => window.location.reload()} 
                  className="glass-button px-6 py-3 font-medium"
                >
                  retry
                </button>
              </div>
            </div>
          )}
        </div>
        
        {showSettings ? (
          <SettingsPanel
            qualityPreset={qualityPreset}
            onQualityChange={handleQualityChange}
            showGrid={showGrid}
            onGridToggle={setShowGrid}
            depthBufferEnabled={depthBufferEnabled}
            onDepthBufferToggle={handleDepthBufferToggle}
            onExportScreenshot={() => setShowExportDialog(true)}
            semanticMask={semanticMask}
            onSemanticMaskChange={handleSemanticMaskChange}
          />
        ) : (
          <CameraControls
            cameraState={cameraState}
            onCameraChange={handleCameraChange}
            bounds={BOUNDS}
            smoothness={smoothness}
            onSmoothnessChange={setSmoothness}
          />
        )}
      </div>

      {showExportDialog && (
        <ExportDialog
          isOpen={showExportDialog}
          onClose={() => setShowExportDialog(false)}
          onExport={exportScreenshot}
          isExporting={isExporting}
        />
      )}
    </div>
  );
};
