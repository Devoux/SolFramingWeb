import type { ProfileDefinition } from '@/lib/profiles';
import type { ProfileContour, ContourSegment } from '@/lib/svgFrame';

export function toProfileContour(definition: ProfileDefinition): ProfileContour {
  const start = definition.start ?? { x: 0, y: 0 };
  let prev = start;

  const segments: ContourSegment[] = definition.contour.map((seg) => {
    const dx = seg.to.x - prev.x;
    const dy = seg.to.y - prev.y;
    prev = seg.to;

    if (seg.type === 'line') {
      return { kind: 'line', to: { x: dx, y: dy } };
    }
    return { kind: 'arc', to: { x: dx, y: dy }, radius: seg.radius, clockwise: seg.clockwise };
  });

  return { origin: start, segments };
}

