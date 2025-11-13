import { promises as fs } from 'node:fs';
import path from 'node:path';

import { NextResponse } from 'next/server';

import type { ProfileDefinition } from '@/lib/profiles';

// Lightweight DXF parser and converter
type DxfPolyline = { vertices: Array<{ x: number; y: number; bulge?: number }>; closed: boolean };
type DxfLine = { x1: number; y1: number; x2: number; y2: number };
type DxfArc = { cx: number; cy: number; r: number; start: number; end: number };
type DxfDoc = { units?: number; polylines: DxfPolyline[]; lines: DxfLine[]; arcs: DxfArc[] };

type Pt = { x: number; y: number };
type PrimLine = { kind: 'line'; start: Pt; end: Pt };
type PrimArc = { kind: 'arc'; start: Pt; end: Pt; radius: number; clockwise: boolean; largeArc: boolean; center?: Pt };
type Prim = PrimLine | PrimArc;

const UNITS_TO_INCHES: Record<number, number> = {
  0: 1, // Unitless → assume inches
  1: 1, // Inches
  2: 12, // Feet
  3: 63360, // Miles
  4: 1 / 25.4, // Millimeters
  5: 1 / 2.54, // Centimeters
  6: 39.37007874015748, // Meters
  7: 39370.07874015748, // Kilometers
  8: 1 / 1000000, // Microinches
  9: 1 / 1000, // Mils (thousandths of an inch)
  10: 36, // Yards
  11: 3.937007874015748e-9, // Angstroms
  12: 3.937007874015748e-8, // Nanometers
  13: 3.937007874015748e-5, // Microns
  14: 3.937007874015748, // Decimeters
  15: 3.937007874015748e1, // Decameters
  16: 3.937007874015748e2, // Hectometers
  17: 3.937007874015748e8, // Gigameters
  18: 1.5588457e13, // Astronomical units
  19: 5.8786254e17, // Light years
  20: 1.213e19, // Parsecs
  21: 12.0000024 // US Survey Feet
};

function toInchesScale(units?: number): number {
  return UNITS_TO_INCHES[units ?? 0] ?? 1;
}

