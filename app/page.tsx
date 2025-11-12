import Image from 'next/image';
import Link from 'next/link';

import { listProfiles } from '@/lib/profiles';

export default async function HomePage() {
  const profiles = await listProfiles();

  return (
    <section className="space-y-8">
      <div className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
          Featured creators
        </h1>
        <p className="max-w-2xl text-base text-slate-600">
          Browse our curated roster of artists and makers to find the perfect match for your next
          virtual framing session.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {profiles.map((profile) => (
          <article
            key={profile.slug}
            className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="relative h-48 w-full overflow-hidden">
              <div className={`absolute inset-0 bg-gradient-to-br ${profile.heroColor}`} aria-hidden />
              <Image
                src={profile.thumbnail}
                alt=""
                fill
                className="object-cover opacity-80 mix-blend-overlay transition duration-200 group-hover:scale-105"
                priority
              />
            </div>
            <div className="flex flex-col gap-3 p-6">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">{profile.name}</h2>
                <p className="text-sm font-medium uppercase tracking-wide text-primary-600">
                  {profile.title}
                </p>
              </div>
              <p className="text-sm text-slate-600">{profile.description}</p>
              <div className="mt-auto flex items-center justify-between pt-4">
                <Link
                  href={`/profiles/${profile.slug}`}
                  className="text-sm font-semibold text-primary-600 transition hover:text-primary-700"
                >
                  View profile
                </Link>
                <span className="text-xs font-medium uppercase text-slate-400">Virtual framing</span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
