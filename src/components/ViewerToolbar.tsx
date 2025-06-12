
import React from 'react';
import { Button } from '@/components/ui/button';
import { RotateCcw, Settings, Download, Share, Camera, Monitor, Smartphone } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { QualityProfile } from './rendering/AdvancedRenderer';

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
  performanceStats?: any;
  qualityProfile?: QualityProfile;
}

export const ViewerToolbar: React.FC<ViewerToolbarProps> = ({
  onReset,
  isLoading,
  presets,
  onPresetSelect,
  performanceStats,
  qualityProfile
}) => {
  return (
    <div className="border-b border-border bg-background p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              PIXEL8D
            </h1>
            <span className="text-sm text-muted-foreground">Advanced Gaussian Splat Viewer</span>
          </div>
          
          {qualityProfile && (
            <div className="flex items-center gap-2 px-3 py-1 bg-muted rounded-full">
              {qualityProfile.name.includes('Mobile') ? (
                <Smartphone size={14} className="text-muted-foreground" />
              ) : (
                <Monitor size={14} className="text-muted-foreground" />
              )}
              <span className="text-xs font-medium text-muted-foreground">
                {qualityProfile.name}
              </span>
              {qualityProfile.useHDR && (
                <span className="text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded">HDR</span>
              )}
              {qualityProfile.useOIT && (
                <span className="text-xs bg-green-500/20 text-green-700 px-1.5 py-0.5 rounded">OIT</span>
              )}
              {qualityProfile.useDepthPyramid && (
                <span className="text-xs bg-blue-500/20 text-blue-700 px-1.5 py-0.5 rounded">DP</span>
              )}
            </div>
          )}
          
          {performanceStats && (
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span>FPS: {performanceStats.fps?.toFixed(1) || '0'}</span>
              <span>Frame: {performanceStats.frameTime?.toFixed(1) || '0'}ms</span>
              {performanceStats.renderer && (
                <span>Calls: {performanceStats.renderer.calls || '0'}</span>
              )}
            </div>
          )}
          
          {isLoading && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm">Loading...</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
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
