
import React from 'react';
import { Button } from '@/components/ui/button';
import { RotateCcw, Settings, Download, Share, Camera } from 'lucide-react';
import { Vr } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface CameraPreset {
  name: string;
  position: { x: number; y: number; z: number };
  rotation: { roll: number; pitch: number; yaw: number };
  focalLength: number;
}

interface ViewerToolbarProps {
  onReset: () => void;
  isLoading: boolean;
  presets: CameraPreset[];
  onPresetSelect: (preset: CameraPreset) => void;
  onEnterVR?: () => void;
  isVRSupported?: boolean;
  isVRActive?: boolean;
}

export const ViewerToolbar: React.FC<ViewerToolbarProps> = ({
  onReset,
  isLoading,
  presets,
  onPresetSelect,
  onEnterVR,
  isVRSupported = false,
  isVRActive = false
}) => {
  return (
    <div className="border-b border-border bg-background p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            PIXEL8D
          </h1>
          <span className="text-sm text-muted-foreground">Professional Gaussian Splat Viewer</span>
          {isLoading && (
            <div className="flex items-center gap-2 text-muted-foreground ml-4">
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm">Loading...</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {isVRSupported && (
            <Button
              variant={isVRActive ? "default" : "outline"}
              size="sm"
              onClick={onEnterVR}
              disabled={isLoading}
              className="gap-2"
            >
              <Vr size={16} />
              {isVRActive ? 'Exit VR' : 'Enter VR'}
            </Button>
          )}
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={isLoading}
                className="gap-2"
              >
                <Camera size={16} />
                Presets
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {presets.map((preset) => (
                <DropdownMenuItem 
                  key={preset.name}
                  onClick={() => onPresetSelect(preset)}
                  className="cursor-pointer"
                >
                  {preset.name} View
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button
            variant="outline"
            size="sm"
            onClick={onReset}
            disabled={isLoading}
            className="gap-2"
          >
            <RotateCcw size={16} />
            Reset Camera
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            disabled={isLoading}
            className="gap-2"
          >
            <Settings size={16} />
            Settings
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            disabled={isLoading}
            className="gap-2"
          >
            <Download size={16} />
            Export
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            disabled={isLoading}
            className="gap-2"
          >
            <Share size={16} />
            Share
          </Button>
        </div>
      </div>
    </div>
  );
};
