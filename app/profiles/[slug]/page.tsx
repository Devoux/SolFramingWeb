import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProfile } from "@/lib/profiles";

type ProfilePageProps = {
  params: { slug: string };
};

export default async function ProfilePage({ params }: ProfilePageProps) {
  const profile = await getProfile(params.slug);

  if (!profile) {
    notFound();
  }

  const firstName = profile.name.split(" ")[0];

  return (
    <article className="space-y-8">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-primary-500">
            Meet the creator
          </p>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">
            {profile.name}
          </h1>
          <p className="text-lg text-slate-600">{profile.title}</p>
        </div>
        <Link
          href={`/virtual-framing/${profile.slug}`}
          className="inline-flex items-center justify-center rounded-full bg-primary-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-primary-500/40 transition hover:bg-primary-700"
        >
          Launch virtual framing
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-[280px,1fr]">
        <div className="relative h-72 w-full overflow-hidden rounded-3xl border border-slate-200 shadow-sm">
          <div className={`absolute inset-0 bg-gradient-to-br ${profile.heroColor}`} aria-hidden />
          <Image
            src={profile.thumbnail}
            alt=""
            fill
            className="object-cover opacity-80 mix-blend-overlay"
            priority
          />
        </div>
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">About {firstName}</h2>
          <p className="text-base text-slate-600">{profile.description}</p>
          <p className="text-base text-slate-600">
            Each collaboration with {firstName} includes curated frame pairings, color palettes, and
            lighting studies tailored to your artwork. Explore sketches, inspiration boards, and
            behind-the-scenes process notes before stepping into the virtual framing studio.
          </p>
        </section>
      </div>

      <section className="rounded-3xl border border-dashed border-primary-200 bg-white/60 p-6 text-sm text-slate-600">
        <h3 className="text-base font-semibold text-primary-600">Next steps</h3>
        <ol className="mt-3 list-decimal space-y-2 pl-5">
          <li>Review the portfolio highlights curated for virtual framing sessions.</li>
          <li>Prepare reference photos of your artwork with neutral lighting.</li>
          <li>Join the virtual framing room to iterate on matting, scale, and lighting.</li>
        </ol>
      </section>
    </article>
  );
}
