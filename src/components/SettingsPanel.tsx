
import React from 'react';
import LiquidGlass from 'liquid-glass-react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

interface SettingsPanelProps {
  qualityPreset: string;
  onQualityChange: (preset: string) => void;
  showGrid: boolean;
  onGridToggle: (show: boolean) => void;
  depthBufferEnabled: boolean;
  onDepthBufferToggle: (enabled: boolean) => void;
  onExportScreenshot: () => void;
  semanticMask: string;
  onSemanticMaskChange: (mask: string) => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
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
    <div className="fixed right-0 top-20 bottom-0 z-40">
      <LiquidGlass
        displacementScale={10}
        aberrationIntensity={0.12}
      >
        <div className="w-80 h-full glass-panel border-l border-white/20 dark:border-black/20 backdrop-blur-xl bg-white/30 dark:bg-black/20 overflow-y-auto">
          <div className="p-6 space-y-8">
            <div>
              <h3 className="text-lg font-light text-slate-700 dark:text-slate-300 mb-6 tracking-wide">
                camera settings
              </h3>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-light text-slate-600 dark:text-slate-400">grid overlay</Label>
                  <Switch
                    checked={showGrid}
                    onCheckedChange={onGridToggle}
                    className="glass-switch"
                  />
                </div>
              </div>
            </div>

            <div className="glass-divider" />

            <div>
              <h3 className="text-lg font-light text-slate-700 dark:text-slate-300 mb-6 tracking-wide">
                rendering
              </h3>
              
              <div className="space-y-6">
                <div>
                  <Label className="text-sm font-light text-slate-600 dark:text-slate-400 mb-3 block">quality preset</Label>
                  <Select value={qualityPreset} onValueChange={onQualityChange}>
                    <SelectTrigger className="glass-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="glass-dropdown">
                      <SelectItem value="ultra" className="glass-menu-item">ultra</SelectItem>
                      <SelectItem value="high" className="glass-menu-item">high</SelectItem>
                      <SelectItem value="medium" className="glass-menu-item">medium</SelectItem>
                      <SelectItem value="low" className="glass-menu-item">low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <Label className="text-sm font-light text-slate-600 dark:text-slate-400">depth buffer</Label>
                  <Switch
                    checked={depthBufferEnabled}
                    onCheckedChange={onDepthBufferToggle}
                    className="glass-switch"
                  />
                </div>
              </div>
            </div>

            <div className="glass-divider" />

            <div>
              <h3 className="text-lg font-light text-slate-700 dark:text-slate-300 mb-6 tracking-wide">
                semantic layers
              </h3>
              
              <div>
                <Label className="text-sm font-light text-slate-600 dark:text-slate-400 mb-3 block">layer mask</Label>
                <Select value={semanticMask} onValueChange={onSemanticMaskChange}>
                  <SelectTrigger className="glass-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="glass-dropdown">
                    <SelectItem value="all" className="glass-menu-item">all layers</SelectItem>
                    <SelectItem value="foreground" className="glass-menu-item">foreground only</SelectItem>
                    <SelectItem value="background" className="glass-menu-item">background only</SelectItem>
                    <SelectItem value="objects" className="glass-menu-item">objects only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="glass-divider" />

            <div>
              <h3 className="text-lg font-light text-slate-700 dark:text-slate-300 mb-6 tracking-wide">
                export
              </h3>
              
              <Button
                variant="outline"
                onClick={onExportScreenshot}
                className="w-full glass-button gap-2"
              >
                <Download size={16} />
                high-resolution export
              </Button>
            </div>
          </div>
        </div>
      </LiquidGlass>
    </div>
  );
};
