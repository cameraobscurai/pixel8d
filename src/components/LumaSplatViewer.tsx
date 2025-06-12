import React, { useRef, useEffect, useState, useCallback } from 'react';
import { WebGLRenderer, PerspectiveCamera, OrthographicCamera, Scene, Vector3, MathUtils, FogExp2, Color, Camera, Box3 } from 'three';
import { OrbitControls } from 'three-stdlib';
import { CameraControls } from './CameraControls';
import { ViewerToolbar } from './ViewerToolbar';
import { SettingsPanel } from './SettingsPanel';
import { ExportDialog } from './ExportDialog';

interface CameraState {
  position: { x: number; y: number; z: number };
  rotation: { roll: number; pitch: number; yaw: number };
  focalLength: number;
  orthographicZoom: number;
}

interface CameraPreset {
  name: string;
  position: { x: number; y: number; z: number };
  rotation: { roll: number; pitch: number; yaw: number };
  focalLength: number;
  orthographicZoom: number;
}

const INITIAL_CAMERA_STATE: CameraState = {
  position: { x: -2.76, y: 0.03, z: -2.25 },
  rotation: { roll: -179.35, pitch: -179.16, yaw: -50.84 },
  focalLength: 20.10,
  orthographicZoom: 1.0
};

const CAMERA_PRESETS: CameraPreset[] = [
  { name: 'Front', position: { x: 0, y: 0, z: 3 }, rotation: { roll: 0, pitch: 0, yaw: 0 }, focalLength: 35, orthographicZoom: 1.0 },
  { name: 'Side', position: { x: 3, y: 0, z: 0 }, rotation: { roll: 0, pitch: 0, yaw: 90 }, focalLength: 35, orthographicZoom: 1.0 },
  { name: 'Top', position: { x: 0, y: 3, z: 0 }, rotation: { roll: 0, pitch: -90, yaw: 0 }, focalLength: 35, orthographicZoom: 1.0 },
  { name: 'Perspective', position: { x: 2, y: 1, z: 2 }, rotation: { roll: 0, pitch: -15, yaw: 45 }, focalLength: 28, orthographicZoom: 0.8 }
];

