
import { useState, useCallback } from 'react';

interface LiquidGlassConfig {
  displacementScale: number;
  aberrationIntensity: number;
  enabled: boolean;
}

export const useLiquidGlass = (initialConfig?: Partial<LiquidGlassConfig>) => {
  const [config, setConfig] = useState<LiquidGlassConfig>({
    displacementScale: 20,
    aberrationIntensity: 0.3,
    enabled: true,
    ...initialConfig
  });

  const updateConfig = useCallback((updates: Partial<LiquidGlassConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  }, []);

  return { config, updateConfig };
};
