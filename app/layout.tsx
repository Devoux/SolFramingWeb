import './globals.css';
import type { Metadata } from 'next';
import { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Sol Framing Virtual Studio',
  description: 'Experiment with custom frame profiles around your artwork.'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="app-body">
        <div className="app-shell">
          <header className="app-header">
            <div className="app-header__inner">
              <span className="app-brand">Sol Framing Studio</span>
              <nav className="app-nav">
                <a className="app-nav__link" href="/">
                  Home
                </a>
                <a className="app-nav__link" href="/virtual-framing">
                  Virtual Framing
                </a>
              </nav>
            </div>
          </header>
          <main className="app-main">{children}</main>
        </div>
      </body>
    </html>
  );
}