function parseDxf(text: string): DxfDoc {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const readPair = (i: number) => {
    const code = parseInt(lines[i] ?? '', 10);
    const value = lines[i + 1] ?? '';
    return { code, value } as const;
  };
  let i = 0;
  let section: string | null = null;
  const doc: DxfDoc = { polylines: [], lines: [], arcs: [], units: undefined };

  while (i + 1 < lines.length) {
    const { code, value } = readPair(i);
    i += 2;

    // HEADER variables (e.g., $INSUNITS)
    if (section === 'HEADER' && code === 9) {
      const varName = value.trim();
      // Read until next variable (code 9) or entity (code 0)
      while (i + 1 < lines.length) {
        const p = readPair(i);
        if (p.code === 9 || p.code === 0) break;
        i += 2;
        if (varName === '$INSUNITS' && (p.code === 70 || p.code === 90)) {
          const u = parseInt(p.value, 10);
          if (!Number.isNaN(u)) doc.units = u;
        }
      }
      continue;
    }

    if (code !== 0) continue;

    if (value === 'SECTION') {
      const name = readPair(i);
      i += 2;
      if (name.code === 2) section = name.value.trim();
      continue;
    }
    if (value === 'ENDSEC') {
      section = null;
      continue;
    }
    if (value === 'EOF') break;

    // Past here, handle only entity-boundary code 0 tokens

    if (section === 'ENTITIES') {
      if (value === 'LWPOLYLINE') {
        const vertices: Array<{ x: number; y: number; bulge?: number }> = [];
        let closed = false;
        let vx: number | null = null;
        let vy: number | null = null;
        let vbulge: number | undefined;
        while (i + 1 < lines.length) {
          const p = readPair(i);
          if (p.code === 0) break;
          i += 2;
          if (p.code === 10) vx = parseFloat(p.value);
          else if (p.code === 20) vy = parseFloat(p.value);
          else if (p.code === 42) vbulge = parseFloat(p.value);
          else if (p.code === 70) {
            const flags = parseInt(p.value, 10);
            closed = (flags & 1) === 1;
          }
          if (vx !== null && vy !== null && !Number.isNaN(vx) && !Number.isNaN(vy)) {
            vertices.push({ x: vx, y: vy, bulge: vbulge });
            vx = vy = null as any;
            vbulge = undefined;
          }
        }
        doc.polylines.push({ vertices, closed });
        continue;
      }
      if (value === 'LINE') {
        let x1: number | undefined, y1: number | undefined, x2: number | undefined, y2: number | undefined;
        while (i + 1 < lines.length) {
          const p = readPair(i);
          if (p.code === 0) break;
          i += 2;
          if (p.code === 10) x1 = parseFloat(p.value);
          else if (p.code === 20) y1 = parseFloat(p.value);
          else if (p.code === 11) x2 = parseFloat(p.value);
          else if (p.code === 21) y2 = parseFloat(p.value);
        }
        if (
          x1 !== undefined && y1 !== undefined && x2 !== undefined && y2 !== undefined &&
          ![x1, y1, x2, y2].some((v) => Number.isNaN(v))
        ) {
          doc.lines.push({ x1, y1, x2, y2 });
        }
        continue;
      }
      if (value === 'ARC') {
        let cx: number | undefined, cy: number | undefined, r: number | undefined, sa: number | undefined, ea: number | undefined;
        while (i + 1 < lines.length) {
          const p = readPair(i);
          if (p.code === 0) break;
          i += 2;
          if (p.code === 10) cx = parseFloat(p.value);
          else if (p.code === 20) cy = parseFloat(p.value);
          else if (p.code === 40) r = parseFloat(p.value);
          else if (p.code === 50) sa = parseFloat(p.value);
          else if (p.code === 51) ea = parseFloat(p.value);
        }
        if (
          cx !== undefined && cy !== undefined && r !== undefined && sa !== undefined && ea !== undefined &&
          ![cx, cy, r, sa, ea].some((v) => Number.isNaN(v))
        ) {
          doc.arcs.push({ cx, cy, r, start: sa, end: ea });
        }
        continue;
      }
      // Skip other entity types
    }
  }
  return doc;
}

function bulgeToArcRadius(chord: number, bulge: number): number {
  const included = 4 * Math.atan(Math.abs(bulge));
  const r = chord / (2 * Math.sin(included / 2));
  return r;
}

function normalizeAngleDeg(a: number): number {
  let x = a % 360;
  if (x < 0) x += 360;
  return x;
}

function arcSweepCCW(start: number, end: number): number {
  const s = normalizeAngleDeg(start);
  const e = normalizeAngleDeg(end);
  const delta = e - s;
  return delta >= 0 ? delta : delta + 360;
}

function chooseArcCenter(a: Pt, b: Pt, radius: number, clockwise: boolean, largeArc: boolean): Pt {
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
  const fits = (c: Pt) => {
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
    const isLarge = sweep > Math.PI - 1e-6;
    return isLarge === largeArc;
  };
  if (fits(c1) && !fits(c2)) return c1;
  if (fits(c2) && !fits(c1)) return c2;
  // Fallback: smaller sweep
  const sweepFor = (c: Pt) => {
    const a1 = Math.atan2(a.y - c.y, a.x - c.x);
    const a2 = Math.atan2(b.y - c.y, b.x - c.x);
    let s = clockwise ? a1 - a2 : a2 - a1;
    s = s % (2 * Math.PI);
    if (s < 0) s += 2 * Math.PI;
    return s;
  };
  return sweepFor(c1) <= sweepFor(c2) ? c1 : c2;
}

// Coordinate orientation: keep DXF coordinates as-is (no rotation).
// Preview UI rotates for display; JSON uses X as face offset, Y as depth.

