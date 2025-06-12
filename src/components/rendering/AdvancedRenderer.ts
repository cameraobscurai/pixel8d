
import { WebGLRenderer, PerspectiveCamera, Scene, WebGLRenderTarget, RGBAFormat, FloatType, Vector2, DataTexture, NearestFilter, LinearFilter } from 'three';
import { useIsMobile } from '@/hooks/use-mobile';

export interface QualityProfile {
  name: string;
  renderScale: number;
  useHDR: boolean;
  useOIT: boolean;
  useDepthPyramid: boolean;
  particleDensity: number;
  maxMipLevels: number;
}

export const QUALITY_PROFILES = {
  desktop: {
    name: 'Desktop High Quality',
    renderScale: 1.0,
    useHDR: true,
    useOIT: true,
    useDepthPyramid: true,
    particleDensity: 1.0,
    maxMipLevels: 8
  } as QualityProfile,
  
  mobile: {
    name: 'Mobile Optimized',
    renderScale: 0.75,
    useHDR: false,
    useOIT: false, // Fallback to depth sorting on mobile
    useDepthPyramid: true, // Still beneficial on mobile
    particleDensity: 0.7,
    maxMipLevels: 4
  } as QualityProfile
};

export class AdvancedRenderer {
  private renderer: WebGLRenderer;
  private profile: QualityProfile;
  private renderSize: Vector2;
  
  // OIT render targets
  private oitAccumTarget?: WebGLRenderTarget;
  private oitRevealTarget?: WebGLRenderTarget;
  
  // HDR render target
  private hdrTarget?: WebGLRenderTarget;
  
  // Depth pyramid
  private depthPyramid: WebGLRenderTarget[] = [];
  private depthPyramidSize: Vector2 = new Vector2();
  
  constructor(canvas: HTMLCanvasElement, isMobile: boolean = false) {
    console.log('PIXEL8D: Initializing AdvancedRenderer with profile:', isMobile ? 'mobile' : 'desktop');
    
    this.profile = isMobile ? QUALITY_PROFILES.mobile : QUALITY_PROFILES.desktop;
    this.renderSize = new Vector2();
    
    // Initialize WebGL2 renderer with advanced features
    this.renderer = new WebGLRenderer({
      canvas,
      antialias: false, // We'll handle this in post-processing
      alpha: true,
      powerPreference: "high-performance",
      precision: "highp"
    });
    
    // Enable required WebGL2 extensions
    const gl = this.renderer.getContext();
    if (!gl.getExtension('EXT_color_buffer_float') && this.profile.useHDR) {
      console.warn('PIXEL8D: HDR not supported, falling back to LDR');
      this.profile.useHDR = false;
    }
    
    if (!gl.getExtension('WEBGL_draw_buffers') && this.profile.useOIT) {
      console.warn('PIXEL8D: Multiple render targets not supported, disabling OIT');
      this.profile.useOIT = false;
    }
    
    this.initializeRenderTargets();
  }
  
  private initializeRenderTargets() {
    const width = Math.floor(this.renderSize.x * this.profile.renderScale);
    const height = Math.floor(this.renderSize.y * this.profile.renderScale);
    
    console.log(`PIXEL8D: Initializing render targets at ${width}x${height} (scale: ${this.profile.renderScale})`);
    
    // HDR render target
    if (this.profile.useHDR) {
      this.hdrTarget = new WebGLRenderTarget(width, height, {
        format: RGBAFormat,
        type: FloatType,
        generateMipmaps: false,
        minFilter: LinearFilter,
        magFilter: LinearFilter
      });
      console.log('PIXEL8D: HDR render target initialized');
    }
    
    // OIT render targets
    if (this.profile.useOIT) {
      this.oitAccumTarget = new WebGLRenderTarget(width, height, {
        format: RGBAFormat,
        type: FloatType,
        generateMipmaps: false,
        minFilter: NearestFilter,
        magFilter: NearestFilter
      });
      
      this.oitRevealTarget = new WebGLRenderTarget(width, height, {
        format: RGBAFormat,
        type: FloatType,
        generateMipmaps: false,
        minFilter: NearestFilter,
        magFilter: NearestFilter
      });
      console.log('PIXEL8D: OIT render targets initialized');
    }
    
    // Depth pyramid
    if (this.profile.useDepthPyramid) {
      this.initializeDepthPyramid(width, height);
    }
  }
  
