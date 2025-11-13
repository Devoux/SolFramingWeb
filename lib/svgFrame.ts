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
    offsets.add(round(Math.abs(end.x)));
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
  options?: { marginRatio?: number; edgePad?: number }
): FrameSvgResult {
  if (painting.width <= 0 || painting.height <= 0) {
    throw new Error('Painting dimensions must be positive numbers.');
  }

  const marginRatio = options?.marginRatio ?? 0.12;
  const edgePad = options?.edgePad ?? 0.02; // small pad in base units to avoid clip of strokes

  const segments = computeSegments(profile);
  // Collect event offsets where contour direction changes (line/arc transitions and line-to-line bends).
  const eventOffsetSet = new Set<number>();
  segments.forEach((segment, index) => {
    const next = segments[index + 1];
    if (!next) return;
    const reason = describeTransitionReason(segment.segment, next.segment, angleOf(segment.vector), angleOf(next.vector));
    if (reason === 'coplanar-line') return;
    const at = round(Math.abs(segment.end.x));
    eventOffsetSet.add(at);
  });
  const eventOffsets = Array.from(eventOffsetSet).sort((a, b) => a - b);
  const rectangles: FrameRectangle[] = eventOffsets.map((offset) => ({
    offset,
    width: round(painting.width + offset * 2),
    height: round(painting.height + offset * 2)
  }));
  const highlightBands: HighlightBand[] = [];

  const maxOffset = eventOffsets[eventOffsets.length - 1] ?? 0;
  const outerWidth = painting.width + maxOffset * 2;
  const outerHeight = painting.height + maxOffset * 2;
  const minX = -outerWidth / 2 - edgePad;
  const minY = -outerHeight / 2 - edgePad;
  const vbWidth = outerWidth + edgePad * 2;
  const vbHeight = outerHeight + edgePad * 2;
  const viewBox = `${round(minX)} ${round(minY)} ${round(vbWidth)} ${round(vbHeight)}`;

  const shapes: string[] = [];

  // Event rectangles: thin gray lines, innermost and outermost emphasized in black and thicker stroke
  if (rectangles.length > 0) {
    const first = rectangles[0].offset;
    const last = rectangles[rectangles.length - 1].offset;
    rectangles.forEach((rect) => {
      const isEdge = rect.offset === first || rect.offset === last;
      shapes.push(
        rectElement(rect.width, rect.height, {
          fill: 'none',
          stroke: isEdge ? '#000000' : '#9ca3af',
          'stroke-width': isEdge ? 2 : 1,
          'vector-effect': 'non-scaling-stroke',
          'stroke-linejoin': 'round',
          'data-event-offset': rect.offset
        })
      );
    });
  }

  // Painting (canvas): white fill, thin black stroke
  shapes.push(
    rectElement(painting.width, painting.height, {
      fill: '#ffffff',
      stroke: '#000000',
      'stroke-width': 1,
      'vector-effect': 'non-scaling-stroke',
      'data-role': 'painting'
    })
  );

  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" preserveAspectRatio="xMinYMid meet" role="img" aria-label="Virtual frame preview" width="100%" height="100%">`,
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