function toFrameSpecFromDxf(doc: DxfDoc, name: string, id: string, rotate: 'none' | 'cw90' | 'ccw90' | '180' = 'none'): ProfileDefinition {
  const scale = toInchesScale(doc.units);
  const rotFn = (p: Pt): Pt => {
    if (rotate === 'cw90') return { x: p.y, y: -p.x };
    if (rotate === 'ccw90') return { x: -p.y, y: p.x };
    if (rotate === '180') return { x: -p.x, y: -p.y };
    return p;
  };
  // Gather primitives
  const prims: Prim[] = [];

  // Prefer LWPOLYLINE if present (convert to prims)
  // Use DXF coordinates directly: X = width (face), Y = depth (towards camera)
  doc.polylines.forEach((pl) => {
    const verts: Pt[] = pl.vertices.map((v) => rotFn({ x: v.x * scale, y: v.y * scale }));
    for (let i = 0; i < verts.length - 1; i++) {
      const a = verts[i];
      const b = verts[i + 1];
      const bulge = pl.vertices[i]?.bulge ?? 0;
      if (Math.abs(bulge) > 1e-9) {
        const chord = Math.hypot(b.x - a.x, b.y - a.y);
        const r = bulgeToArcRadius(chord, bulge);
        const clockwise = bulge < 0; // DXF: bulge < 0 means clockwise
        const largeArc = Math.abs(bulge) > 1; // included angle > 180°
        const center = chooseArcCenter(a, b, r, clockwise, largeArc);
        prims.push({ kind: 'arc', start: a, end: b, radius: r, clockwise, largeArc, center });
      } else {
        prims.push({ kind: 'line', start: a, end: b });
      }
    }
    if (pl.closed && verts.length > 1) {
      const a = verts[verts.length - 1];
      const b = verts[0];
      const bulge = pl.vertices[verts.length - 1]?.bulge ?? 0;
      if (Math.abs(bulge) > 1e-9) {
        const chord = Math.hypot(b.x - a.x, b.y - a.y);
        const r = bulgeToArcRadius(chord, bulge);
        const clockwise = bulge < 0;
        const largeArc = Math.abs(bulge) > 1;
        const center = chooseArcCenter(a, b, r, clockwise, largeArc);
        prims.push({ kind: 'arc', start: a, end: b, radius: r, clockwise, largeArc, center });
      } else {
        prims.push({ kind: 'line', start: a, end: b });
      }
    }
  });

  // Include explicit LINE and ARC entities
  doc.lines.forEach((ln) => {
    prims.push({ kind: 'line', start: rotFn({ x: ln.x1 * scale, y: ln.y1 * scale }), end: rotFn({ x: ln.x2 * scale, y: ln.y2 * scale }) });
  });
  doc.arcs.forEach((arc) => {
    const sa = (arc.start * Math.PI) / 180;
    const ea = (arc.end * Math.PI) / 180;
    const sp = rotFn({ x: (arc.cx + arc.r * Math.cos(sa)) * scale, y: (arc.cy + arc.r * Math.sin(sa)) * scale });
    const ep = rotFn({ x: (arc.cx + arc.r * Math.cos(ea)) * scale, y: (arc.cy + arc.r * Math.sin(ea)) * scale });
    const center = rotFn({ x: arc.cx * scale, y: arc.cy * scale });
    const sweep = arcSweepCCW(arc.start, arc.end);
    const largeArc = sweep > 180;
    // DXF ARC is CCW from start to end
    prims.push({ kind: 'arc', start: sp, end: ep, radius: arc.r * scale, clockwise: false, largeArc, center });
  });

  if (prims.length === 0) {
    throw new Error('No convertible entities (LWPOLYLINE/LINE/ARC) found.');
  }

  // Chain primitives by endpoints
  const chain = chainPrimitives(prims);
  const start = chain[0].start;
  const pts: Pt[] = [start, ...chain.map((p) => p.end)];
  const minX = Math.min(...pts.map((p) => p.x));
  const maxX = Math.max(...pts.map((p) => p.x));
  const minY = Math.min(...pts.map((p) => p.y));
  const maxY = Math.max(...pts.map((p) => p.y));

  const contour: ProfileDefinition['contour'] = chain.map((p) => {
    if (p.kind === 'line') {
      return { type: 'line', to: { x: p.end.x, y: p.end.y } } as const;
    }
    return {
      type: 'arc',
      to: { x: p.end.x, y: p.end.y },
      radius: p.radius,
      clockwise: p.clockwise,
      largeArc: p.largeArc,
      metadata: p.center ? { center: p.center } : undefined
    } as const;
  });

  return {
    $schema: './schema.json',
    id,
    name,
    description: 'Imported from DXF',
    units: 'in',
    dimensions: { width: maxX - minX, height: maxY - minY },
    start,
    contour
  } as ProfileDefinition;
}

