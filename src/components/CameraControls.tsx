
import React from 'react';
import LiquidGlass from 'liquid-glass-react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';

interface CameraState {
  position: { x: number; y: number; z: number };
  rotation: { roll: number; pitch: number; yaw: number };
  focalLength: number;
}

interface Bounds {
  position: { min: number; max: number };
  rotation: { min: number; max: number };
  focalLength: { min: number; max: number };
}

interface CameraControlsProps {
  cameraState: CameraState;
  onCameraChange: (updates: Partial<CameraState>) => void;
  bounds: Bounds;
  smoothness: number;
  onSmoothnessChange: (value: number) => void;
}

export const CameraControls: React.FC<CameraControlsProps> = ({
  cameraState,
  onCameraChange,
  bounds,
  smoothness,
  onSmoothnessChange
}) => {
  const handleInputChange = (
    category: 'position' | 'rotation',
    axis: string,
    value: string
  ) => {
    const numValue = parseFloat(value) || 0;
    onCameraChange({
      [category]: {
        ...cameraState[category],
        [axis]: numValue
      }
    });
  };

  const handleFocalLengthChange = (value: number[]) => {
    onCameraChange({ focalLength: value[0] });
  };

  const handleSmoothnessChange = (value: number[]) => {
    onSmoothnessChange(value[0]);
  };

  return (
    <div className="fixed left-0 top-20 bottom-0 z-40 w-80 bg-white/85 dark:bg-black/85 backdrop-blur-xl border-r border-white/20 dark:border-black/20 overflow-y-auto">
      <div className="p-6 space-y-6">
        {/* Focal Length Control */}
        <LiquidGlass displacementScale={10} aberrationIntensity={0.15}>
          <div className="bg-white/60 dark:bg-black/60 backdrop-blur-lg border border-white/30 dark:border-black/30 p-4 rounded-lg shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <Label className="text-sm font-light text-slate-600 dark:text-slate-400">focal length</Label>
              <span className="text-xs text-slate-500 dark:text-slate-500">mm</span>
            </div>
            <div className="bg-white/40 dark:bg-black/35 backdrop-blur-sm border border-white/30 dark:border-black/30 rounded-lg p-3 mb-3">
              <div className="text-2xl font-mono text-slate-700 dark:text-slate-300">
                {cameraState.focalLength.toFixed(2)}
              </div>
            </div>
            <Slider
              value={[cameraState.focalLength]}
              onValueChange={handleFocalLengthChange}
              min={bounds.focalLength.min}
              max={bounds.focalLength.max}
              step={0.1}
              className="w-full glass-slider"
            />
          </div>
        </LiquidGlass>

        {/* Smoothness Control */}
        <LiquidGlass displacementScale={10} aberrationIntensity={0.15}>
          <div className="bg-white/60 dark:bg-black/60 backdrop-blur-lg border border-white/30 dark:border-black/30 p-4 rounded-lg shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <Label className="text-sm font-light text-slate-600 dark:text-slate-400">smoothness</Label>
              <span className="text-xs text-slate-500 dark:text-slate-500">{(smoothness * 100).toFixed(0)}%</span>
            </div>
            <Slider
              value={[smoothness]}
              onValueChange={handleSmoothnessChange}
              min={0.01}
              max={0.5}
              step={0.01}
              className="w-full glass-slider"
            />
          </div>
        </LiquidGlass>

        <div className="h-px bg-gradient-to-r from-transparent via-slate-300/50 dark:via-slate-600/50 to-transparent" />

        {/* Position Controls */}
        <LiquidGlass displacementScale={10} aberrationIntensity={0.15}>
          <div className="bg-white/60 dark:bg-black/60 backdrop-blur-lg border border-white/30 dark:border-black/30 p-4 rounded-lg shadow-lg space-y-4">
            <h3 className="text-sm font-light text-slate-600 dark:text-slate-400 uppercase tracking-wide">position</h3>
            {['x', 'y', 'z'].map((axis) => (
              <div key={axis} className="flex items-center justify-between">
                <Label className="text-sm font-light text-slate-600 dark:text-slate-400 w-4">{axis}</Label>
                <Input
                  type="number"
                  value={cameraState.position[axis as keyof typeof cameraState.position].toFixed(2)}
                  onChange={(e) => handleInputChange('position', axis, e.target.value)}
                  className="w-24 text-right font-mono glass-input"
                  step="0.01"
                />
              </div>
            ))}
          </div>
        </LiquidGlass>

        <div className="h-px bg-gradient-to-r from-transparent via-slate-300/50 dark:via-slate-600/50 to-transparent" />

        {/* Rotation Controls */}
        <LiquidGlass displacementScale={10} aberrationIntensity={0.15}>
          <div className="bg-white/60 dark:bg-black/60 backdrop-blur-lg border border-white/30 dark:border-black/30 p-4 rounded-lg shadow-lg space-y-4">
            <h3 className="text-sm font-light text-slate-600 dark:text-slate-400 uppercase tracking-wide">rotation</h3>
            {[
              { key: 'roll', label: 'roll' },
              { key: 'pitch', label: 'pitch' },
              { key: 'yaw', label: 'yaw' }
            ].map(({ key, label }) => (
              <div key={key} className="flex items-center justify-between">
                <Label className="text-sm font-light text-slate-600 dark:text-slate-400">{label}</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={cameraState.rotation[key as keyof typeof cameraState.rotation].toFixed(2)}
                    onChange={(e) => handleInputChange('rotation', key, e.target.value)}
                    className="w-24 text-right font-mono glass-input"
                    step="0.1"
                  />
                  <span className="text-xs text-slate-500 dark:text-slate-500 w-4">°</span>
                </div>
              </div>
            ))}
          </div>
        </LiquidGlass>
      </div>
    </div>
  );
};
