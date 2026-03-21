

# Splat Editor — Implementation Plan

## Summary

Add a full-featured Gaussian Splat editor page at `/editor` that supports file loading (drag-and-drop, file picker, URL paste), per-splat transform controls (position, rotation, scale, opacity), clip planes, debug visualization, and SPZ export — all built with React UI instead of lil-gui.

## Current State

We have five feature pages: main viewer, gallery, effects, stochastic, and SOGS. All use `@sparkjsdev/spark` with `SplatMesh`. The editor will be the sixth, and the most powerful — a proper tool for managing and exporting splats.

## Plan

### 1. Create `src/components/SplatEditor.tsx` — Core Editor Component

The main Three.js canvas plus `SparkRenderer` initialization:
- `SparkRenderer` with `maxStdDev: Math.sqrt(5)`, stochastic toggle, grid overlay
- `OrbitControls` + `SparkControls` (switchable)
- Drag-and-drop on canvas for `.ply`, `.spz`, `.splat`, `.ksplat`, `.zip` files
- URL loading via text input
- Auto-rotate toggle
- Background color picker
- Camera pose controls (position, rotation, FOV)
- `constructGrid` for reference grid

React state manages all GUI parameters that were in lil-gui. UI panels built with existing shadcn components (Slider, Switch, Input, Select, Accordion).

### 2. Key Editor Features (React panels instead of lil-gui)

**File Management Panel:**
- File picker button + drag-and-drop zone
- URL paste input + load button
- Per-loaded-splat accordion: opacity, position XYZ, rotation XYZ, scale, max SH
- Reset on load toggle, load offset slider

**Camera Panel:**
- Position XYZ sliders
- Rotation XYZ sliders
- FOV slider
- Reset pose button
- OpenCV coordinates toggle
- Orbit vs SparkControls toggle

**Clip Planes Panel:**
- Enable/disable clip
- Min/Max XYZ sliders
- Uses `dyno` clip logic from the provided code

**Debug Panel:**
- Normal color toggle
- Bounding box visibility
- Max std dev, falloff, blur, focal adjustment sliders
- Stochastic toggle
- Encoding params (RGB min/max, ln scale min/max, SH ranges)

**Export Panel:**
- Filename input
- Trim opacity toggle + threshold
- Max SH selector
- Fractional bits slider
- Download as `.spz` button using `transcodeSpz`

### 3. World Modifier with Dyno

Port the `makeWorldModifier` function — normal color visualization and clip plane logic using `dyno.dynoBlock`, exactly as in the reference code.

### 4. Create `src/pages/Editor.tsx` — Page Wrapper

Simple wrapper with navigation links back to other pages.

### 5. Update Routing and Navigation

- Add `/editor` route in `App.tsx`
- Add "Editor" nav button on Index page (using `Wrench` or `PenTool` icon)

## Technical Notes

- All lil-gui controls become React state + shadcn UI components
- `transcodeSpz` from `@sparkjsdev/spark` handles the SPZ export
- `constructGrid`, `textSplats`, `dyno`, `isPcSogs`, `LN_SCALE_MIN`, `LN_SCALE_MAX` imported from `@sparkjsdev/spark`
- File loading uses `fetchWithProgress` pattern for URL sources
- The editor layout: left sidebar for file/splat management, right sidebar for camera/debug/export, center canvas

