
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Card } from '@/components/ui/card';
import { Download, Image as ImageIcon, Zap } from 'lucide-react';

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (options: {
    resolution: string;
    quality: number;
    format: 'png' | 'jpeg';
    filename?: string;
  }) => void;
  isExporting: boolean;
}

const RESOLUTION_PRESETS = [
  { label: 'HD (1920x1080)', value: '1920x1080', megapixels: 2.1 },
  { label: '2K (2560x1440)', value: '2560x1440', megapixels: 3.7 },
  { label: '4K (3840x2160)', value: '3840x2160', megapixels: 8.3 },
  { label: '5K (5120x2880)', value: '5120x2880', megapixels: 14.7 },
  { label: '8K (7680x4320)', value: '7680x4320', megapixels: 33.2 },
  { label: 'Custom', value: 'custom', megapixels: 0 }
];

export const ExportDialog: React.FC<ExportDialogProps> = ({
  isOpen,
  onClose,
  onExport,
  isExporting
}) => {
  const [resolution, setResolution] = useState('3840x2160');
  const [customWidth, setCustomWidth] = useState(3840);
  const [customHeight, setCustomHeight] = useState(2160);
  const [quality, setQuality] = useState(95);
  const [format, setFormat] = useState<'png' | 'jpeg'>('png');
  const [filename, setFilename] = useState('');

  const handleExport = () => {
    const finalResolution = resolution === 'custom' 
      ? `${customWidth}x${customHeight}` 
      : resolution;

    onExport({
      resolution: finalResolution,
      quality,
      format,
      filename: filename.trim() || undefined
    });
  };

  const selectedPreset = RESOLUTION_PRESETS.find(p => p.value === resolution);
  const isCustom = resolution === 'custom';
  
  const getEstimatedFileSize = () => {
    const [width, height] = (isCustom ? `${customWidth}x${customHeight}` : resolution).split('x').map(Number);
    const pixels = width * height;
    
    if (format === 'png') {
      return `${Math.round(pixels * 4 / 1024 / 1024)}MB`; // Rough estimate for PNG
    } else {
      const compressionFactor = quality / 100;
      return `${Math.round(pixels * 3 * compressionFactor / 1024 / 1024)}MB`; // Rough estimate for JPEG
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ImageIcon size={20} />
            Export High-Resolution Image
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Resolution Selection */}
          <div>
            <Label className="text-sm font-medium mb-3 block">Resolution</Label>
            <Select value={resolution} onValueChange={setResolution}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RESOLUTION_PRESETS.map((preset) => (
                  <SelectItem key={preset.value} value={preset.value}>
                    <div className="flex items-center justify-between w-full">
                      <span>{preset.label}</span>
                      {preset.megapixels > 0 && (
                        <span className="text-xs text-muted-foreground ml-2">
                          {preset.megapixels}MP
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {isCustom && (
              <div className="flex gap-3 mt-3">
                <div className="flex-1">
                  <Label className="text-xs text-muted-foreground">Width</Label>
                  <Input
                    type="number"
                    value={customWidth}
                    onChange={(e) => setCustomWidth(Number(e.target.value))}
                    min={100}
                    max={16384}
                  />
                </div>
                <div className="flex items-center justify-center pt-5">
                  <span className="text-muted-foreground">×</span>
                </div>
                <div className="flex-1">
                  <Label className="text-xs text-muted-foreground">Height</Label>
                  <Input
                    type="number"
                    value={customHeight}
                    onChange={(e) => setCustomHeight(Number(e.target.value))}
                    min={100}
                    max={16384}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Format and Quality */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium mb-3 block">Format</Label>
              <Select value={format} onValueChange={(value: 'png' | 'jpeg') => setFormat(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="png">PNG (Lossless)</SelectItem>
                  <SelectItem value="jpeg">JPEG (Compressed)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className="text-sm font-medium mb-3 block">
                Quality {format === 'jpeg' && `(${quality}%)`}
              </Label>
              <div className="pt-2">
                <Slider
                  value={[quality]}
                  onValueChange={(value) => setQuality(value[0])}
                  min={50}
                  max={100}
                  step={5}
                  disabled={format === 'png'}
                  className="w-full"
                />
              </div>
              {format === 'png' && (
                <p className="text-xs text-muted-foreground mt-1">PNG uses lossless compression</p>
              )}
            </div>
          </div>

          {/* Filename */}
          <div>
            <Label className="text-sm font-medium mb-3 block">Filename (optional)</Label>
            <Input
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              placeholder="pixel8d-export"
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Leave empty for automatic timestamp naming
            </p>
          </div>

          {/* Export Info */}
          <Card className="p-4 bg-muted/50">
            <div className="flex items-center gap-3">
              <Zap size={16} className="text-primary" />
              <div className="flex-1">
                <p className="text-sm font-medium">Export Details</p>
                <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                  <span>Estimated size: {getEstimatedFileSize()}</span>
                  <span>•</span>
                  <span>High-resolution rendering enabled</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose} disabled={isExporting}>
              Cancel
            </Button>
            <Button onClick={handleExport} disabled={isExporting} className="gap-2">
              <Download size={16} />
              {isExporting ? 'Exporting...' : 'Export Image'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
