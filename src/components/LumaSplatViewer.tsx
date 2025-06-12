
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { WebGLRenderer, PerspectiveCamera, Scene, Vector3, MathUtils, FogExp2, Color } from 'three';
import { OrbitControls } from 'three-stdlib';
import { CameraControls } from './CameraControls';
import { ViewerToolbar } from './ViewerToolbar';

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
  position: { x: 0, y: 0, z: 2 },
  rotation: { roll: 0, pitch: 0, yaw: 0 },
  focalLength: 30.56
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

export const LumaSplatViewer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<WebGLRenderer | null>(null);
  const sceneRef = useRef<Scene | null>(null);
  const cameraRef = useRef<PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const splatsRef = useRef<any>(null);
  const animationIdRef = useRef<number>();
  const isManualUpdateRef = useRef(false);

  const [cameraState, setCameraState] = useState<CameraState>(INITIAL_CAMERA_STATE);
  const [aspectRatio, setAspectRatio] = useState(16/9); // Default aspect ratio
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [smoothness, setSmoothness] = useState(0.1);

  const constrainValue = useCallback((value: number, min: number, max: number) => {
    return MathUtils.clamp(value, min, max);
  }, []);

  // Helper function to calculate FOV from focal length with proper aspect ratio
  const calculateFOVFromFocalLength = useCallback((focalLength: number, currentAspectRatio: number) => {
    // Use the sensor height (24mm for full frame) adjusted for aspect ratio
    const sensorHeight = 24;
    const fov = 2 * Math.atan(sensorHeight / (2 * focalLength)) * (180 / Math.PI);
    return Math.max(10, Math.min(120, fov)); // Clamp FOV to reasonable bounds
  }, []);

  // Helper function to calculate focal length from FOV with proper aspect ratio
  const calculateFocalLengthFromFOV = useCallback((fov: number, currentAspectRatio: number) => {
    const sensorHeight = 24;
    return sensorHeight / (2 * Math.tan(MathUtils.degToRad(fov / 2)));
  }, []);

  // Get container dimensions and calculate aspect ratio
  const getContainerDimensions = useCallback(() => {
    const container = canvasRef.current?.parentElement;
    if (container) {
      const width = container.clientWidth;
      const height = container.clientHeight;
      const newAspectRatio = width / height;
      
      // Ensure aspect ratio is valid
      if (isFinite(newAspectRatio) && newAspectRatio > 0) {
        return { width, height, aspectRatio: newAspectRatio };
      }
    }
    return { width: 1920, height: 1080, aspectRatio: 16/9 }; // Fallback
  }, []);

  const updateCameraFromControls = useCallback(() => {
    if (!cameraRef.current || !controlsRef.current || isManualUpdateRef.current) return;

    const camera = cameraRef.current;
    const position = camera.position;
    
    // Extract rotation from camera's current orientation
    const rotation = {
      roll: MathUtils.radToDeg(camera.rotation.z),
      pitch: MathUtils.radToDeg(camera.rotation.x),
      yaw: MathUtils.radToDeg(camera.rotation.y)
    };

    // Calculate focal length from current FOV using proper aspect ratio
    const focalLength = calculateFocalLengthFromFOV(camera.fov, aspectRatio);

    setCameraState({
      position: { x: position.x, y: position.y, z: position.z },
      rotation,
      focalLength
    });
  }, [aspectRatio, calculateFocalLengthFromFOV]);

  const updateCameraManually = useCallback(() => {
    if (!cameraRef.current || !controlsRef.current) return;

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

    // Update camera focal length with proper aspect ratio handling
    const fov = calculateFOVFromFocalLength(focalLength, aspectRatio);
    camera.fov = fov;
    
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
  }, [cameraState, aspectRatio, calculateFOVFromFocalLength]);

  const animateToPreset = useCallback((preset: CameraPreset) => {
    if (!cameraRef.current) return;

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
        focalLength: startState.focalLength + (preset.focalLength - startState.focalLength) * easeProgress
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
  }, [cameraState]);

  useEffect(() => {
    const initViewer = async () => {
      if (!canvasRef.current) return;

      try {
        console.log('PIXEL8D: Initializing viewer...');
        
        // Get initial container dimensions and aspect ratio
        const { width, height, aspectRatio: initialAspectRatio } = getContainerDimensions();
        setAspectRatio(initialAspectRatio);
        
        // Dynamically import the Luma library
        const { LumaSplatsThree } = await import('@lumaai/luma-web');

        // Initialize Three.js scene with performance optimizations
        const renderer = new WebGLRenderer({
          canvas: canvasRef.current,
          antialias: false, // Luma performance recommendation
          alpha: true,
          powerPreference: "high-performance"
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
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        const scene = new Scene();
        
        // Add atmospheric fog for enhanced visuals
        scene.fog = new FogExp2(new Color(0xe0e1ff), 0.02);
        
        // Create camera with proper initial aspect ratio
        const camera = new PerspectiveCamera(75, initialAspectRatio, 0.1, 1000);

        // Initialize OrbitControls with proper bounds
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = smoothness;
        controls.screenSpacePanning = false;
        
        // Set bounded controls to prevent camera chaos
        controls.minDistance = 0.5;
        controls.maxDistance = 15;
        controls.maxPolarAngle = Math.PI; // Allow full rotation
        controls.minPolarAngle = 0;
        controls.enablePan = true;
        controls.panSpeed = 0.8;
        controls.rotateSpeed = 0.5;
        controls.zoomSpeed = 0.8;

        // Add event listener for controls change
        controls.addEventListener('change', updateCameraFromControls);

        // Load Luma Splats with proper error handling
        const splats = new LumaSplatsThree({
          source: 'https://lumalabs.ai/capture/e769d12e-a0ac-4338-93bd-a82f078e0efc',
          particleRevealEnabled: true,
          enableThreeShaderIntegration: false, // Performance optimization
          loadingAnimationEnabled: true
        });

        // Handle successful load
        splats.onLoad = () => {
          console.log('PIXEL8D: Luma splats loaded successfully');
          setIsLoading(false);
          
          // Capture cubemap for realistic lighting
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

        // Animation loop
        const animate = () => {
          if (rendererRef.current && sceneRef.current && cameraRef.current && controlsRef.current) {
            controlsRef.current.update();
            rendererRef.current.render(sceneRef.current, cameraRef.current);
          }
          animationIdRef.current = requestAnimationFrame(animate);
        };
        animate();

        // Handle resize with proper aspect ratio updates
        const handleResize = () => updateSize();
        window.addEventListener('resize', handleResize);

        return () => {
          window.removeEventListener('resize', handleResize);
          controls.removeEventListener('change', updateCameraFromControls);
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
  }, [updateCameraFromControls, getContainerDimensions]);

  useEffect(() => {
    updateCameraManually();
  }, [updateCameraManually]);

  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.dampingFactor = smoothness;
    }
  }, [smoothness]);

  const handleCameraChange = useCallback((updates: Partial<CameraState>) => {
    setCameraState(prev => {
      const newState = { ...prev, ...updates };
      
      // Apply constraints
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
  }, [constrainValue]);

  const resetCamera = useCallback(() => {
    animateToPreset({
      name: 'Reset',
      ...INITIAL_CAMERA_STATE
    });
  }, [animateToPreset]);

  const handlePresetSelect = useCallback((preset: CameraPreset) => {
    animateToPreset(preset);
  }, [animateToPreset]);

  return (
    <div className="w-full h-screen bg-background flex flex-col">
      <ViewerToolbar 
        onReset={resetCamera} 
        isLoading={isLoading}
        presets={CAMERA_PRESETS}
        onPresetSelect={handlePresetSelect}
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
        
        <CameraControls
          cameraState={cameraState}
          onCameraChange={handleCameraChange}
          bounds={BOUNDS}
          smoothness={smoothness}
          onSmoothnessChange={setSmoothness}
        />
      </div>
    </div>
  );
};
