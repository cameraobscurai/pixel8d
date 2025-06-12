
import React from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Download, Grid3X3 } from 'lucide-react';

interface SettingsPanelProps {
  isOrthographic: boolean;
  onCameraModeChange: (orthographic: boolean) => void;
  qualityPreset: string;
  onQualityChange: (preset: string) => void;
  showGrid: boolean;
  onGridToggle: (show: boolean) => void;
  depthBufferEnabled: boolean;
  onDepthBufferToggle: (enabled: boolean) => void;
  onExportScreenshot: (resolution: string) => void;
  semanticMask: string;
  onSemanticMaskChange: (mask: string) => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  isOrthographic,
  onCameraModeChange,
  qualityPreset,
  onQualityChange,
  showGrid,
  onGridToggle,
  depthBufferEnabled,
  onDepthBufferToggle,
  onExportScreenshot,
  semanticMask,
  onSemanticMaskChange
}) => {
  return (
    <Card className="w-80 p-6 bg-muted/50 border-border">
      <div className="space-y-6">
        <div>
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">
            Camera Settings
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Camera Mode</Label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Perspective</span>
                <Switch
                  checked={isOrthographic}
                  onCheckedChange={onCameraModeChange}
                />
                <span className="text-xs text-muted-foreground">Orthographic</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Grid Overlay</Label>
              <Switch
                checked={showGrid}
                onCheckedChange={onGridToggle}
              />
            </div>
          </div>
        </div>

        <div className="border-t border-border pt-6">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">
            Rendering
          </h3>
          
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium mb-2 block">Quality Preset</Label>
              <Select value={qualityPreset} onValueChange={onQualityChange}>
                <SelectTrigger className="bg-muted border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ultra">Ultra</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Depth Buffer</Label>
              <Switch
                checked={depthBufferEnabled}
                onCheckedChange={onDepthBufferToggle}
              />
            </div>
          </div>
        </div>

        <div className="border-t border-border pt-6">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">
            Semantic Layers
          </h3>
          
          <div>
            <Label className="text-sm font-medium mb-2 block">Layer Mask</Label>
            <Select value={semanticMask} onValueChange={onSemanticMaskChange}>
              <SelectTrigger className="bg-muted border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Layers</SelectItem>
                <SelectItem value="foreground">Foreground Only</SelectItem>
                <SelectItem value="background">Background Only</SelectItem>
                <SelectItem value="objects">Objects Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="border-t border-border pt-6">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">
            Export
          </h3>
          
          <div className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onExportScreenshot('1920x1080')}
              className="w-full gap-2"
            >
              <Download size={16} />
              Export 1080p
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onExportScreenshot('3840x2160')}
              className="w-full gap-2"
            >
              <Download size={16} />
              Export 4K
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};
