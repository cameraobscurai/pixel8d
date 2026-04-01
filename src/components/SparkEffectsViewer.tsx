import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import * as THREE from 'three';
import { SplatMesh, dyno } from '@sparkjsdev/spark';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { RotateCcw, ArrowLeft } from 'lucide-react';

type EffectType = 'Magic' | 'Spread' | 'Unroll' | 'Twister' | 'Rain';

interface EffectConfig {
  splatUrl: string;
  position: [number, number, number];
  scale?: number;
}

const EFFECT_CONFIGS: Record<EffectType, EffectConfig> = {
  Magic: {
    splatUrl: 'https://sparkjs.dev/assets/splats/primerib-tamos.spz',
    position: [0, 0, 0],
  },
  Spread: {
    splatUrl: 'https://sparkjs.dev/assets/splats/valley.spz',
    position: [0, 1, 1],
  },
  Unroll: {
    splatUrl: 'https://sparkjs.dev/assets/splats/burger-from-amboy.spz',
    position: [0, 0, 0],
    scale: 1.5,
  },
  Twister: {
    splatUrl: 'https://sparkjs.dev/assets/splats/sutro.zip',
    position: [0, -1, 1],
    scale: 0.8,
  },
  Rain: {
    splatUrl: 'https://sparkjs.dev/assets/splats/sutro.zip',
    position: [0, -1, 1],
    scale: 0.8,
  },
};

const EFFECT_SHADER_GLOBALS = `
  vec3 hash(vec3 p) {
    p = fract(p * 0.3183099 + 0.1);
    p *= 17.0;
    return fract(vec3(p.x * p.y * p.z, p.x + p.y * p.z, p.x * p.y + p.z));
  }

  vec3 noise(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    vec3 n000 = hash(i + vec3(0,0,0));
    vec3 n100 = hash(i + vec3(1,0,0));
    vec3 n010 = hash(i + vec3(0,1,0));
    vec3 n110 = hash(i + vec3(1,1,0));
    vec3 n001 = hash(i + vec3(0,0,1));
    vec3 n101 = hash(i + vec3(1,0,1));
    vec3 n011 = hash(i + vec3(0,1,1));
    vec3 n111 = hash(i + vec3(1,1,1));
    vec3 x0 = mix(n000, n100, f.x);
    vec3 x1 = mix(n010, n110, f.x);
    vec3 x2 = mix(n001, n101, f.x);
    vec3 x3 = mix(n011, n111, f.x);
    vec3 y0 = mix(x0, x1, f.y);
    vec3 y1 = mix(x2, x3, f.y);
    return mix(y0, y1, f.z);
  }

  mat2 rot(float a) {
    float s=sin(a),c=cos(a);
    return mat2(c,-s,s,c);
  }

  vec4 twister(vec3 pos, vec3 scale, float t) {
    vec3 h = hash(pos);
    float s = smoothstep(0., 8., t*t*.1 - length(pos.xz)*2.+2.);
    if (length(scale) < .05) pos.y = mix(-10., pos.y, pow(s, 2.*h.x));
    pos.xz = mix(pos.xz*.5, pos.xz, pow(s, 2.*h.x));
    float rotationTime = t * (1.0 - s) * 0.2;
    pos.xz *= rot(rotationTime + pos.y*20.*(1.-s)*exp(-1.*length(pos.xz)));
    return vec4(pos, s*s*s*s);
  }

  vec4 rain(vec3 pos, vec3 scale, float t) {
    vec3 h = hash(pos);
    float s = pow(smoothstep(0., 5., t*t*.1 - length(pos.xz)*2. + 1.), .5 + h.x);
    float y = pos.y;
    pos.y = min(-10. + s*15., pos.y);
    pos.xz = mix(pos.xz*.3, pos.xz, s);
    pos.xz *= rot(t*.3);
    return vec4(pos, smoothstep(-10., y, pos.y));
  }
`;

