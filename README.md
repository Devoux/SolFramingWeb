# Sol Framing Web

Next.js + TypeScript app for visualizing fine‑art picture frame profiles and a front‑view composition around a painting.

## Getting started

```bash
npm install
npm run dev
```

Open `http://localhost:3000/virtual-framing`.

## What’s in the Virtual Framing UI

- Base units: inches. All FrameSpec JSONs are authored/stored as inches.
- Display units toggle: switch inputs/output between `in` and `mm` (base scale unchanged).
- Painting inputs: set picture opening width/height (display units).
- Profile selector and preview: choose a profile; mini contour preview aligns and scales with the front view.
- Front view rendering: white canvas + thin black outlines, event rectangles only at contour direction changes; innermost/outermost emphasized.

## Profiles and DXF import

- Default profile: `data/profiles/Flat.json` (3.0 in wide × 1.5 in tall rectangle), units: `in`.
- Import DXF: use the “Import from DXF” control in `/virtual-framing`.
  - Reads `$INSUNITS` and converts to inches.
  - Supports `LWPOLYLINE` (bulge arcs), `LINE`, and `ARC` entities; chains by endpoints.
  - Optional rotation at import time (CW/CCW/180°) when needed.
  - Writes to `data/profiles/<id>.json` with units `in`.

## Rendering details

- Colors: white, gray, black only.
- Profile preview scales 1:1 with the front view and includes arc extrema to avoid cropping.
- SVG viewBoxes include a tiny edge pad to prevent stroke clipping.
