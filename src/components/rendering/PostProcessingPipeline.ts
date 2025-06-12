
import { WebGLRenderer, Scene, Camera, WebGLRenderTarget, ShaderMaterial, PlaneGeometry, Mesh, OrthographicCamera } from 'three';

export interface PostProcessingEffect {
  name: string;
  enabled: boolean;
  render(renderer: WebGLRenderer, inputTarget: WebGLRenderTarget, outputTarget: WebGLRenderTarget | null): void;
}

export class PostProcessingPipeline {
  private effects: PostProcessingEffect[] = [];
  private tempTargets: WebGLRenderTarget[] = [];
  private quadCamera: OrthographicCamera;
  private quadGeometry: PlaneGeometry;
  
  constructor() {
    // Set up full-screen quad for post-processing
    this.quadCamera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.quadGeometry = new PlaneGeometry(2, 2);
    
    console.log('PIXEL8D: PostProcessingPipeline initialized');
  }
  
  addEffect(effect: PostProcessingEffect) {
    this.effects.push(effect);
    console.log(`PIXEL8D: Added post-processing effect: ${effect.name}`);
  }
  
  removeEffect(name: string) {
    const index = this.effects.findIndex(effect => effect.name === name);
    if (index > -1) {
      this.effects.splice(index, 1);
      console.log(`PIXEL8D: Removed post-processing effect: ${name}`);
    }
  }
  
  setEffectEnabled(name: string, enabled: boolean) {
    const effect = this.effects.find(effect => effect.name === name);
    if (effect) {
      effect.enabled = enabled;
      console.log(`PIXEL8D: ${enabled ? 'Enabled' : 'Disabled'} effect: ${name}`);
    }
  }
  
  render(renderer: WebGLRenderer, inputTarget: WebGLRenderTarget) {
    if (this.effects.length === 0) {
      // No effects, just copy input to screen
      this.copyToScreen(renderer, inputTarget);
      return;
    }
    
    let currentInput = inputTarget;
    const enabledEffects = this.effects.filter(effect => effect.enabled);
    
    for (let i = 0; i < enabledEffects.length; i++) {
      const effect = enabledEffects[i];
      const isLastEffect = i === enabledEffects.length - 1;
      const outputTarget = isLastEffect ? null : this.getTempTarget(currentInput.width, currentInput.height);
      
      effect.render(renderer, currentInput, outputTarget);
      
      if (!isLastEffect && outputTarget) {
        currentInput = outputTarget;
      }
    }
  }
  
  private copyToScreen(renderer: WebGLRenderer, inputTarget: WebGLRenderTarget) {
    // Simple blit operation to copy render target to screen
    renderer.setRenderTarget(null);
    // Implementation would involve a copy shader
    console.log('PIXEL8D: Copying render target to screen');
  }
  
  private getTempTarget(width: number, height: number): WebGLRenderTarget {
    // Reuse or create temporary render targets as needed
    for (const target of this.tempTargets) {
      if (target.width === width && target.height === height) {
        return target;
      }
    }
    
    const newTarget = new WebGLRenderTarget(width, height);
    this.tempTargets.push(newTarget);
    return newTarget;
  }
  
  resize(width: number, height: number) {
    // Dispose and recreate temp targets with new size
    this.tempTargets.forEach(target => target.dispose());
    this.tempTargets = [];
    console.log(`PIXEL8D: PostProcessingPipeline resized to ${width}x${height}`);
  }
  
  dispose() {
    this.tempTargets.forEach(target => target.dispose());
    this.quadGeometry.dispose();
    console.log('PIXEL8D: PostProcessingPipeline disposed');
  }
}
