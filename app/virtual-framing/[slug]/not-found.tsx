import Link from "next/link";

export default function VirtualFramingNotFound() {
  return (
    <div className="space-y-4 text-center">
      <h1 className="text-3xl font-semibold text-slate-900">Virtual framing space unavailable</h1>
      <p className="text-slate-600">
        We couldn&apos;t find a virtual framing session for this creator. It may have been archived or is
        currently offline.
      </p>
      <Link
        href="/"
        className="inline-flex items-center justify-center rounded-full bg-primary-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-primary-700"
      >
        Explore profiles
      </Link>
    </div>
  );
}
