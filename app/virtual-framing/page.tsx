import { generateFrameSvg, type ProfileContour } from '@/lib/svgFrame';

const demoPainting = {
  width: 460,
  height: 610
};

const demoProfile: ProfileContour = {
  segments: [
    { kind: 'line', to: { x: 6, y: -2 } },
    { kind: 'line', to: { x: 8, y: -4 } },
    { kind: 'arc', to: { x: 6, y: 6 }, radius: 6, clockwise: true },
    { kind: 'line', to: { x: 6, y: 2 } },
    { kind: 'line', to: { x: 6, y: -2 } }
  ]
};

export default function VirtualFramingPage() {
  const frame = generateFrameSvg(demoPainting, demoProfile, {
    highlightColor: '#cbd5f5',
    backgroundColor: 'rgba(15,23,42,0.92)',
    paintingFill: '#fff7ed'
  });

  return (
    <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr),340px]">
      <div className="flex items-center justify-center rounded-3xl border border-slate-200 bg-slate-900/95 p-6 shadow-lg shadow-slate-900/20">
        <div
          className="w-full max-w-xl"
          style={{ aspectRatio: '1 / 1' }}
          dangerouslySetInnerHTML={{ __html: frame.svg }}
        />
      </div>
      <aside className="space-y-4 rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur">
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-slate-900">Virtual Framing</h2>
          <p className="text-sm text-slate-600">
            Preview of a frame profile swept around a painting measuring <strong>{demoPainting.width}mm</strong> ×{' '}
            <strong>{demoPainting.height}mm</strong>. Highlighted rings mark transitions where the contour changes direction
            between segments.
          </p>
        </div>
        <table className="w-full border-separate border-spacing-y-2 text-sm text-slate-600">
          <thead className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="text-left">Face offset (mm)</th>
              <th className="text-left">Width × Height (mm)</th>
            </tr>
          </thead>
          <tbody>
            {frame.rectangles.map((rect) => (
              <tr key={rect.offset} className="rounded-lg bg-slate-100/60">
                <td className="rounded-l-lg px-3 py-2 font-medium text-slate-700">{rect.offset.toFixed(1)}</td>
                <td className="rounded-r-lg px-3 py-2 text-slate-600">
                  {rect.width.toFixed(1)} × {rect.height.toFixed(1)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {frame.highlightBands.length > 0 && (
          <div className="space-y-1 rounded-xl bg-primary-50/80 p-4 text-xs text-primary-700">
            {frame.highlightBands.map((band, index) => (
              <div key={`${band.reason}-${index}`}>
                Ring {index + 1}: {band.fromOffset.toFixed(1)}mm → {band.toOffset.toFixed(1)}mm ({band.reason.replace(/-/g, ' ')})
              </div>
            ))}
          </div>
        )}
      </aside>
    </section>
  );
}
