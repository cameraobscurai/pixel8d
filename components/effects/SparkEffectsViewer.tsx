"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import * as THREE from "three";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RotateCcw, Play, Pause, Loader2, Sparkles } from "lucide-react";

type EffectType = "Magic" | "Spread" | "Unroll" | "Twister" | "Rain";
type EasingType = "linear" | "ease-in" | "ease-out" | "ease-in-out";

interface EffectConfig {
  splatUrl: string;
  position: [number, number, number];
  scale?: number;
  description: string;
}

const EFFECT_CONFIGS: Record<EffectType, EffectConfig> = {
  Magic: {
    splatUrl: "https://sparkjs.dev/assets/splats/primerib-tamos.spz",
    position: [0, 0, 0],
    description: "Particles materialize with sparkle effect",
  },
  Spread: {
    splatUrl: "https://sparkjs.dev/assets/splats/valley.spz",
    position: [0, 1, 1],
    description: "Outward expansion from center",
  },
  Unroll: {
    splatUrl: "https://sparkjs.dev/assets/splats/burger-from-amboy.spz",
    position: [0, 0, 0],
    scale: 1.5,
    description: "Sequential reveal by position",
  },
  Twister: {
    splatUrl: "https://sparkjs.dev/assets/splats/sutro.zip",
    position: [0, -1, 1],
    scale: 0.8,
    description: "Spiral reveal animation",
  },
  Rain: {
    splatUrl: "https://sparkjs.dev/assets/splats/sutro.zip",
    position: [0, -1, 1],
    scale: 0.8,
    description: "Falling particles effect",
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

export function SparkEffectsViewer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const splatMeshRef = useRef<unknown>(null);
  const animateTRef = useRef<{ value: number }>({ value: 0 });
  const baseTimeRef = useRef(0);
  const splatLoadedRef = useRef(false);
  const cameraAngleRef = useRef(0);
  const animationRef = useRef<number | null>(null);

  const [currentEffect, setCurrentEffect] = useState<EffectType>("Magic");
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [easing, setEasing] = useState<EasingType>("ease-out");

  const CAMERA_RADIUS = 3;
  const CAMERA_HEIGHT = 2;
  const ROTATION_SPEED = 0.2;

  const setupSplatModifier = useCallback(
    async (splatMesh: unknown, effect: EffectType) => {
      const { dyno } = await import("@sparkjsdev/spark");
      const mesh = splatMesh as { objectModifier: unknown; updateGenerator: () => void };

      const effectTypeInt =
        effect === "Magic" ? 1 : effect === "Spread" ? 2 : effect === "Unroll" ? 3 : effect === "Twister" ? 4 : 5;

      mesh.objectModifier = dyno.dynoBlock(
        { gsplat: dyno.Gsplat },
        { gsplat: dyno.Gsplat },
        ({ gsplat }: { gsplat: unknown }) => {
          const d = new dyno.Dyno({
            inTypes: { gsplat: dyno.Gsplat, t: "float", effectType: "int" },
            outTypes: { gsplat: dyno.Gsplat },
            globals: () => [dyno.unindent(EFFECT_SHADER_GLOBALS)],
            statements: ({ inputs, outputs }: { inputs: Record<string, string>; outputs: Record<string, string> }) =>
              dyno.unindentLines(getEffectStatements(effectTypeInt)(inputs, outputs)),
          });

          const result = d.apply({
            gsplat,
            t: animateTRef.current,
            effectType: dyno.dynoInt(effectTypeInt),
          });

          return { gsplat: result.gsplat };
        }
      );

      mesh.updateGenerator();
    },
    []
  );

  const loadSplatForEffect = useCallback(
    async (effect: EffectType) => {
      if (!sceneRef.current) return;
      setIsLoading(true);

      const { SplatMesh } = await import("@sparkjsdev/spark");

      // Clean up existing
      if (splatMeshRef.current) {
        sceneRef.current.remove(splatMeshRef.current as THREE.Object3D);
        splatMeshRef.current = null;
      }

      const config = EFFECT_CONFIGS[effect];
      const splatMesh = new SplatMesh({ url: config.splatUrl }) as THREE.Object3D & {
        quaternion: THREE.Quaternion;
        loaded: Promise<void>;
      };
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

      await setupSplatModifier(splatMesh, effect);
      splatMeshRef.current = splatMesh;
      setIsLoading(false);
    },
    [setupSplatModifier]
  );

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;

    const initScene = async () => {
      const { dyno } = await import("@sparkjsdev/spark");
      animateTRef.current = dyno.dynoFloat(0);

      const scene = new THREE.Scene();
      scene.background = new THREE.Color("#0a0a0f");

      const camera = new THREE.PerspectiveCamera(
        60,
        container.clientWidth / container.clientHeight,
        0.1,
        1000
      );
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
      window.addEventListener("resize", onResize);

      // Animation loop
      const animate = () => {
        if (splatLoadedRef.current && isPlaying) {
          baseTimeRef.current += (1 / 60) * speed;
          animateTRef.current.value = baseTimeRef.current;
        }

        // Camera orbit
        cameraAngleRef.current += ROTATION_SPEED * (1 / 60);
        if (currentEffect === "Twister" || currentEffect === "Rain") {
          cameraAngleRef.current = 0;
        }

        camera.position.x = Math.cos(cameraAngleRef.current) * CAMERA_RADIUS;
        camera.position.z = Math.sin(cameraAngleRef.current) * CAMERA_RADIUS;
        camera.position.y = CAMERA_HEIGHT;

        if (currentEffect === "Spread") {
          camera.lookAt(0, 1, 0);
        } else {
          camera.lookAt(0, 0, 0);
        }

        const mesh = splatMeshRef.current as { updateVersion?: () => void } | null;
        if (mesh?.updateVersion) {
          mesh.updateVersion();
        }

        renderer.render(scene, camera);
        animationRef.current = requestAnimationFrame(animate);
      };
      animate();

      // Load initial effect
      loadSplatForEffect("Magic");

      return () => {
        window.removeEventListener("resize", onResize);
      };
    };

    initScene();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (rendererRef.current) {
        rendererRef.current.dispose();
        const domElement = rendererRef.current.domElement;
        if (containerRef.current?.contains(domElement)) {
          containerRef.current.removeChild(domElement);
        }
      }
    };
  }, []);

  const handleEffectChange = async (effect: EffectType) => {
    setCurrentEffect(effect);
    await loadSplatForEffect(effect);
  };

  const handleResetTime = () => {
    baseTimeRef.current = 0;
    animateTRef.current.value = 0;
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="w-full h-[calc(100vh-64px)] flex flex-col bg-background relative overflow-hidden pt-16">
      {/* Controls bar */}
      <div className="glass-toolbar mx-4 mt-4 p-4 flex flex-wrap items-center justify-between gap-4 relative z-10">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-semibold">Spark Effects</h1>
          </div>
          <span className="text-sm text-muted-foreground hidden sm:inline">
            Splat reveal animations
          </span>
          {isLoading && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 size={16} className="animate-spin" />
              <span className="text-sm">Loading...</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          {/* Effect selector */}
          <Tabs value={currentEffect} onValueChange={(v) => handleEffectChange(v as EffectType)}>
            <TabsList className="glass">
              {(Object.keys(EFFECT_CONFIGS) as EffectType[]).map((effect) => (
                <TabsTrigger key={effect} value={effect} className="text-xs">
                  {effect}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {/* Speed control */}
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground">Speed</Label>
            <Slider
              value={[speed]}
              onValueChange={([v]) => setSpeed(v)}
              min={0.1}
              max={3}
              step={0.1}
              className="w-24"
            />
            <span className="text-xs text-muted-foreground w-8">{speed.toFixed(1)}x</span>
          </div>

          {/* Easing selector */}
          <Select value={easing} onValueChange={(v) => setEasing(v as EasingType)}>
            <SelectTrigger className="w-28 h-8 text-xs glass-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="glass">
              <SelectItem value="linear">Linear</SelectItem>
              <SelectItem value="ease-in">Ease In</SelectItem>
              <SelectItem value="ease-out">Ease Out</SelectItem>
              <SelectItem value="ease-in-out">Ease In-Out</SelectItem>
            </SelectContent>
          </Select>

          {/* Play/Pause */}
          <Button variant="outline" size="sm" onClick={togglePlayPause} className="glass-button">
            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
          </Button>

          {/* Reset */}
          <Button variant="outline" size="sm" onClick={handleResetTime} className="glass-button gap-2">
            <RotateCcw size={16} />
            Reset
          </Button>
        </div>
      </div>

      {/* Effect description */}
      <div className="mx-4 mt-2">
        <p className="text-sm text-muted-foreground">
          {EFFECT_CONFIGS[currentEffect].description}
        </p>
      </div>

      {/* Viewer canvas */}
      <div ref={containerRef} className="flex-1 relative mx-4 mb-4 mt-2 rounded-xl overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center glass z-10 rounded-xl">
            <div className="text-center">
              <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
              <h2 className="text-xl font-medium mb-2">Loading Effect</h2>
              <p className="text-muted-foreground text-sm">
                Preparing {currentEffect.toLowerCase()} reveal
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
