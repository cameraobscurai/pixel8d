import { create } from "zustand";
import type { Capture } from "./captures";

export type QualityPreset = "low" | "medium" | "high" | "ultra";
export type EditorMode = "view" | "crop" | "transform" | "select";
export type EffectType = "magic" | "spread" | "unroll" | "none";

interface ViewerSettings {
  quality: QualityPreset;
  autoRotate: boolean;
  showGrid: boolean;
  depthBuffer: boolean;
  smoothness: number;
}

interface EditorState {
  mode: EditorMode;
  cropBounds: {
    min: { x: number; y: number; z: number };
    max: { x: number; y: number; z: number };
  } | null;
  selectedGaussians: number[];
  historyIndex: number;
  history: unknown[];
}

interface EffectSettings {
  activeEffect: EffectType;
  progress: number;
  speed: number;
  direction: "up" | "down" | "left" | "right" | "center";
  easing: "linear" | "ease-in" | "ease-out" | "ease-in-out";
}

interface AppState {
  // Active capture
  currentCapture: Capture | null;
  setCapture: (capture: Capture | null) => void;

  // Viewer settings
  viewerSettings: ViewerSettings;
  updateViewerSettings: (settings: Partial<ViewerSettings>) => void;

  // Editor state
  editorState: EditorState;
  updateEditorState: (state: Partial<EditorState>) => void;
  setEditorMode: (mode: EditorMode) => void;
  setCropBounds: (bounds: EditorState["cropBounds"]) => void;

  // Effect settings
  effectSettings: EffectSettings;
  updateEffectSettings: (settings: Partial<EffectSettings>) => void;
  setActiveEffect: (effect: EffectType) => void;
  setEffectProgress: (progress: number) => void;

  // UI state
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Active capture
  currentCapture: null,
  setCapture: (capture) => set({ currentCapture: capture }),

  // Viewer settings
  viewerSettings: {
    quality: "high",
    autoRotate: false,
    showGrid: false,
    depthBuffer: true,
    smoothness: 0.1,
  },
  updateViewerSettings: (settings) =>
    set((state) => ({
      viewerSettings: { ...state.viewerSettings, ...settings },
    })),

  // Editor state
  editorState: {
    mode: "view",
    cropBounds: null,
    selectedGaussians: [],
    historyIndex: -1,
    history: [],
  },
  updateEditorState: (editorState) =>
    set((state) => ({
      editorState: { ...state.editorState, ...editorState },
    })),
  setEditorMode: (mode) =>
    set((state) => ({
      editorState: { ...state.editorState, mode },
    })),
  setCropBounds: (cropBounds) =>
    set((state) => ({
      editorState: { ...state.editorState, cropBounds },
    })),

  // Effect settings
  effectSettings: {
    activeEffect: "none",
    progress: 0,
    speed: 1,
    direction: "up",
    easing: "ease-out",
  },
  updateEffectSettings: (settings) =>
    set((state) => ({
      effectSettings: { ...state.effectSettings, ...settings },
    })),
  setActiveEffect: (effect) =>
    set((state) => ({
      effectSettings: { ...state.effectSettings, activeEffect: effect },
    })),
  setEffectProgress: (progress) =>
    set((state) => ({
      effectSettings: { ...state.effectSettings, progress },
    })),

  // UI state
  isLoading: false,
  setIsLoading: (isLoading) => set({ isLoading }),
  error: null,
  setError: (error) => set({ error }),
}));
