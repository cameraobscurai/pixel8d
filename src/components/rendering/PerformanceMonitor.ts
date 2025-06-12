
export interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  gpuTime: number;
  cpuTime: number;
  memoryUsage: number;
}

export class PerformanceMonitor {
  private frameCount = 0;
  private lastTime = performance.now();
  private frameStartTime = 0;
  private fpsHistory: number[] = [];
  private readonly historySize = 60; // Track last 60 frames
  
  private callbacks: ((metrics: PerformanceMetrics) => void)[] = [];
  
  startFrame() {
    this.frameStartTime = performance.now();
  }
  
  endFrame() {
    const now = performance.now();
    const frameTime = now - this.frameStartTime;
    
    this.frameCount++;
    
    // Calculate FPS every second
    if (now - this.lastTime >= 1000) {
      const fps = (this.frameCount * 1000) / (now - this.lastTime);
      
      this.fpsHistory.push(fps);
      if (this.fpsHistory.length > this.historySize) {
        this.fpsHistory.shift();
      }
      
      const metrics: PerformanceMetrics = {
        fps: fps,
        frameTime: frameTime,
        gpuTime: 0, // Would need WebGL timer extension
        cpuTime: frameTime, // Approximation
        memoryUsage: this.getMemoryUsage()
      };
      
      // Notify callbacks
      this.callbacks.forEach(callback => callback(metrics));
      
      this.frameCount = 0;
      this.lastTime = now;
      
      console.log(`PIXEL8D: Performance - FPS: ${fps.toFixed(1)}, Frame Time: ${frameTime.toFixed(2)}ms`);
    }
  }
  
  getAverageFPS(): number {
    if (this.fpsHistory.length === 0) return 0;
    return this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length;
  }
  
  isPerformanceGood(): boolean {
    const avgFPS = this.getAverageFPS();
    // Consider performance good if maintaining above 25 FPS on average
    return avgFPS > 25;
  }
  
  private getMemoryUsage(): number {
    // Estimate memory usage based on available info
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return memory.usedJSHeapSize / (1024 * 1024); // MB
    }
    return 0;
  }
  
  onMetricsUpdate(callback: (metrics: PerformanceMetrics) => void) {
    this.callbacks.push(callback);
  }
  
  removeCallback(callback: (metrics: PerformanceMetrics) => void) {
    const index = this.callbacks.indexOf(callback);
    if (index > -1) {
      this.callbacks.splice(index, 1);
    }
  }
  
  reset() {
    this.frameCount = 0;
    this.lastTime = performance.now();
    this.fpsHistory = [];
    console.log('PIXEL8D: Performance monitor reset');
  }
}
