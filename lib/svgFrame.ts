export interface PaintingDimensions {
  width: number;
  height: number;
}

export interface Vector2D {
  x: number;
  y: number;
}

export interface LineSegment {
  kind: 'line';
  /**
   * Relative translation from the current point. If omitted, use dx/dy fallback.
   */
  to?: Vector2D;
  dx?: number;
  dy?: number;
}

export interface ArcSegment {
  kind: 'arc';
  /** Relative end point of the arc measured from the current point. */
  to: Vector2D;
  /** Radius of the arc in the same units as the contour coordinates. */
  radius: number;
  /** Whether the arc sweeps clockwise from the current point. Defaults to clockwise. */
  clockwise?: boolean;
}

export type ContourSegment = LineSegment | ArcSegment;

export interface ProfileContour {
  /** Ordered contour segments starting at the painting face (0, 0). */
  segments: ContourSegment[];
  /** Optional starting point. Defaults to { x: 0, y: 0 }. */
  origin?: Vector2D;
}

export interface FrameRectangle {
  offset: number;
  width: number;
  height: number;
}

export interface HighlightBand {
  fromOffset: number;
  toOffset: number;
  reason: string;
}

export interface FrameSvgResult {
  svg: string;
  viewBox: string;
  rectangles: FrameRectangle[];
  highlightBands: HighlightBand[];
}

interface SegmentComputation {
  start: Vector2D;
  end: Vector2D;
  vector: Vector2D;
  segment: ContourSegment;
}

const PRECISION = 4;

function round(value: number): number {
  return Number(value.toFixed(PRECISION));
}

function resolveEndPoint(segment: ContourSegment, start: Vector2D): Vector2D {
  if (segment.kind === 'line') {
    const dx = segment.to?.x ?? segment.dx ?? 0;
    const dy = segment.to?.y ?? segment.dy ?? 0;
    return { x: start.x + dx, y: start.y + dy };
  }
  return {
    x: start.x + segment.to.x,
    y: start.y + segment.to.y
  };
}

function angleOf(vector: Vector2D): number {
  return Math.atan2(vector.y, vector.x);
}

function computeSegments(profile: ProfileContour): SegmentComputation[] {
  const origin = profile.origin ?? { x: 0, y: 0 };
  const segments: SegmentComputation[] = [];
  let cursor = origin;

  profile.segments.forEach((segment) => {
    const end = resolveEndPoint(segment, cursor);
    const vector = { x: end.x - cursor.x, y: end.y - cursor.y };
    segments.push({ start: cursor, end, vector, segment });
    cursor = end;
  });

  return segments;
}

function collectFaceOffsets(segments: SegmentComputation[]): number[] {
  const offsets = new Set<number>();
  offsets.add(0);
  segments.forEach(({ end }) => {
    offsets.add(round(end.x));
  });
  return Array.from(offsets).sort((a, b) => a - b);
}

function describeTransitionReason(prev: ContourSegment, next: ContourSegment, prevAngle: number, nextAngle: number): string {
  if (prev.kind === 'line' && next.kind === 'line') {
    const delta = Math.abs(prevAngle - nextAngle);
    if (delta < 1e-3) {
      return 'coplanar-line';
    }
    return 'line-to-line';
  }
  if (prev.kind === 'line' && next.kind === 'arc') {
    return 'line-to-arc';
  }
  if (prev.kind === 'arc' && next.kind === 'line') {
    return 'arc-to-line';
  }
  return 'arc-transition';
}

function shouldHighlightTransition(reason: string): boolean {
  return reason === 'line-to-line' || reason === 'line-to-arc' || reason === 'arc-to-line';
}

function buildViewBox(width: number, height: number, marginRatio: number): string {
  const marginX = width * marginRatio;
  const marginY = height * marginRatio;
  const totalWidth = width + marginX * 2;
  const totalHeight = height + marginY * 2;
  const minX = -width / 2 - marginX;
  const minY = -height / 2 - marginY;
  return `${round(minX)} ${round(minY)} ${round(totalWidth)} ${round(totalHeight)}`;
}

