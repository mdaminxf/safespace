// app/layout.tsx
import './globals.css'; // Tailwind styles
import Link from 'next/link';

export const metadata = {
  title: 'SEBI SafeSpace',
  description: 'Investor protection tools & adviser marketplace (Demo)',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900">
        {/* NAVBAR */}
        <header className="bg-white shadow sticky top-0 z-50">
          <nav className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-md bg-sky-600 text-white flex items-center justify-center font-bold">
                SS
              </div>
              <span className="font-extrabold text-lg">SafeSpace</span>
            </Link>

            <div className="hidden md:flex items-center gap-6">
              <Link href="/marketplace" className="hover:underline text-sm">
                Marketplace
              </Link>
              <Link
                href="/fraud-check/docs"
                className="hover:underline text-sm"
              >
                Docs Check
              </Link>
              <Link
                href="/fraud-check/deepfake"
                className="hover:underline text-sm"
              >
                DeepFake
              </Link>
              <Link
                href="/fraud-check/apps"
                className="hover:underline text-sm"
              >
                App Verify
              </Link>
              <Link
                href="/fraud-check/tips"
                className="hover:underline text-sm"
              >
                Tips Analyzer
              </Link>
            </div>
          </nav>
        </header>

        {/* PAGE CONTENT */}
        <main>{children}</main>

        {/* FOOTER */}
        <footer className="max-w-7xl mx-auto px-6 mt-12 pb-12 text-sm text-slate-600">
          <div className="border-t pt-6 flex flex-col md:flex-row md:justify-between gap-4">
            <div>
              <div className="font-semibold">SEBI SafeSpace (Demo)</div>
              <div className="text-xs text-slate-500 mt-1">
                Not legal advice. Integrate official SEBI registries for
                production.
              </div>
            </div>

            <div className="flex gap-4 items-center">
              <Link href="/privacy" className="hover:underline">
                Privacy
              </Link>
              <Link href="/terms" className="hover:underline">
                Terms
              </Link>
              <a href="mailto:demo@yourorg.example" className="hover:underline">
                Contact
              </a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
