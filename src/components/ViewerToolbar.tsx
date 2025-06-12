
import React from 'react';
import { Button } from '@/components/ui/button';
import { RotateCcw, Settings, Download, Share, Camera } from 'lucide-react';
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
  showSettings: boolean;
  onSettingsToggle: () => void;
  onExportScreenshot: () => void;
}

export const ViewerToolbar: React.FC<ViewerToolbarProps> = ({
  onReset,
  isLoading,
  presets,
  onPresetSelect,
  showSettings,
  onSettingsToggle,
  onExportScreenshot
}) => {
  return (
    <div className="glass-toolbar border-b border-white/20 dark:border-black/20 p-6 relative z-10">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-light tracking-tight bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 dark:from-slate-100 dark:via-slate-300 dark:to-slate-100 bg-clip-text text-transparent">
            pixel8d
          </h1>
          <div className="h-6 w-px bg-gradient-to-b from-transparent via-slate-300 to-transparent dark:via-slate-600" />
          <span className="text-sm text-slate-600 dark:text-slate-400 font-light">
            professional gaussian splat viewer
          </span>
          {isLoading && (
            <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 ml-6">
              <div className="w-4 h-4 border border-current border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm font-light">loading...</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                disabled={isLoading}
                className="glass-button gap-2"
              >
                <Camera size={16} />
                presets
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="glass-dropdown">
              {presets.map((preset) => (
                <DropdownMenuItem 
                  key={preset.name}
                  onClick={() => onPresetSelect(preset)}
                  className="cursor-pointer glass-menu-item"
                >
                  {preset.name.toLowerCase()} view
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            disabled={isLoading}
            className="glass-button gap-2"
          >
            <RotateCcw size={16} />
            reset
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onSettingsToggle}
            disabled={isLoading}
            className={`glass-button gap-2 ${showSettings ? 'glass-button-active' : ''}`}
          >
            <Settings size={16} />
            settings
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onExportScreenshot}
            disabled={isLoading}
            className="glass-button gap-2"
          >
            <Download size={16} />
            export
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            disabled={isLoading}
            className="glass-button gap-2"
          >
            <Share size={16} />
            share
          </Button>
        </div>
      </div>
    </div>
  );
};
