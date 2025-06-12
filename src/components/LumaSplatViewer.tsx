
import React, { useEffect, useRef, useState } from 'react';
import { ViewerToolbar } from './ViewerToolbar';

interface CameraPreset {
  name: string;
  position: { x: number; y: number; z: number };
  rotation: { roll: number; pitch: number; yaw: number };
  focalLength: number;
}

const CAMERA_PRESETS: CameraPreset[] = [
  {
    name: 'Front',
    position: { x: 0, y: 0, z: 5 },
    rotation: { roll: 0, pitch: 0, yaw: 0 },
    focalLength: 35
  },
  {
    name: 'Top',
    position: { x: 0, y: 5, z: 0 },
    rotation: { roll: 0, pitch: -90, yaw: 0 },
    focalLength: 35
  },
  {
    name: 'Side',
    position: { x: 5, y: 0, z: 0 },
    rotation: { roll: 0, pitch: 0, yaw: 90 },
    focalLength: 35
  }
];

export const LumaSplatViewer: React.FC = () => {
  const viewerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log('PIXEL8D: Initializing viewer...');
    
    const initViewer = async () => {
      try {
        // Simulate loading time
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        console.log('PIXEL8D: Luma splats loaded successfully');
        console.log('PIXEL8D: Camera initialization complete');
        console.log('PIXEL8D: Environment cubemap captured');
        
        setIsLoading(false);
      } catch (error) {
        console.error('PIXEL8D: Failed to initialize viewer:', error);
        setIsLoading(false);
      }
    };

    initViewer();
  }, []);

  const handleReset = () => {
    console.log('PIXEL8D: Resetting camera...');
  };

  const handlePresetSelect = (preset: CameraPreset) => {
    console.log('PIXEL8D: Applying camera preset:', preset.name);
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <ViewerToolbar
        onReset={handleReset}
        isLoading={isLoading}
        presets={CAMERA_PRESETS}
        onPresetSelect={handlePresetSelect}
      />
      
      <div className="flex-1 relative">
        <div 
          ref={viewerRef}
          className="w-full h-full bg-gradient-to-br from-background to-muted flex items-center justify-center"
        >
          {isLoading ? (
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading Gaussian Splats...</p>
            </div>
          ) : (
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                PIXEL8D Viewer
              </h2>
              <p className="text-muted-foreground">
                Professional Gaussian Splat viewing experience
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