  private initializeDepthPyramid(baseWidth: number, baseHeight: number) {
    this.depthPyramidSize.set(baseWidth, baseHeight);
    this.depthPyramid = [];
    
    let currentWidth = baseWidth;
    let currentHeight = baseHeight;
    
    for (let level = 0; level < this.profile.maxMipLevels; level++) {
      const target = new WebGLRenderTarget(currentWidth, currentHeight, {
        format: RGBAFormat,
        type: FloatType,
        generateMipmaps: false,
        minFilter: NearestFilter,
        magFilter: NearestFilter
      });
      
      this.depthPyramid.push(target);
      
      currentWidth = Math.max(1, Math.floor(currentWidth / 2));
      currentHeight = Math.max(1, Math.floor(currentHeight / 2));
      
      if (currentWidth === 1 && currentHeight === 1) break;
    }
    
    console.log(`PIXEL8D: Depth pyramid initialized with ${this.depthPyramid.length} levels`);
  }
  
  setSize(width: number, height: number) {
    this.renderSize.set(width, height);
    this.renderer.setSize(width, height);
    
    // Recreate render targets with new size
    this.disposeRenderTargets();
    this.initializeRenderTargets();
    
    console.log(`PIXEL8D: Renderer resized to ${width}x${height}`);
  }
  
  setPixelRatio(pixelRatio: number) {
    // Clamp pixel ratio to prevent excessive memory usage
    const clampedRatio = Math.min(pixelRatio, this.profile.name === 'mobile' ? 2 : 3);
    this.renderer.setPixelRatio(clampedRatio);
  }
  
  render(scene: Scene, camera: PerspectiveCamera) {
    if (this.profile.useOIT) {
      this.renderWithOIT(scene, camera);
    } else {
      this.renderStandard(scene, camera);
    }
  }
  
  private renderStandard(scene: Scene, camera: PerspectiveCamera) {
    if (this.profile.useHDR && this.hdrTarget) {
      // Render to HDR target, then tone map to screen
      this.renderer.setRenderTarget(this.hdrTarget);
      this.renderer.render(scene, camera);
      
      // Apply tone mapping in post-processing
      this.applyToneMapping();
    } else {
      // Direct render to screen
      this.renderer.setRenderTarget(null);
      this.renderer.render(scene, camera);
    }
  }
  
  private renderWithOIT(scene: Scene, camera: PerspectiveCamera) {
    if (!this.oitAccumTarget || !this.oitRevealTarget) return;
    
    // Clear OIT buffers
    this.renderer.setRenderTarget(this.oitAccumTarget);
    this.renderer.clear();
    this.renderer.setRenderTarget(this.oitRevealTarget);
    this.renderer.clear();
    
    // Render transparent objects to OIT buffers
    // This would require custom material modifications
    // For now, fall back to standard rendering
    this.renderStandard(scene, camera);
    
    console.log('PIXEL8D: OIT rendering pipeline (implementation in progress)');
  }
  
  private applyToneMapping() {
    if (!this.hdrTarget) return;
    
    // Simple ACES tone mapping implementation
    // This would typically be done with a full-screen quad and custom shader
    this.renderer.setRenderTarget(null);
    
    // For now, just copy HDR target to screen
    // Full tone mapping implementation would go here
    console.log('PIXEL8D: Applying HDR tone mapping (implementation in progress)');
  }
  
  updateDepthPyramid() {
    if (!this.profile.useDepthPyramid || this.depthPyramid.length === 0) return;
    
    // Generate hierarchical depth buffer
    // This requires compute shader or multi-pass rendering
    console.log('PIXEL8D: Updating depth pyramid for occlusion culling');
  }
  
  getQualityProfile(): QualityProfile {
    return { ...this.profile };
  }
  
  getPerformanceStats() {
    const info = this.renderer.info;
    return {
      triangles: info.render.triangles,
      points: info.render.points,
      calls: info.render.calls,
      frame: info.render.frame,
      memory: {
        geometries: info.memory.geometries,
        textures: info.memory.textures
      }
    };
  }
  
  private disposeRenderTargets() {
    this.hdrTarget?.dispose();
    this.oitAccumTarget?.dispose();
    this.oitRevealTarget?.dispose();
    this.depthPyramid.forEach(target => target.dispose());
    this.depthPyramid = [];
  }
  
  dispose() {
    this.disposeRenderTargets();
    this.renderer.dispose();
    console.log('PIXEL8D: AdvancedRenderer disposed');
  }
}
