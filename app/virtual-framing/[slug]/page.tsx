import Link from 'next/link';
import { notFound } from 'next/navigation';

import { getProfile } from '@/lib/profiles';

type VirtualFramingPageProps = {
  params: { slug: string };
};

export default async function VirtualFramingPage({ params }: VirtualFramingPageProps) {
  const profile = await getProfile(params.slug);

  if (!profile) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-primary-500">
          Virtual Framing Session
        </p>
        <h1 className="text-3xl font-bold text-slate-900">Curate with {profile.name}</h1>
        <p className="text-base text-slate-600">
          This interactive workspace lets you explore matting, moulding, and lighting options tailored to
          {profile.name}&apos;s aesthetic. Upload artwork, adjust wall color, and preview the final composition in
          real-time.
        </p>
      </div>

      <section className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <div className="flex h-96 flex-col items-center justify-center rounded-3xl border border-dashed border-primary-200 bg-white/70 text-center text-slate-500">
          <p className="text-lg font-medium">Virtual framing canvas</p>
          <p className="max-w-sm text-sm text-slate-500">
            Upload an artwork image to begin exploring dynamic framing combinations and lighting scenarios.
          </p>
        </div>
        <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Session checklist</h2>
          <ul className="space-y-2 text-sm text-slate-600">
            <li>✔️ High-resolution photo of your artwork</li>
            <li>✔️ Desired wall color or reference photo</li>
            <li>✔️ Frame finishes or inspiration pieces</li>
          </ul>
          <p className="text-xs text-slate-500">
            Looking for more support? {profile.name} offers guided consultations for premium clients.
          </p>
        </div>
      </section>

      <Link href={`/profiles/${profile.slug}`} className="text-sm font-semibold text-primary-600">
        ← Back to {profile.name}&apos;s profile
      </Link>
    </div>
  );
}
