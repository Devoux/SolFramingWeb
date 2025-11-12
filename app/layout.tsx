import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';

import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Sol Framing Profiles',
    template: '%s | Sol Framing'
  },
  description: 'Explore artist profiles and frame their work virtually.'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 antialiased">
        <div className="flex min-h-screen flex-col">
          <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
            <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
              <Link href="/" className="flex items-center gap-2">
                <span className="text-xl font-semibold text-slate-900">Sol Framing</span>
                <span className="hidden text-sm text-slate-500 sm:inline">Virtual art framing made simple</span>
              </Link>
              <nav className="flex items-center gap-6 text-sm font-medium text-slate-600">
                <Link href="/" className="transition hover:text-primary-600">
                  Profiles
                </Link>
                <Link href="/virtual-framing" className="transition hover:text-primary-600">
                  Virtual framing
                </Link>
              </nav>
            </div>
          </header>
          <main className="flex-1">
            <div className="mx-auto w-full max-w-6xl px-6 py-10">{children}</div>
          </main>
          <footer className="border-t border-slate-200 bg-white/70">
            <div className="mx-auto flex w-full max-w-6xl justify-between px-6 py-6 text-sm text-slate-500">
              <span>© {new Date().getFullYear()} Sol Framing</span>
              <span>Crafted with Next.js &amp; Tailwind CSS</span>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
