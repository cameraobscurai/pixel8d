
import { WebGLRenderer, PerspectiveCamera, Scene } from 'three';

export interface VRSession {
  isActive: boolean;
  session: XRSession | null;
}

export class WebXRManager {
  private renderer: WebGLRenderer;
  private camera: PerspectiveCamera;
  private scene: Scene;
  private vrSession: VRSession = { isActive: false, session: null };
  private onSessionStart?: () => void;
  private onSessionEnd?: () => void;

  constructor(
    renderer: WebGLRenderer, 
    camera: PerspectiveCamera, 
    scene: Scene,
    callbacks?: {
      onSessionStart?: () => void;
      onSessionEnd?: () => void;
    }
  ) {
    this.renderer = renderer;
    this.camera = camera;
    this.scene = scene;
    this.onSessionStart = callbacks?.onSessionStart;
    this.onSessionEnd = callbacks?.onSessionEnd;
  }

  static isVRSupported(): Promise<boolean> {
    if (!navigator.xr) {
      return Promise.resolve(false);
    }
    
    return navigator.xr.isSessionSupported('immersive-vr')
      .then((supported) => supported)
      .catch(() => false);
  }

  async initializeVR(): Promise<boolean> {
    try {
      // Enable XR in renderer
      this.renderer.xr.enabled = true;
      
      // Set up VR-specific optimizations for Quest 3
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      
      // Configure for high refresh rate displays (Quest 3 supports 90Hz/120Hz)
      this.renderer.xr.setFrameRate(90);
      
      return true;
    } catch (error) {
      console.warn('VR initialization failed:', error);
      return false;
    }
  }

  async enterVR(): Promise<boolean> {
    if (!navigator.xr) {
      console.warn('WebXR not supported');
      return false;
    }

    try {
      const session = await navigator.xr.requestSession('immersive-vr', {
        requiredFeatures: ['local-floor'],
        optionalFeatures: ['hand-tracking', 'layers']
      });

      await this.renderer.xr.setSession(session);
      
      this.vrSession = { isActive: true, session };
      
      // Set up theater mode camera for Quest 3
      this.setupTheaterMode();
      
      session.addEventListener('end', () => {
        this.vrSession = { isActive: false, session: null };
        this.onSessionEnd?.();
      });

      this.onSessionStart?.();
      return true;
    } catch (error) {
      console.error('Failed to enter VR:', error);
      return false;
    }
  }

  exitVR(): void {
    if (this.vrSession.session) {
      this.vrSession.session.end();
    }
  }

  private setupTheaterMode(): void {
    // Position camera for optimal theater viewing
    // This creates a 360° viewing experience optimized for Quest 3
    this.camera.position.set(0, 1.6, 0); // Standard eye height
    this.camera.fov = 90; // Wide FOV for immersive experience
    this.camera.updateProjectionMatrix();
  }

  getVRSession(): VRSession {
    return this.vrSession;
  }

  isVRActive(): boolean {
    return this.vrSession.isActive;
  }

  // Theater mode presets for different viewing experiences
  setTheaterMode(mode: '180' | '360' | 'standard'): void {
    switch (mode) {
      case '180':
        // Half-sphere viewing for 180° content
        this.camera.fov = 110;
        break;
      case '360':
        // Full sphere viewing for 360° content
        this.camera.fov = 120;
        break;
      case 'standard':
        // Standard VR viewing
        this.camera.fov = 90;
        break;
    }
    this.camera.updateProjectionMatrix();
  }
}
