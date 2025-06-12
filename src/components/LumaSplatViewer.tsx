
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { WebGLRenderer, PerspectiveCamera, Scene, Vector3, MathUtils } from 'three';
import { LumaSplatsThree } from '@lumaai/luma-web';
import { CameraControls } from './CameraControls';
import { ViewerToolbar } from './ViewerToolbar';

interface CameraState {
  position: { x: number; y: number; z: number };
  rotation: { roll: number; pitch: number; yaw: number };
  focalLength: number;
}

const INITIAL_CAMERA_STATE: CameraState = {
  position: { x: 0, y: 0, z: 2 },
  rotation: { roll: 0, pitch: 0, yaw: 0 },
  focalLength: 30.56
};

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
  const splatsRef = useRef<LumaSplatsThree | null>(null);
  const animationIdRef = useRef<number>();

  const [cameraState, setCameraState] = useState<CameraState>(INITIAL_CAMERA_STATE);
  const [isLoading, setIsLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [lastMousePosition, setLastMousePosition] = useState({ x: 0, y: 0 });

  const constrainValue = useCallback((value: number, min: number, max: number) => {
    return MathUtils.clamp(value, min, max);
  }, []);

  const updateCamera = useCallback(() => {
    if (!cameraRef.current) return;

    const camera = cameraRef.current;
    const { position, rotation, focalLength } = cameraState;

    // Update camera position
    camera.position.set(position.x, position.y, position.z);

    // Update camera rotation (convert degrees to radians)
    camera.rotation.set(
      MathUtils.degToRad(rotation.pitch),
      MathUtils.degToRad(rotation.yaw),
      MathUtils.degToRad(rotation.roll)
    );

    // Update camera focal length (affects FOV)
    const fov = (2 * Math.atan(36 / (2 * focalLength))) * (180 / Math.PI);
    camera.fov = fov;
    camera.updateProjectionMatrix();
  }, [cameraState]);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Initialize Three.js scene
    const renderer = new WebGLRenderer({
      canvas: canvasRef.current,
      antialias: false,
      alpha: true
    });
    renderer.setSize(800, 600);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const scene = new Scene();
    
    const camera = new PerspectiveCamera(75, 800 / 600, 0.1, 1000);

    // Load Luma Splats
    const splats = new LumaSplatsThree({
      source: 'https://lumalabs.ai/capture/e769d12e-a0ac-4338-93bd-a82f078e0efc',
      particleRevealEnabled: true,
      enableThreeShaderIntegration: true
    });

    splats.onLoad = () => {
      console.log('Luma splats loaded successfully');
      setIsLoading(false);
    };

    scene.add(splats);

    // Store references
    rendererRef.current = renderer;
    sceneRef.current = scene;
    cameraRef.current = camera;
    splatsRef.current = splats;

    // Animation loop
    const animate = () => {
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
      animationIdRef.current = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      renderer.dispose();
    };
  }, []);

  useEffect(() => {
    updateCamera();
  }, [updateCamera]);

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

  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    setIsDragging(true);
    setLastMousePosition({ x: event.clientX, y: event.clientY });
  }, []);

  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    if (!isDragging) return;

    const deltaX = event.clientX - lastMousePosition.x;
    const deltaY = event.clientY - lastMousePosition.y;

    handleCameraChange({
      rotation: {
        ...cameraState.rotation,
        yaw: cameraState.rotation.yaw + deltaX * 0.5,
        pitch: cameraState.rotation.pitch - deltaY * 0.5
      }
    });

    setLastMousePosition({ x: event.clientX, y: event.clientY });
  }, [isDragging, lastMousePosition, cameraState.rotation, handleCameraChange]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleWheel = useCallback((event: React.WheelEvent) => {
    event.preventDefault();
    const delta = event.deltaY * 0.01;
    handleCameraChange({
      position: {
        ...cameraState.position,
        z: cameraState.position.z + delta
      }
    });
  }, [cameraState.position, handleCameraChange]);

  const resetCamera = useCallback(() => {
    setCameraState(INITIAL_CAMERA_STATE);
  }, []);

  return (
    <div className="w-full h-screen bg-background flex flex-col">
      <ViewerToolbar onReset={resetCamera} isLoading={isLoading} />
      
      <div className="flex-1 flex">
        <div className="flex-1 relative">
          <canvas
            ref={canvasRef}
            className="w-full h-full cursor-grab active:cursor-grabbing"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
          />
          
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading Gaussian Splats...</p>
              </div>
            </div>
          )}
        </div>
        
        <CameraControls
          cameraState={cameraState}
          onCameraChange={handleCameraChange}
          bounds={BOUNDS}
        />
      </div>
    </div>
  );
};
