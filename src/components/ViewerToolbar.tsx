import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  RotateCcw,
  Settings,
  Download,
  Share,
  Camera,
  Wrench,
  FileArchive,
  Shuffle,
  Sparkles,
  Images,
} from 'lucide-react';
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
  captureId?: string;
  captureTitle?: string;
}

export const ViewerToolbar: React.FC<ViewerToolbarProps> = ({
  onReset,
  isLoading,
  presets,
  onPresetSelect,
  showSettings,
  onSettingsToggle,
  onExportScreenshot,
  captureId,
  captureTitle,
}) => {
  return (
    <div className="glass-container glass-container--toolbar border-b border-white/20 dark:border-black/20 relative z-10">
      <div className="glass-filter"></div>
      <div className="glass-overlay"></div>
      <div className="glass-specular"></div>
      <div className="glass-content glass-content--toolbar gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <h1 className="text-3xl font-light tracking-tight bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 dark:from-slate-100 dark:via-slate-300 dark:to-slate-100 bg-clip-text text-transparent">
            pixel8d
          </h1>
          <div className="h-6 w-px bg-gradient-to-b from-transparent via-slate-300 to-transparent dark:via-slate-600" />
          <span className="text-sm text-slate-600 dark:text-slate-400 font-light whitespace-nowrap">
            professional gaussian splat viewer
          </span>
          {captureTitle && (
            <span className="rounded-full border border-border bg-background/60 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
              {captureTitle}
            </span>
          )}
          {isLoading && (
            <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 ml-2">
              <div className="w-4 h-4 border border-current border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm font-light">loading...</span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          {captureId && (
            <>
              <Link to={`/editor?capture=${captureId}`}>
                <Button variant="ghost" size="sm" disabled={isLoading} className="glass-button gap-2">
                  <Wrench size={16} />
                  editor
                </Button>
              </Link>
              <Link to={`/sogs?capture=${captureId}`}>
                <Button variant="ghost" size="sm" disabled={isLoading} className="glass-button gap-2">
                  <FileArchive size={16} />
                  sogs
                </Button>
              </Link>
              <Link to={`/stochastic?capture=${captureId}`}>
                <Button variant="ghost" size="sm" disabled={isLoading} className="glass-button gap-2">
                  <Shuffle size={16} />
                  stochastic
                </Button>
              </Link>
              <Link to={`/effects?capture=${captureId}`}>
                <Button variant="ghost" size="sm" disabled={isLoading} className="glass-button gap-2">
                  <Sparkles size={16} />
                  effects
                </Button>
              </Link>
              <Link to="/gallery">
                <Button variant="ghost" size="sm" disabled={isLoading} className="glass-button gap-2">
                  <Images size={16} />
                  gallery
                </Button>
              </Link>
              <div className="mx-1 h-5 w-px bg-border/60" />
            </>
          )}

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

      <svg className="glass-svg-filters">
        <filter id="lg-dist" x="0%" y="0%" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.008 0.008" numOctaves="2" seed="92" result="noise" />
          <feGaussianBlur in="noise" stdDeviation="2" result="blurred" />
          <feDisplacementMap in="SourceGraphic" in2="blurred" scale="70" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>
    </div>
  );
};
