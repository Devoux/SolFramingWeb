import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Sol Framing Profiles",
    template: "%s | Sol Framing"
  },
  description: "Explore artist profiles and frame their work virtually."
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="flex min-h-screen flex-col">
          <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
            <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600" />
                <div>
                  <p className="text-xl font-semibold text-slate-900">Sol Framing</p>
                  <p className="text-sm text-slate-500">Virtual art framing made simple</p>
                </div>
              </div>
              <nav className="text-sm font-medium text-slate-600">
                <a className="hover:text-primary-700" href="/">
                  Profiles
                </a>
              </nav>
            </div>
          </header>
          <main className="flex-1">
            <div className="mx-auto w-full max-w-6xl px-6 py-10">{children}</div>
          </main>
          <footer className="border-t border-slate-200 bg-white/60">
            <div className="mx-auto flex w-full max-w-6xl justify-between px-6 py-6 text-sm text-slate-500">
              <span>© {new Date().getFullYear()} Sol Framing</span>
              <span>Crafted with Next.js & Tailwind CSS</span>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
