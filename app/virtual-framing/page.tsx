import { generateFrameSvg, type ProfileContour } from '../../lib/svgFrame';

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
    backgroundColor: 'rgba(15,23,42,0)',
    paintingFill: '#fff7ed'
  });

  return (
    <section className="frame-layout">
      <div className="frame-canvas">
        <div dangerouslySetInnerHTML={{ __html: frame.svg }} style={{ width: '100%', height: '100%', aspectRatio: '1 / 1' }} />
      </div>
      <aside className="frame-meta">
        <h2 className="frame-meta__title">Virtual Framing</h2>
        <p className="frame-meta__legend">
          Preview of a frame profile swept around a painting measuring <strong>{demoPainting.width}mm</strong> ×{' '}
          <strong>{demoPainting.height}mm</strong>. Highlighted rings mark transitions where the contour changes direction
          between segments.
        </p>
        <table className="frame-meta__table">
          <thead>
            <tr>
              <th scope="col">Face offset (mm)</th>
              <th scope="col">Width × Height (mm)</th>
            </tr>
          </thead>
          <tbody>
            {frame.rectangles.map((rect) => (
              <tr key={rect.offset}>
                <td>{rect.offset.toFixed(1)}</td>
                <td>
                  {rect.width.toFixed(1)} × {rect.height.toFixed(1)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {frame.highlightBands.length > 0 && (
          <div className="frame-meta__legend">
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
