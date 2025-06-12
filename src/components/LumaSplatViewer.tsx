
import React, { useEffect, useRef, useState } from 'react';
import { LumaSplatsThree } from '@lumaai/luma-web';
import * as THREE from 'three';
import { ViewerToolbar } from './ViewerToolbar';
import { CameraControls } from './CameraControls';
import { WebXRManager } from '../utils/webXRUtils';

export const LumaSplatViewer = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const splatsRef = useRef<LumaSplatsThree | null>(null);
  const webXRManagerRef = useRef<WebXRManager | null>(null);
  const animationIdRef = useRef<number | null>(null);
  const [isVRSupported, setIsVRSupported] = useState(false);
  const [isVRActive, setIsVRActive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Performance monitoring
  const lastFrameTime = useRef(Date.now());
  const frameCount = useRef(0);

  useEffect(() => {
    const initViewer = async () => {
      if (!canvasRef.current) return;

      try {
        console.log('PIXEL8D: Initializing viewer...');

        // Create renderer with performance optimizations
        const renderer = new THREE.WebGLRenderer({
          canvas: canvasRef.current,
          antialias: false, // Disable for better performance
          alpha: true,
          powerPreference: "default", // Use integrated graphics if available
          failIfMajorPerformanceCaveat: true
        });

        // Reduce pixel ratio for better performance
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.setClearColor(0x000000, 0);

        // Performance optimizations
        renderer.shadowMap.enabled = false;
        renderer.physicallyCorrectLights = false;

        rendererRef.current = renderer;

        // Create scene
        const scene = new THREE.Scene();
        sceneRef.current = scene;

        // Create camera
        const camera = new THREE.PerspectiveCamera(
          75,
          window.innerWidth / window.innerHeight,
          0.1,
          1000
        );
        camera.position.set(0, 0, 5);
        cameraRef.current = camera;

        // Load Luma splats with reduced quality for performance
        const splats = new LumaSplatsThree({
          source: 'https://lumalabs.ai/capture/e769d12e-a0ac-4338-93bd-a82f078e0efc',
          particleRevealEnabled: true,
          enableThreeShaderIntegration: false, // Disable for better performance
          loadingAnimationEnabled: true
        });

        scene.add(splats);
        splatsRef.current = splats;

        // Wait for splats to load
        await new Promise((resolve) => {
          const checkLoaded = () => {
            if (splats.captureBbox) {
              console.log('PIXEL8D: Luma splats loaded successfully');
              resolve(void 0);
            } else {
              setTimeout(checkLoaded, 100);
            }
          };
          checkLoaded();
        });

        // Check VR support
        const vrSupported = await WebXRManager.isVRSupported();
        console.log('PIXEL8D: VR supported:', vrSupported);
        setIsVRSupported(vrSupported);

        // Initialize WebXR manager (lazy initialization)
        if (vrSupported) {
          webXRManagerRef.current = new WebXRManager(
            renderer,
            camera,
            scene,
            {
              onSessionStart: () => setIsVRActive(true),
              onSessionEnd: () => setIsVRActive(false)
            }
          );
          await webXRManagerRef.current.initializeVR();
        }

        setIsLoading(false);

        // Optimized animation loop with frame limiting
        const animate = () => {
          const now = Date.now();
          const deltaTime = now - lastFrameTime.current;
          
          // Limit to ~30 FPS to reduce load
          if (deltaTime >= 33) {
            frameCount.current++;
            
            // Skip frames if performance is poor
            if (frameCount.current % 2 === 0 || deltaTime > 50) {
              renderer.render(scene, camera);
              lastFrameTime.current = now;
            }
          }
          
          animationIdRef.current = requestAnimationFrame(animate);
        };

        animate();

        // Handle window resize with throttling
        let resizeTimeout: NodeJS.Timeout;
        const handleResize = () => {
          clearTimeout(resizeTimeout);
          resizeTimeout = setTimeout(() => {
            if (camera && renderer) {
              camera.aspect = window.innerWidth / window.innerHeight;
              camera.updateProjectionMatrix();
              renderer.setSize(window.innerWidth, window.innerHeight);
            }
          }, 250);
        };

        window.addEventListener('resize', handleResize);

        return () => {
          window.removeEventListener('resize', handleResize);
          clearTimeout(resizeTimeout);
        };

      } catch (error) {
        console.error('PIXEL8D: Failed to initialize viewer:', error);
        setIsLoading(false);
      }
    };

    initViewer();

    return () => {
      // Cleanup
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      
      if (splatsRef.current) {
        splatsRef.current.dispose?.();
      }
      
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
    };
  }, []);

  const handleEnterVR = async () => {
    if (webXRManagerRef.current) {
      const success = await webXRManagerRef.current.enterVR();
      if (!success) {
        console.warn('Failed to enter VR mode');
      }
    }
  };

  const handleExitVR = () => {
    if (webXRManagerRef.current) {
      webXRManagerRef.current.exitVR();
    }
  };

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur z-50">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
            <p className="text-white text-lg">Loading 3D Scene...</p>
            <p className="text-white/70 text-sm">Optimizing for performance...</p>
          </div>
        </div>
      )}

      <canvas
        ref={canvasRef}
        className="w-full h-full block"
        style={{ touchAction: 'none' }}
      />

      <ViewerToolbar 
        isVRSupported={isVRSupported}
        isVRActive={isVRActive}
        onEnterVR={handleEnterVR}
        onExitVR={handleExitVR}
      />

      <CameraControls 
        camera={cameraRef.current}
        renderer={rendererRef.current}
        canvas={canvasRef.current}
      />
    </div>
  );
};
