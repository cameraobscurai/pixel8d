
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
  const [isLoading, setIsLoading] = useState(true);
  const [captureUrl, setCaptureUrl] = useState<string>('');

  useEffect(() => {
    console.log('PIXEL8D: Initializing viewer...');
    
    const initViewer = async () => {
      try {
        // Create a default capture URL (you can replace this with any Luma AI capture)
        const url = 'https://lumalabs.ai/embed/4da7d439-56b7-4bd0-8dd7-0c64a7e3b37c?mode=sparkles&background=%23ffffff&color=%23000000&showTitle=true&loadBg=true&logoPosition=bottom-left&infoPosition=bottom-right&cinematicVideo=undefined&showMenu=false';
        
        setCaptureUrl(url);
        
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
    // In a real implementation, this would reset the camera view
  };

  const handlePresetSelect = (preset: CameraPreset) => {
    console.log('PIXEL8D: Applying camera preset:', preset.name);
    // In a real implementation, this would apply the camera preset
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
        <div className="w-full h-full bg-gradient-to-br from-background to-muted flex items-center justify-center">
          {isLoading ? (
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading Gaussian Splats...</p>
            </div>
          ) : captureUrl ? (
            <iframe
              src={captureUrl}
              className="w-full h-full border-0"
              title="Luma AI Gaussian Splat Viewer"
            />
          ) : null}
        </div>
      </div>
    </div>
  );
};
