import Link from 'next/link';

export default function HomePage() {
  return (
    <section className="page-section">
      <h1 className="page-title">Welcome to Sol Framing</h1>
      <p className="page-lede">
        Prototype tooling for experimenting with moulding profiles and frame layouts. Use the Virtual
        Framing lab to visualise how a contour sweeps around a painting at true scale.
      </p>
      <Link href="/virtual-framing" className="button-primary">
        Open Virtual Framing
      </Link>
    </section>
  );
}
