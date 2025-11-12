import Link from "next/link";

export default function ProfileNotFound() {
  return (
    <div className="space-y-4 text-center">
      <h1 className="text-3xl font-semibold text-slate-900">Profile not found</h1>
      <p className="text-slate-600">The creator you are looking for may have moved or no longer exists.</p>
      <Link
        href="/"
        className="inline-flex items-center justify-center rounded-full bg-primary-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-primary-700"
      >
        Return to profiles
      </Link>
    </div>
  );
}