function getEffectStatements(effectType: number) {
  return (inputs: Record<string, string>, outputs: Record<string, string>) => `
    ${outputs.gsplat} = ${inputs.gsplat};
    float t = ${inputs.t};
    float s = smoothstep(0.,10.,t-4.5)*10.;
    vec3 scales = ${inputs.gsplat}.scales;
    vec3 localPos = ${inputs.gsplat}.center;
    float l = length(localPos.xz);
    
    if (${inputs.effectType} == 1) {
      float border = abs(s-l-.5);
      localPos *= 1.-.2*exp(-20.*border);
      vec3 finalScales = mix(scales,vec3(0.002),smoothstep(s-.5,s,l+.5));
      ${outputs.gsplat}.center = localPos + .1*noise(localPos.xyz*2.+t*.5)*smoothstep(s-.5,s,l+.5);
      ${outputs.gsplat}.scales = finalScales;
      float at = atan(localPos.x,localPos.z)/3.1416;
      ${outputs.gsplat}.rgba *= step(at,t-3.1416);
      ${outputs.gsplat}.rgba += exp(-20.*border) + exp(-50.*abs(t-at-3.1416))*.5;
    } else if (${inputs.effectType} == 2) {
      float tt = t*t*.4+.5;
      localPos.xz *= min(1.,.3+max(0.,tt*.05));
      ${outputs.gsplat}.center = localPos;
      ${outputs.gsplat}.scales = max(mix(vec3(0.0),scales,min(tt-7.-l*2.5,1.)),mix(vec3(0.0),scales*.2,min(tt-1.-l*2.,1.)));
      ${outputs.gsplat}.rgba = mix(vec4(.3),${inputs.gsplat}.rgba,clamp(tt-l*2.5-3.,0.,1.));
    } else if (${inputs.effectType} == 3) {
      localPos.xz *= rot((localPos.y*50.-20.)*exp(-t));
      ${outputs.gsplat}.center = localPos * (1.-exp(-t)*2.);
      ${outputs.gsplat}.scales = mix(vec3(0.002),scales,smoothstep(.3,.7,t+localPos.y-2.));
      ${outputs.gsplat}.rgba = ${inputs.gsplat}.rgba*step(0.,t*.5+localPos.y-.5);
    } else if (${inputs.effectType} == 4) {
      vec4 effectResult = twister(localPos, scales, t);
      ${outputs.gsplat}.center = effectResult.xyz;
      ${outputs.gsplat}.scales = mix(vec3(.002), scales, pow(effectResult.w, 12.));
      float s = effectResult.w;
      float spin = -t * 0.3 * (1.0 - s);
      vec4 spinQ = vec4(0.0, sin(spin*0.5), 0.0, cos(spin*0.5));
      ${outputs.gsplat}.quaternion = quatQuat(spinQ, ${inputs.gsplat}.quaternion);
    } else if (${inputs.effectType} == 5) {
      vec4 effectResult = rain(localPos, scales, t);
      ${outputs.gsplat}.center = effectResult.xyz;
      ${outputs.gsplat}.scales = mix(vec3(.005), scales, pow(effectResult.w, 30.));
      float spin = -t*.3;
      vec4 spinQ = vec4(0.0, sin(spin*0.5), 0.0, cos(spin*0.5));
      ${outputs.gsplat}.quaternion = quatQuat(spinQ, ${inputs.gsplat}.quaternion);
    }
  `;
}