const BOUNDS = {
  position: { min: -10, max: 10 },
  rotation: { min: -180, max: 180 },
  focalLength: { min: 10, max: 100 },
  orthographicZoom: { min: 0.1, max: 5.0 }
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
  const perspectiveCameraRef = useRef<PerspectiveCamera | null>(null);
  const orthographicCameraRef = useRef<OrthographicCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const splatsRef = useRef<any>(null);
  const animationIdRef = useRef<number>();
  const isManualUpdateRef = useRef(false);
  const hasInitializedRef = useRef(false);
  const debounceTimerRef = useRef<NodeJS.Timeout>();
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const [cameraState, setCameraState] = useState<CameraState>(INITIAL_CAMERA_STATE);
  const [aspectRatio, setAspectRatio] = useState(16/9);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [smoothness, setSmoothness] = useState(0.1);
  const [isOrthographic, setIsOrthographic] = useState(false);
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

  const getCurrentCamera = useCallback((): Camera | null => {
    return isOrthographic ? orthographicCameraRef.current : perspectiveCameraRef.current;
  }, [isOrthographic]);

  const updateOrthographicCamera = useCallback(() => {
    if (!orthographicCameraRef.current || !splatsRef.current) return;

    const camera = orthographicCameraRef.current;
    const bbox = new Box3().setFromObject(splatsRef.current);
    const size = bbox.getSize(new Vector3());
    const maxDim = Math.max(size.x, size.y, size.z) || 5; // Fallback to 5 if no size
    
    const zoom = cameraState.orthographicZoom;
    const frustumSize = maxDim * 2 / zoom;
    
    camera.left = -frustumSize * aspectRatio / 2;
    camera.right = frustumSize * aspectRatio / 2;
    camera.top = frustumSize / 2;
    camera.bottom = -frustumSize / 2;
    camera.updateProjectionMatrix();
  }, [cameraState.orthographicZoom, aspectRatio]);

  const switchCameraMode = useCallback(() => {
    const currentCamera = getCurrentCamera();
    if (!currentCamera || !controlsRef.current) return;

    // Store current camera state
    const currentPos = currentCamera.position.clone();
    const currentRot = currentCamera.rotation.clone();

    setIsOrthographic(prev => {
      const newMode = !prev;
      const newCamera = newMode ? orthographicCameraRef.current : perspectiveCameraRef.current;
      
      if (newCamera) {
        // Transfer position and rotation
        newCamera.position.copy(currentPos);
        newCamera.rotation.copy(currentRot);
        
        if (newMode) {
          updateOrthographicCamera();
        } else {
          const fov = calculateFOVFromFocalLength(cameraState.focalLength, aspectRatio);
          (newCamera as PerspectiveCamera).fov = fov;
          newCamera.updateProjectionMatrix();
        }

        // Update controls to use new camera
        controlsRef.current!.object = newCamera;
        controlsRef.current!.update();
      }
      
      return newMode;
    });
  }, [getCurrentCamera, updateOrthographicCamera, calculateFOVFromFocalLength, cameraState.focalLength, aspectRatio]);

  const exportScreenshot = useCallback(async (options: { 
    resolution: string; 
    quality: number; 
    format: 'png' | 'jpeg';
    filename?: string;
  }) => {
    if (!rendererRef.current || !sceneRef.current) return;

    const renderer = rendererRef.current;
    const scene = sceneRef.current;
    const camera = getCurrentCamera();
    
    if (!camera) return;

    setIsExporting(true);

    try {
      // Parse resolution
      const [width, height] = options.resolution.split('x').map(Number);
      
      // Store original renderer size
      const originalSize = renderer.getSize(new Vector3());
      const originalPixelRatio = renderer.getPixelRatio();

      // Create high-resolution render target
      const pixelRatio = Math.min(window.devicePixelRatio, 2); // Cap at 2x for performance
      const renderWidth = width * pixelRatio;
      const renderHeight = height * pixelRatio;

      // Temporarily update renderer for high-res capture
      renderer.setSize(renderWidth, renderHeight, false);
      renderer.setPixelRatio(1); // We handle pixel ratio manually

      // Update camera aspect ratio temporarily
      const originalAspect = camera.aspect;
      camera.aspect = width / height;
      
      if (camera instanceof PerspectiveCamera) {
        camera.updateProjectionMatrix();
      } else if (camera instanceof OrthographicCamera) {
        const bbox = new Box3().setFromObject(splatsRef.current);
        const size = bbox.getSize(new Vector3());
        const maxDim = Math.max(size.x, size.y, size.z) || 5;
        
        const zoom = cameraState.orthographicZoom;
        const frustumSize = maxDim * 2 / zoom;
        
        camera.left = -frustumSize * (width / height) / 2;
        camera.right = frustumSize * (width / height) / 2;
        camera.top = frustumSize / 2;
        camera.bottom = -frustumSize / 2;
        camera.updateProjectionMatrix();
      }

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
      if (camera instanceof PerspectiveCamera) {
        camera.updateProjectionMatrix();
      } else if (camera instanceof OrthographicCamera) {
        updateOrthographicCamera();
      }

      console.log(`PIXEL8D: Screenshot exported at ${options.resolution} (${options.format.toUpperCase()}, ${options.quality}% quality)`);
      
    } catch (error) {
      console.error('PIXEL8D: Export failed:', error);
      // TODO: Show error toast
    } finally {
      setIsExporting(false);
      setShowExportDialog(false);
    }
  }, [getCurrentCamera, cameraState.orthographicZoom, updateOrthographicCamera]);

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
    if (!perspectiveCameraRef.current || !orthographicCameraRef.current || !controlsRef.current || isManualUpdateRef.current || !hasInitializedRef.current) return;

    const camera = getCurrentCamera();
    if (!camera) return;

    const position = camera.position;
    
    // Extract rotation from camera's current orientation
    const rotation = {
      roll: MathUtils.radToDeg(camera.rotation.z),
      pitch: MathUtils.radToDeg(camera.rotation.x),
      yaw: MathUtils.radToDeg(camera.rotation.y)
    };

    // Calculate focal length from current FOV using proper aspect ratio
    const focalLength = calculateFocalLengthFromFOV(camera.fov, aspectRatio);

    setCameraState(prev => ({
      ...prev,
      position: { x: position.x, y: position.y, z: position.z },
      rotation,
      focalLength
    }));
  }, [aspectRatio, calculateFocalLengthFromFOV, getCurrentCamera]);

  const updateCameraManually = useCallback(() => {
    if (!perspectiveCameraRef.current || !orthographicCameraRef.current || !controlsRef.current) return;

    console.log('PIXEL8D: Updating camera manually to:', cameraState);
    isManualUpdateRef.current = true;
    
    const camera = getCurrentCamera();
    if (!camera) return;

    const controls = controlsRef.current;
    const { position, rotation, focalLength, orthographicZoom } = cameraState;

    // Update camera position
    camera.position.set(position.x, position.y, position.z);

    // Update camera rotation (convert degrees to radians)
    camera.rotation.set(
      MathUtils.degToRad(rotation.pitch),
      MathUtils.degToRad(rotation.yaw),
      MathUtils.degToRad(rotation.roll)
    );

    if (!isOrthographic) {
      // Update camera focal length with proper aspect ratio handling
      const fov = calculateFOVFromFocalLength(focalLength, aspectRatio);
      (camera as PerspectiveCamera).fov = fov;
    } else {
      updateOrthographicCamera();
    }
    
    // Ensure aspect ratio is properly set
    camera.aspect = aspectRatio;
    camera.updateProjectionMatrix();

    // Update OrbitControls to match the new camera state
    controls.object.position.copy(camera.position);
    controls.object.rotation.copy(camera.rotation);
    controls.target.set(0, 0, 0);
    controls.update();

    // Allow OrbitControls to take over again after a brief delay
    setTimeout(() => {
      isManualUpdateRef.current = false;
    }, 100);
  }, [cameraState, aspectRatio, calculateFOVFromFocalLength, isOrthographic, updateOrthographicCamera, getCurrentCamera]);

  const animateToPreset = useCallback((preset: CameraPreset) => {
    if (!perspectiveCameraRef.current || !orthographicCameraRef.current) return;

    const startState = { ...cameraState };
    const duration = 1000; // 1 second
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
        focalLength: startState.focalLength + (preset.focalLength - startState.focalLength) * easeProgress,
        orthographicZoom: startState.orthographicZoom + (preset.orthographicZoom - startState.orthographicZoom) * easeProgress
      };

      setCameraState(interpolatedState);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Re-enable OrbitControls after animation completes
        setTimeout(() => {
          isManualUpdateRef.current = false;
        }, 100);
      }
    };

    requestAnimationFrame(animate);
  }, [cameraState, perspectiveCameraRef, orthographicCameraRef]);

  useEffect(() => {
    const initViewer = async () => {
      if (!canvasRef.current) return;

      try {
        console.log('PIXEL8D: Initializing viewer...');
        
        const { width, height, aspectRatio: initialAspectRatio } = getContainerDimensions();
        setAspectRatio(initialAspectRatio);
        
        const { LumaSplatsThree } = await import('@lumaai/luma-web');

        // Initialize renderer with quality preset
        const qualitySettings = QUALITY_PRESETS[qualityPreset as keyof typeof QUALITY_PRESETS];
        const renderer = new WebGLRenderer({
          canvas: canvasRef.current,
          antialias: qualitySettings.antialias,
          alpha: true,
          powerPreference: "high-performance",
          preserveDrawingBuffer: true // Enable for screenshots
        });
        
        const updateSize = () => {
          const { width, height, aspectRatio: newAspectRatio } = getContainerDimensions();
          
          renderer.setSize(width, height);
          setAspectRatio(newAspectRatio);
          
          // Update both cameras
          if (perspectiveCameraRef.current) {
            perspectiveCameraRef.current.aspect = newAspectRatio;
            perspectiveCameraRef.current.updateProjectionMatrix();
          }
          
          if (orthographicCameraRef.current) {
            updateOrthographicCamera();
          }
        };
        
        updateSize();
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, qualitySettings.pixelRatio));

        const scene = new Scene();
        scene.fog = new FogExp2(new Color(0xe0e1ff), 0.02);
        
        // Create both cameras
        const perspectiveCamera = new PerspectiveCamera(75, initialAspectRatio, 0.1, 1000);
        const orthographicCamera = new OrthographicCamera(-5, 5, 5, -5, 0.1, 1000);
        
        // Set initial positions for both cameras
        [perspectiveCamera, orthographicCamera].forEach(camera => {
          camera.position.set(INITIAL_CAMERA_STATE.position.x, INITIAL_CAMERA_STATE.position.y, INITIAL_CAMERA_STATE.position.z);
          camera.rotation.set(
            MathUtils.degToRad(INITIAL_CAMERA_STATE.rotation.pitch),
            MathUtils.degToRad(INITIAL_CAMERA_STATE.rotation.yaw),
            MathUtils.degToRad(INITIAL_CAMERA_STATE.rotation.roll)
          );
        });
        
        const initialFOV = calculateFOVFromFocalLength(INITIAL_CAMERA_STATE.focalLength, initialAspectRatio);
        perspectiveCamera.fov = initialFOV;
        perspectiveCamera.updateProjectionMatrix();

        // Initialize controls with perspective camera
        const controls = new OrbitControls(perspectiveCamera, renderer.domElement);
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

        // Load Luma Splats with optimizations
        const splats = new LumaSplatsThree({
          source: 'https://lumalabs.ai/capture/e769d12e-a0ac-4338-93bd-a82f078e0efc',
          particleRevealEnabled: true,
          enableThreeShaderIntegration: false,
          loadingAnimationEnabled: true
        });

        // Apply depth buffer fix when loaded
        splats.onLoad = () => {
          console.log('PIXEL8D: Luma splats loaded successfully');
          setIsLoading(false);
          
          // Update orthographic camera bounds based on loaded splat
          updateOrthographicCamera();
          
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
        perspectiveCameraRef.current = perspectiveCamera;
        orthographicCameraRef.current = orthographicCamera;
        controlsRef.current = controls;
        splatsRef.current = splats;

        setTimeout(() => {
          hasInitializedRef.current = true;
          console.log('PIXEL8D: Camera initialization complete');
        }, 200);

        // Animation loop
        const animate = () => {
          if (rendererRef.current && sceneRef.current && controlsRef.current) {
            controlsRef.current.update();
            const currentCamera = getCurrentCamera();
            if (currentCamera) {
              rendererRef.current.render(sceneRef.current, currentCamera);
            }
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
    if (getCurrentCamera() && controlsRef.current && !hasInitializedRef.current) {
      console.log('PIXEL8D: Setting initial camera state');
      updateCameraManually();
    }
  }, [updateCameraManually, getCurrentCamera]);

  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.dampingFactor = smoothness;
    }
  }, [smoothness]);

  const handleCameraChange = useCallback((updates: Partial<CameraState>) => {
    // Clear any existing debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

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

      if (newState.orthographicZoom) {
        newState.orthographicZoom = constrainValue(newState.orthographicZoom, BOUNDS.orthographicZoom.min, BOUNDS.orthographicZoom.max);
      }
      
      return newState;
    });

    // Debounce the camera update to reduce jumpiness
    debounceTimerRef.current = setTimeout(() => {
      updateCameraManually();
    }, 50);
  }, [constrainValue, updateCameraManually]);

  const resetCamera = useCallback(() => {
    const preset = { name: 'Reset', ...INITIAL_CAMERA_STATE };
    animateToPreset(preset);
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
    // Note: Direct material access removed due to API limitations
    console.log('PIXEL8D: Depth buffer setting changed to:', enabled);
  }, []);

  const handleSemanticMaskChange = useCallback((mask: string) => {
    setSemanticMask(mask);
    // TODO: Implement semantic mask filtering
    console.log('PIXEL8D: Semantic mask changed to:', mask);
  }, []);

  return (
    <div className="w-full h-screen bg-background flex flex-col">
      <ViewerToolbar 
        onReset={resetCamera} 
        isLoading={isLoading}
        presets={CAMERA_PRESETS}
        onPresetSelect={handlePresetSelect}
        isOrthographic={isOrthographic}
        onCameraModeToggle={switchCameraMode}
        showSettings={showSettings}
        onSettingsToggle={() => setShowSettings(prev => !prev)}
        onExportScreenshot={() => setShowExportDialog(true)}
      />
      
      <div className="flex-1 flex">
        <div className="flex-1 relative">
          <canvas
            ref={canvasRef}
            className="w-full h-full"
          />
          
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading PIXEL8D...</p>
                <p className="text-xs text-muted-foreground mt-2">Initializing Gaussian Splat viewer</p>
              </div>
            </div>
          )}

          {isExporting && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-50">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-muted-foreground">Exporting high-resolution image...</p>
                <p className="text-xs text-muted-foreground mt-2">Please wait while we render your image</p>
              </div>
            </div>
          )}
          
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80">
              <div className="text-center max-w-md p-6">
                <p className="text-destructive mb-4">⚠️ {error}</p>
                <button 
                  onClick={() => window.location.reload()} 
                  className="bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90 transition-colors"
                >
                  Retry
                </button>
              </div>
            </div>
          )}
        </div>
        
        {showSettings ? (
          <SettingsPanel
            isOrthographic={isOrthographic}
            onCameraModeChange={setIsOrthographic}
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
            isOrthographic={isOrthographic}
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