function rectElement(width: number, height: number, attributes: Record<string, string | number | undefined>): string {
  const x = -width / 2;
  const y = -height / 2;
  const attrs = Object.entries(attributes)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => `${key}="${value}"`)
    .join(' ');
  return `<rect x="${round(x)}" y="${round(y)}" width="${round(width)}" height="${round(height)}" ${attrs} />`;
}

export function generateFrameSvg(
  painting: PaintingDimensions,
  profile: ProfileContour,
  options?: { marginRatio?: number; highlightColor?: string; strokeColor?: string; backgroundColor?: string; paintingFill?: string }
): FrameSvgResult {
  if (painting.width <= 0 || painting.height <= 0) {
    throw new Error('Painting dimensions must be positive numbers.');
  }

  const marginRatio = options?.marginRatio ?? 0.12;
  const highlightColor = options?.highlightColor ?? '#e5e7eb';
  const strokeColor = options?.strokeColor ?? '#1f2937';
  const backgroundColor = options?.backgroundColor ?? '#0f172a';
  const paintingFill = options?.paintingFill ?? '#f8fafc';

  const segments = computeSegments(profile);
  const offsets = collectFaceOffsets(segments);
  const rectangles: FrameRectangle[] = offsets.map((offset) => ({
    offset,
    width: round(painting.width + offset * 2),
    height: round(painting.height + offset * 2)
  }));

  const highlightBands: HighlightBand[] = [];
  segments.forEach((segment, index) => {
    const next = segments[index + 1];
    if (!next) {
      return;
    }
    const reason = describeTransitionReason(segment.segment, next.segment, angleOf(segment.vector), angleOf(next.vector));
    if (!shouldHighlightTransition(reason)) {
      return;
    }
    const innerOffset = round(segment.end.x);
    const outerOffset = round(next.end.x);
    if (outerOffset === innerOffset) {
      return;
    }
    const fromOffset = Math.min(innerOffset, outerOffset);
    const toOffset = Math.max(innerOffset, outerOffset);
    highlightBands.push({ fromOffset, toOffset, reason });
  });

  const maxOffset = offsets[offsets.length - 1] ?? 0;
  const outerWidth = painting.width + maxOffset * 2;
  const outerHeight = painting.height + maxOffset * 2;
  const viewBox = buildViewBox(outerWidth, outerHeight, marginRatio);

  const shapes: string[] = [];
  shapes.push(
    rectElement(outerWidth + outerWidth * marginRatio * 2, outerHeight + outerHeight * marginRatio * 2, {
      fill: backgroundColor,
      'aria-hidden': 'true'
    })
  );

  highlightBands.forEach((band) => {
    const midOffset = (band.fromOffset + band.toOffset) / 2;
    const width = painting.width + midOffset * 2;
    const height = painting.height + midOffset * 2;
    const strokeWidth = Math.abs(band.toOffset - band.fromOffset);
    shapes.push(
      rectElement(width, height, {
        fill: 'none',
        stroke: highlightColor,
        'stroke-width': round(strokeWidth),
        'vector-effect': 'non-scaling-stroke',
        'stroke-linejoin': 'round',
        'data-band-reason': band.reason
      })
    );
  });

  rectangles
    .filter((rect) => rect.offset > 0)
    .reverse()
    .forEach((rect) => {
      shapes.push(
        rectElement(rect.width, rect.height, {
          fill: 'none',
          stroke: strokeColor,
          'stroke-width': 1,
          'vector-effect': 'non-scaling-stroke',
          'stroke-linejoin': 'round',
          'data-face-offset': rect.offset
        })
      );
    });

  shapes.push(
    rectElement(painting.width, painting.height, {
      fill: paintingFill,
      stroke: '#111827',
      'stroke-width': 1,
      'vector-effect': 'non-scaling-stroke',
      'data-role': 'painting'
    })
  );

  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Virtual frame preview">`,
    ...shapes,
    '</svg>'
  ].join('');

  return {
    svg,
    viewBox,
    rectangles,
    highlightBands
  };
}
