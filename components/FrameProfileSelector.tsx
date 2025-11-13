"use client";

import { useMemo, useState, type ChangeEvent } from 'react';

import type { ProfileDefinition } from '@/lib/profiles';
import { generateFrameSvg } from '@/lib/svgFrame';
import { toProfileContour } from '@/lib/contour';

type Props = {
  profiles: ProfileDefinition[];
};

export default function FrameProfileSelector({ profiles }: Props) {
  const [items, setItems] = useState<ProfileDefinition[]>(profiles);
  const [selectedId, setSelectedId] = useState<string>(profiles[0]?.id ?? '');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selected = useMemo(() => items.find((p) => p.id === selectedId) ?? items[0], [items, selectedId]);

  // Default picture opening is 460 x 610 mm (~18.11" x 24.02"). We keep an internal mm baseline and
  // convert to the selected profile's units for display and frame generation.
  const basePaintingMm = { width: 460, height: 610 };
  const unitFactorFromMm = (u?: string) => {
    switch (u) {
      case 'in':
        return 1 / 25.4;
      case 'cm':
        return 0.1;
      case 'm':
        return 0.001;
      case 'ft':
        return 1 / (25.4 * 12);
      case 'mm':
      default:
        return 1;
    }
  };
  const unitLabel = (u: string) => (u === 'in' ? 'in' : 'mm');

  // UI units toggle: base system uses inches; inputs can be displayed/edited in inches or mm.
  const [inputUnits, setInputUnits] = useState<'in' | 'mm'>('in');
  const [paintingMm, setPaintingMm] = useState<{ width: number; height: number }>(basePaintingMm);

  const displayFromMm = (mm: number) => (inputUnits === 'in' ? mm / 25.4 : mm);
  const mmFromDisplay = (val: number) => (inputUnits === 'in' ? val * 25.4 : val);

  const paintingDisplay = { width: displayFromMm(paintingMm.width), height: displayFromMm(paintingMm.height) };
  const paintingInches = { width: paintingMm.width / 25.4, height: paintingMm.height / 25.4 };

  const contour = useMemo(() => (selected ? toProfileContour(selected) : { segments: [] }), [selected]);
  const edgePadIn = 0.02;
  const frame = useMemo(
    () => generateFrameSvg(paintingInches, contour, { marginRatio: 0, edgePad: edgePadIn }),
    [paintingInches.width, paintingInches.height, contour]
  );
  const maxEventOffset = frame.rectangles.length > 0 ? frame.rectangles[frame.rectangles.length - 1].offset : 0;
  const outerW = paintingInches.width + maxEventOffset * 2;
  const outerH = paintingInches.height + maxEventOffset * 2;
  const frontAspect = outerW > 0 && outerH > 0 ? `${outerW + edgePadIn * 2} / ${outerH + edgePadIn * 2}` : '1 / 1';
  const profileMaxYIn = useMemo(() => (selected ? computeProfileMaxY(selected) : 1), [selected]);
  const profileHeightIn = Math.max(1e-6, profileMaxYIn);
  const profilePadTopIn = Math.max(0.1, 0.02 * profileHeightIn);

  return (
    <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr),360px]">
      <div className="flex flex-col items-center gap-0 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="w-full max-w-xl">
          <div className="rounded-md p-1" style={{ aspectRatio: frontAspect }}>
            <div className="h-full w-full" dangerouslySetInnerHTML={{ __html: frame.svg }} />
          </div>
        </div>
        {selected && profileHeightIn > 0 && (
          <div
            className="mt-3 w-full max-w-xl px-1 pb-1 pt-0"
            style={{ aspectRatio: `${outerW + edgePadIn * 2} / ${profileHeightIn + profilePadTopIn + edgePadIn * 2}` }}
          >
            <div className="h-full w-full">
              <ContourPreview definition={selected} outerWidth={outerW} padTop={profilePadTopIn} edgePad={edgePadIn} />
            </div>
          </div>
        )}
      </div>
      <aside className="space-y-5 rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur">
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-slate-900">Virtual Framing</h2>
          <p className="text-sm text-slate-600">
            Select a frame profile to preview. Small thumbnail shows the cross‑section contour. Units: {unitLabel(inputUnits)} (base: in)
          </p>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <span className="text-slate-600">Display units:</span>
          <div className="inline-flex rounded-lg border border-slate-300 bg-white p-0.5 text-xs shadow-sm">
            <button
              type="button"
              className={`rounded-md px-2.5 py-1 ${inputUnits === 'in' ? 'bg-primary-50 text-primary-700' : 'text-slate-700'}`}
              onClick={() => setInputUnits('in')}
            >
              in
            </button>
            <button
              type="button"
              className={`rounded-md px-2.5 py-1 ${inputUnits === 'mm' ? 'bg-primary-50 text-primary-700' : 'text-slate-700'}`}
              onClick={() => setInputUnits('mm')}
            >
              mm
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="paintingWidth" className="block text-sm font-medium text-slate-700">
              Painting width ({unitLabel(inputUnits)})
            </label>
            <input
              id="paintingWidth"
              type="number"
              step="any"
              min={0}
              value={Number(paintingDisplay.width.toFixed(4))}
              onChange={(e) => setPaintingMm((prev) => ({ ...prev, width: Math.max(0, mmFromDisplay(Number(e.target.value))) }))}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
            />
          </div>
          <div>
            <label htmlFor="paintingHeight" className="block text-sm font-medium text-slate-700">
              Painting height ({unitLabel(inputUnits)})
            </label>
            <input
              id="paintingHeight"
              type="number"
              step="any"
              min={0}
              value={Number(paintingDisplay.height.toFixed(4))}
              onChange={(e) => setPaintingMm((prev) => ({ ...prev, height: Math.max(0, mmFromDisplay(Number(e.target.value))) }))}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="profile" className="block text-sm font-medium text-slate-700">
            Frame profile
          </label>
          <select
            id="profile"
            value={selected?.id}
            onChange={(e) => setSelectedId(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
          >
            {items.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <DxfUploader
          onUploaded={(p) => {
            setItems((prev) => [...prev, p]);
            setSelectedId(p.id);
          }}
          onBusy={setUploading}
          onError={setError}
        />
        {uploading && <div className="text-xs text-slate-500">Converting DXF…</div>}
        {error && <div className="text-xs text-rose-600">{error}</div>}

        {/* Contour preview now shown below the front view in left panel */}

        <table className="w-full border-separate border-spacing-y-2 text-sm text-slate-700">
          <thead className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="text-left">Face offset ({unitLabel(inputUnits)})</th>
              <th className="text-left">Width × Height ({unitLabel(inputUnits)})</th>
            </tr>
          </thead>
          <tbody>
            {frame.rectangles.map((rect) => {
              const k = inputUnits === 'in' ? 1 : 25.4;
              return (
                <tr key={rect.offset} className="rounded-lg bg-slate-100/60">
                  <td className="rounded-l-lg px-3 py-2 font-medium text-slate-700">{(rect.offset * k).toFixed(2)}</td>
                  <td className="rounded-r-lg px-3 py-2 text-slate-600">
                    {(rect.width * k).toFixed(2)} × {(rect.height * k).toFixed(2)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {frame.highlightBands.length > 0 && (
          <div className="space-y-1 rounded-xl bg-primary-50/80 p-4 text-xs text-primary-700">
            {frame.highlightBands.map((band, index) => {
              const k = inputUnits === 'in' ? 1 : 25.4;
              return (
                <div key={`${band.reason}-${index}`}>
                  Ring {index + 1}: {(band.fromOffset * k).toFixed(2)} → {(band.toOffset * k).toFixed(2)} ({band.reason.replace(/-/g, ' ')})
                </div>
              );
            })}
          </div>
        )}
      </aside>
    </section>
  );
}

function ContourPreview({ definition, outerWidth, padTop = 0, edgePad = 0 }: { definition: ProfileDefinition; outerWidth: number; padTop?: number; edgePad?: number }) {
  // Display mapping: positive depth (Y) appears upward in preview
  const mapDisplay = (p: { x: number; y: number }) => ({ x: p.x, y: -p.y });
  const absPoints = useMemo(() => [definition.start ?? { x: 0, y: 0 }, ...definition.contour.map((c) => c.to)], [definition]);
  const minXRaw = Math.min(...absPoints.map((p) => p.x));
  const profMaxY = computeProfileMaxY(definition);
  const minX = minXRaw - edgePad; // small left/right pad to avoid clip
  const width = Math.max(1e-6, outerWidth + edgePad * 2); // match front-view horizontal pad
  const height = Math.max(1e-6, profMaxY + padTop + edgePad + edgePad); // add bottom pad too

  const path = useMemo(() => buildPathPreview(definition, mapDisplay), [definition]);

  return (
    <svg
      viewBox={`${minX} ${-(profMaxY + padTop + edgePad)} ${width} ${height}`}
      role="img"
      aria-label={`Contour preview for ${definition.name}`}
      className="block h-full w-full"
      preserveAspectRatio="xMinYMax meet"
    >
      <path d={path} fill="none" stroke="#000000" strokeWidth={2} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function buildPathPreview(def: ProfileDefinition, mapDisplay: (p: { x: number; y: number }) => { x: number; y: number }): string {
  const start = def.start ?? { x: 0, y: 0 };
  let curr = start;
  let d = `M ${mapDisplay(curr).x} ${mapDisplay(curr).y}`;
  for (const seg of def.contour) {
    if (seg.type === 'line') {
      const p = seg.to;
      d += ` L ${mapDisplay(p).x} ${mapDisplay(p).y}`;
      curr = p;
    } else {
      const end = seg.to;
      const r = seg.radius;
      const cw = !!seg.clockwise;
      const large = !!seg.largeArc;
      const meta = (seg as any).metadata as any;
      const center = meta?.center ?? chooseArcCenter(curr, end, r, cw, large);
      const samples = sampleArc(curr, end, center, cw);
      for (let i = 1; i < samples.length; i++) {
        const p = mapDisplay(samples[i]);
        d += ` L ${p.x} ${p.y}`;
      }
      curr = end;
    }
  }
  return d;
}

function normalizeAngle(a: number): number {
  let x = a % (2 * Math.PI);
  if (x < 0) x += 2 * Math.PI;
  return x;
}

function inSweep(angle: number, start: number, end: number, clockwise: boolean): boolean {
  const a = normalizeAngle(angle);
  const s = normalizeAngle(start);
  const e = normalizeAngle(end);
  if (clockwise) {
    const cw = (s - e + 2 * Math.PI) % (2 * Math.PI);
    const d = (s - a + 2 * Math.PI) % (2 * Math.PI);
    return d <= cw + 1e-9;
  }
  const ccw = (e - s + 2 * Math.PI) % (2 * Math.PI);
  const d = (a - s + 2 * Math.PI) % (2 * Math.PI);
  return d <= ccw + 1e-9;
}

function computeProfileMaxY(def: ProfileDefinition): number {
  const start = def.start ?? { x: 0, y: 0 };
  let curr = start;
  let maxY = start.y;
  for (const seg of def.contour) {
    if (seg.type === 'line') {
      maxY = Math.max(maxY, seg.to.y);
      curr = seg.to;
    } else {
      const end = seg.to;
      const r = seg.radius;
      const cw = !!seg.clockwise;
      const large = !!seg.largeArc;
      const meta = (seg as any).metadata as any;
      const center = meta?.center ?? chooseArcCenter(curr, end, r, cw, large);
      // Endpoints
      maxY = Math.max(maxY, curr.y, end.y);
      const s = Math.atan2(curr.y - center.y, curr.x - center.x);
      const e = Math.atan2(end.y - center.y, end.x - center.x);
      // Check top (pi/2) and bottom (3pi/2) extremes
      const top = Math.PI / 2;
      const bottom = (3 * Math.PI) / 2;
      if (inSweep(top, s, e, cw)) {
        maxY = Math.max(maxY, center.y + r);
      }
      if (inSweep(bottom, s, e, cw)) {
        maxY = Math.max(maxY, center.y - r);
      }
      curr = end;
    }
  }
  // Clamp baseline at 0 (face), typical for profiles
  return Math.max(0, maxY);
}

function chooseArcCenter(a: { x: number; y: number }, b: { x: number; y: number }, radius: number, clockwise: boolean, largeArc: boolean) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const d = Math.hypot(dx, dy);
  const r = Math.max(radius, d / 2);
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const h2 = r * r - (d / 2) * (d / 2);
  const h = Math.sqrt(Math.max(0, h2));
  const ux = dx / d;
  const uy = dy / d;
  const nx = -uy;
  const ny = ux;
  const c1 = { x: mx + nx * h, y: my + ny * h };
  const c2 = { x: mx - nx * h, y: my - ny * h };

  const fits = (c: { x: number; y: number }) => {
    const a1 = Math.atan2(a.y - c.y, a.x - c.x);
    const a2 = Math.atan2(b.y - c.y, b.x - c.x);
    let sweep = 0;
    if (clockwise) {
      sweep = (a1 - a2) % (2 * Math.PI);
      if (sweep < 0) sweep += 2 * Math.PI;
    } else {
      sweep = (a2 - a1) % (2 * Math.PI);
      if (sweep < 0) sweep += 2 * Math.PI;
    }
    const isLarge = sweep > Math.PI - 1e-6; // treat ~180° as large
    return isLarge === largeArc;
  };

  if (fits(c1) && !fits(c2)) return c1;
  if (fits(c2) && !fits(c1)) return c2;
  // Fallback: pick center that yields minimal sweep for requested direction
  const sweepFor = (c: { x: number; y: number }) => {
    const a1 = Math.atan2(a.y - c.y, a.x - c.x);
    const a2 = Math.atan2(b.y - c.y, b.x - c.x);
    let s = clockwise ? a1 - a2 : a2 - a1;
    s = s % (2 * Math.PI);
    if (s < 0) s += 2 * Math.PI;
    return s;
  };
  const s1 = sweepFor(c1);
  const s2 = sweepFor(c2);
  return s1 <= s2 ? c1 : c2;
}

function sampleArc(a: { x: number; y: number }, b: { x: number; y: number }, c: { x: number; y: number }, clockwise: boolean): Array<{ x: number; y: number }> {
  const start = Math.atan2(a.y - c.y, a.x - c.x);
  const end = Math.atan2(b.y - c.y, b.x - c.x);
  let sweep = clockwise ? start - end : end - start;
  sweep = sweep % (2 * Math.PI);
  if (sweep < 0) sweep += 2 * Math.PI;
  const steps = Math.max(6, Math.ceil((sweep * 180) / 12)); // ~12° per segment
  const pts = [] as Array<{ x: number; y: number }>;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const ang = clockwise ? start - t * sweep : start + t * sweep;
    pts.push({ x: c.x + Math.cos(ang) * Math.hypot(a.x - c.x, a.y - c.y), y: c.y + Math.sin(ang) * Math.hypot(a.x - c.x, a.y - c.y) });
  }
  return pts;
}

function DxfUploader({
  onUploaded,
  onBusy,
  onError
}: {
  onUploaded: (profile: ProfileDefinition) => void;
  onBusy?: (busy: boolean) => void;
  onError?: (message: string | null) => void;
}) {
  const [rotation, setRotation] = useState<'none' | 'cw90' | 'ccw90' | '180'>('none');
  async function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const inputEl = e.currentTarget;
    const file = inputEl.files?.[0];
    if (!file) return;
    onError?.(null);
    onBusy?.(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('name', file.name.replace(/\.dxf$/i, ''));
      fd.append('rotate', rotation);
      const res = await fetch('/api/convert-dxf', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to convert DXF');
      }
      onUploaded(data.profile as ProfileDefinition);
    } catch (err) {
      onError?.((err as Error).message);
    } finally {
      onBusy?.(false);
      // reset input to allow re-uploading same file if desired
      try {
        inputEl.value = '';
      } catch {
        // ignore if input is unmounted
      }
    }
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-700">Import from DXF</label>
      <input
        type="file"
        accept=".dxf"
        onChange={handleChange}
        className="block w-full text-sm text-slate-700 file:mr-3 file:rounded-md file:border file:border-slate-300 file:bg-white file:px-3 file:py-2 file:text-sm file:font-medium file:text-slate-700 hover:file:border-slate-400"
      />
      <div className="flex items-center gap-2">
        <label htmlFor="rotation" className="text-xs text-slate-600">Rotation</label>
        <select
          id="rotation"
          value={rotation}
          onChange={(e) => setRotation(e.target.value as any)}
          className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-800"
        >
          <option value="none">None</option>
          <option value="cw90">Clockwise 90°</option>
          <option value="ccw90">Counter‑clockwise 90°</option>
          <option value="180">180°</option>
        </select>
      </div>
      <p className="text-xs text-slate-500">Reads DXF units and converts to inches; stores in data/profiles.</p>
    </div>
  );
}