export const SparkEffectsViewer: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const splatMeshRef = useRef<any>(null);
  const animateT = useRef(dyno.dynoFloat(0));
  const baseTimeRef = useRef(0);
  const splatLoadedRef = useRef(false);
  const cameraAngleRef = useRef(0);
  const animationRef = useRef<number | null>(null);

  const [currentEffect, setCurrentEffect] = useState<EffectType>('Magic');
  const [isLoading, setIsLoading] = useState(true);

  const CAMERA_RADIUS = 3;
  const CAMERA_HEIGHT = 2;
  const ROTATION_SPEED = 0.2;

  const setupSplatModifier = useCallback((splatMesh: any, effect: EffectType) => {
    const effectTypeInt = effect === 'Magic' ? 1 : effect === 'Spread' ? 2 : effect === 'Unroll' ? 3 : effect === 'Twister' ? 4 : 5;

    splatMesh.objectModifier = dyno.dynoBlock(
      { gsplat: dyno.Gsplat },
      { gsplat: dyno.Gsplat },
      ({ gsplat }: any) => {
        const d = new dyno.Dyno({
          inTypes: { gsplat: dyno.Gsplat, t: 'float', effectType: 'int' },
          outTypes: { gsplat: dyno.Gsplat },
          globals: () => [dyno.unindent(EFFECT_SHADER_GLOBALS)],
          statements: ({ inputs, outputs }: any) =>
            dyno.unindentLines(getEffectStatements(effectTypeInt)(inputs, outputs)),
        });

        gsplat = d.apply({
          gsplat,
          t: animateT.current,
          effectType: dyno.dynoInt(effectTypeInt),
        }).gsplat;

        return { gsplat };
      }
    );

    splatMesh.updateGenerator();
  }, []);

  const loadSplatForEffect = useCallback(async (effect: EffectType) => {
    if (!sceneRef.current) return;
    setIsLoading(true);

    // Clean up existing
    if (splatMeshRef.current) {
      sceneRef.current.remove(splatMeshRef.current);
      splatMeshRef.current = null;
    }

    const config = EFFECT_CONFIGS[effect];
    const splatMesh = new SplatMesh({ url: config.splatUrl }) as any;
    splatMesh.quaternion.set(1, 0, 0, 0);
    splatMesh.position.set(...config.position);

    if (config.scale) {
      splatMesh.scale.set(config.scale, config.scale, config.scale);
    }

    sceneRef.current.add(splatMesh);
    splatLoadedRef.current = false;

    await splatMesh.loaded;
    splatLoadedRef.current = true;
    baseTimeRef.current = 0;

    setupSplatModifier(splatMesh, effect);
    splatMeshRef.current = splatMesh;
    setIsLoading(false);
  }, [setupSplatModifier]);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0, CAMERA_HEIGHT, CAMERA_RADIUS);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    sceneRef.current = scene;
    cameraRef.current = camera;
    rendererRef.current = renderer;

    const onResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', onResize);

    // Start animation loop
    const animate = () => {
      if (splatLoadedRef.current) {
        baseTimeRef.current += 1 / 60;
        animateT.current.value = baseTimeRef.current;
      } else {
        animateT.current.value = 0;
      }

      // Camera orbit
      cameraAngleRef.current += ROTATION_SPEED * (1 / 60);
      if (currentEffect === 'Twister' || currentEffect === 'Rain') {
        cameraAngleRef.current = 0;
      }

      camera.position.x = Math.cos(cameraAngleRef.current) * CAMERA_RADIUS;
      camera.position.z = Math.sin(cameraAngleRef.current) * CAMERA_RADIUS;
      camera.position.y = CAMERA_HEIGHT;

      if (currentEffect === 'Spread') {
        camera.lookAt(0, 1, 0);
      } else {
        camera.lookAt(0, 0, 0);
      }

      if (splatMeshRef.current) {
        splatMeshRef.current.updateVersion();
      }

      renderer.render(scene, camera);
      animationRef.current = requestAnimationFrame(animate);
    };
    animate();

    // Load initial effect
    loadSplatForEffect('Magic');

    return () => {
      window.removeEventListener('resize', onResize);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleEffectChange = async (effect: string) => {
    const e = effect as EffectType;
    setCurrentEffect(e);
    await loadSplatForEffect(e);
  };

  const handleResetTime = () => {
    baseTimeRef.current = 0;
    animateT.current.value = 0;
  };

  return (
    <div className="w-full h-screen flex flex-col bg-background relative overflow-hidden">
      {/* Controls bar */}
      <div className="glass-container glass-container--toolbar border-b border-white/20 dark:border-black/20 relative z-10">
        <div className="glass-filter"></div>
        <div className="glass-overlay"></div>
        <div className="glass-specular"></div>
        <div className="glass-content glass-content--toolbar">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="sm"><ArrowLeft size={14} /></Button>
            </Link>
            <h1 className="text-3xl font-light tracking-tight bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 dark:from-slate-100 dark:via-slate-300 dark:to-slate-100 bg-clip-text text-transparent">
              spark effects
            </h1>
            <div className="h-6 w-px bg-gradient-to-b from-transparent via-slate-300 to-transparent dark:via-slate-600" />
            <span className="text-sm text-slate-600 dark:text-slate-400 font-light">
              splat reveal animations
            </span>
            {isLoading && (
              <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 ml-6">
                <div className="w-4 h-4 border border-current border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm font-light">loading...</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Label className="text-sm font-light text-slate-600 dark:text-slate-400">effect</Label>
            <Select value={currentEffect} onValueChange={handleEffectChange}>
              <SelectTrigger className="w-36 glass-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="glass-dropdown">
                <SelectItem value="Magic" className="glass-menu-item">Magic</SelectItem>
                <SelectItem value="Spread" className="glass-menu-item">Spread</SelectItem>
                <SelectItem value="Unroll" className="glass-menu-item">Unroll</SelectItem>
                <SelectItem value="Twister" className="glass-menu-item">Twister</SelectItem>
                <SelectItem value="Rain" className="glass-menu-item">Rain</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetTime}
              className="glass-button gap-2"
            >
              <RotateCcw size={16} />
              reset
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

      {/* Viewer canvas */}
      <div ref={containerRef} className="flex-1 relative" style={{ touchAction: 'none' }}>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center backdrop-blur-md bg-white/30 dark:bg-black/30 z-10">
            <div className="glass-panel p-8 text-center rounded-2xl">
              <div className="w-12 h-12 border-2 border-slate-600 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
              <h2 className="text-2xl font-medium mb-2 bg-gradient-to-r from-slate-900 to-slate-600 dark:from-slate-100 dark:to-slate-400 bg-clip-text text-transparent">
                loading effect
              </h2>
              <p className="text-slate-600 dark:text-slate-400 text-sm">
                preparing {currentEffect.toLowerCase()} reveal
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
