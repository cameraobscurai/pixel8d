
import React from 'react';
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
    <Card className="w-80 p-6 bg-muted/50 border-border">
      <div className="space-y-6">
        {/* Focal Length */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label className="text-sm font-medium">focal length</Label>
            <span className="text-xs text-muted-foreground">mm</span>
          </div>
          <div className="bg-muted rounded-md p-3 mb-3">
            <div className="text-2xl font-mono">
              {cameraState.focalLength.toFixed(2)}
            </div>
          </div>
          <Slider
            value={[cameraState.focalLength]}
            onValueChange={handleFocalLengthChange}
            min={bounds.focalLength.min}
            max={bounds.focalLength.max}
            step={0.1}
            className="w-full"
          />
        </div>

        {/* Smoothness Control */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label className="text-sm font-medium">smoothness</Label>
            <span className="text-xs text-muted-foreground">{(smoothness * 100).toFixed(0)}%</span>
          </div>
          <Slider
            value={[smoothness]}
            onValueChange={handleSmoothnessChange}
            min={0.01}
            max={0.5}
            step={0.01}
            className="w-full"
          />
        </div>

        <div className="border-t border-border pt-6">
          {/* Position Controls */}
          <div className="space-y-4 mb-6">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Position</h3>
            {['x', 'y', 'z'].map((axis) => (
              <div key={axis} className="flex items-center justify-between">
                <Label className="text-sm font-medium w-4">{axis}</Label>
                <Input
                  type="number"
                  value={cameraState.position[axis as keyof typeof cameraState.position].toFixed(2)}
                  onChange={(e) => handleInputChange('position', axis, e.target.value)}
                  className="w-24 text-right font-mono bg-muted border-border"
                  step="0.01"
                />
              </div>
            ))}
          </div>

          <div className="border-t border-border pt-6">
            {/* Rotation Controls */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Rotation</h3>
              {[
                { key: 'roll', label: 'roll' },
                { key: 'pitch', label: 'pitch' },
                { key: 'yaw', label: 'yaw' }
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between">
                  <Label className="text-sm font-medium">{label}</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={cameraState.rotation[key as keyof typeof cameraState.rotation].toFixed(2)}
                      onChange={(e) => handleInputChange('rotation', key, e.target.value)}
                      className="w-24 text-right font-mono bg-muted border-border"
                      step="0.1"
                    />
                    <span className="text-xs text-muted-foreground w-4">°</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
