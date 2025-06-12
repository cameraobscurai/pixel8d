
import { useState, useCallback } from 'react';

interface LiquidGlassConfig {
  displacementScale: number;
  aberrationIntensity: number;
  turbulenceStrength: number;
  animationSpeed: number;
  enabled: boolean;
}

export const useLiquidGlass = (initialConfig?: Partial<LiquidGlassConfig>) => {
  const [config, setConfig] = useState<LiquidGlassConfig>({
    displacementScale: 20,
    aberrationIntensity: 0.3,
    turbulenceStrength: 0.02,
    animationSpeed: 0.5,
    enabled: true,
    ...initialConfig
  });

  const updateConfig = useCallback((updates: Partial<LiquidGlassConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  }, []);

  return { config, updateConfig };
};