function chainPrimitives(prims: Prim[]): Prim[] {
  const used = new Array(prims.length).fill(false);
  const eps = 1e-5;
  const eq = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y) <= eps;
  const reverse = (p: Prim): Prim =>
    p.kind === 'line'
      ? { kind: 'line', start: p.end, end: p.start }
      : { kind: 'arc', start: p.end, end: p.start, radius: p.radius, clockwise: !p.clockwise, largeArc: p.largeArc, center: p.center };

  // Pick a starting primitive whose endpoint is closest to origin (0,0)
  let startIdx = 0;
  let reverseFirst = false;
  let bestDist = Infinity;
  prims.forEach((p, i) => {
    const ds = Math.hypot(p.start.x, p.start.y);
    const de = Math.hypot(p.end.x, p.end.y);
    if (ds < bestDist) {
      bestDist = ds;
      startIdx = i;
      reverseFirst = false;
    }
    if (de < bestDist) {
      bestDist = de;
      startIdx = i;
      reverseFirst = true;
    }
  });
  let curr: Prim = reverseFirst ? reverse(prims[startIdx]) : prims[startIdx];
  used[startIdx] = true;
  const out: Prim[] = [curr];

  // Extend chain greedily
  while (true) {
    let found = false;
    for (let i = 0; i < prims.length; i++) {
      if (used[i]) continue;
      const p = prims[i];
      if (eq(curr.end, p.start)) {
        out.push(p);
        used[i] = true;
        curr = p;
        found = true;
        break;
      }
      if (eq(curr.end, p.end)) {
        const r = reverse(p);
        out.push(r);
        used[i] = true;
        curr = r;
        found = true;
        break;
      }
    }
    if (!found) break;
  }
  return out;
}

function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 64) || 'frame-profile'
  );
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const f = form.get('file');
    if (!(f instanceof File)) {
      return NextResponse.json({ error: 'Missing DXF file' }, { status: 400 });
    }
    const nameInput = (form.get('name') as string) || f.name.replace(/\.dxf$/i, '');
    const idInput = (form.get('id') as string) || slugify(nameInput);
    const rotate = (form.get('rotate') as string) || 'none'; // 'none' | 'cw90' | 'ccw90' | '180'

    const arrayBuffer = await f.arrayBuffer();
    const text = new TextDecoder().decode(new Uint8Array(arrayBuffer));
    const dxf = parseDxf(text);
    const profile = toFrameSpecFromDxf(dxf, nameInput, idInput, rotate);

    // Persist to data/profiles
    const profilesDir = path.resolve(process.cwd(), 'data', 'profiles');
    await fs.mkdir(profilesDir, { recursive: true });
    const outPath = path.join(profilesDir, `${profile.id}.json`);
    await fs.writeFile(outPath, JSON.stringify(profile, null, 2), 'utf8');

    return NextResponse.json({ profile, path: `data/profiles/${profile.id}.json` });
  } catch (error) {
    console.error('DXF convert error', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
