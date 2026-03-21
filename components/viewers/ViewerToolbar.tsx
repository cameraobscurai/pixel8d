"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { RotateCcw, Camera, Settings2, Maximize } from "lucide-react";
import { cn } from "@/lib/utils";

interface CameraPreset {
  name: string;
  position: { x: number; y: number; z: number };
  rotation: { roll: number; pitch: number; yaw: number };
  focalLength: number;
}

interface ViewerToolbarProps {
  qualityPreset: string;
  onQualityChange: (quality: "low" | "medium" | "high" | "ultra") => void;
  autoRotate: boolean;
  onAutoRotateChange: (rotate: boolean) => void;
  onResetCamera: () => void;
  cameraPresets: CameraPreset[];
  onPresetSelect: (preset: CameraPreset) => void;
  className?: string;
}

export function ViewerToolbar({
  qualityPreset,
  onQualityChange,
  autoRotate,
  onAutoRotateChange,
  onResetCamera,
  cameraPresets,
  onPresetSelect,
  className,
}: ViewerToolbarProps) {
  return (
    <div
      className={cn(
        "absolute bottom-6 left-1/2 -translate-x-1/2 z-40",
        "glass-toolbar animate-slide-up",
        className
      )}
    >
      {/* Camera Presets */}
      <div className="flex items-center gap-1 pr-2 border-r border-border/30">
        {cameraPresets.map((preset) => (
          <Button
            key={preset.name}
            variant="ghost"
            size="sm"
            onClick={() => onPresetSelect(preset)}
            className="h-8 px-3 text-xs font-medium hover:bg-primary/10 hover:text-primary"
          >
            <Camera className="mr-1 h-3 w-3" />
            {preset.name}
          </Button>
        ))}
      </div>

      {/* Quality Selector */}
      <div className="flex items-center gap-2 px-2 border-r border-border/30">
        <Settings2 className="h-4 w-4 text-muted-foreground" />
        <Select value={qualityPreset} onValueChange={onQualityChange}>
          <SelectTrigger className="w-24 h-8 text-xs glass-select border-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="glass">
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="ultra">Ultra</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Auto Rotate Toggle */}
      <div className="flex items-center gap-2 px-2 border-r border-border/30">
        <Switch
          id="auto-rotate"
          checked={autoRotate}
          onCheckedChange={onAutoRotateChange}
          className="h-5 w-9"
        />
        <Label htmlFor="auto-rotate" className="text-xs text-muted-foreground cursor-pointer">
          Rotate
        </Label>
      </div>

      {/* Reset Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onResetCamera}
        className="h-8 px-3 hover:bg-primary/10 hover:text-primary"
      >
        <RotateCcw className="mr-1 h-3 w-3" />
        Reset
      </Button>

      {/* Fullscreen Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          if (document.fullscreenElement) {
            document.exitFullscreen();
          } else {
            document.documentElement.requestFullscreen();
          }
        }}
        className="h-8 px-2 hover:bg-primary/10 hover:text-primary"
      >
        <Maximize className="h-4 w-4" />
      </Button>
    </div>
  );
}
