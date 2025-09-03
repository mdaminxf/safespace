// components/Header.tsx
'use client';
import Link from 'next/link';

export default function Header() {
  return (
    <nav className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div
          aria-hidden
          className="w-10 h-10 rounded-md bg-sky-600 flex items-center justify-center text-white font-bold"
        >
          SS
        </div>
        <div>
          <div className="font-extrabold">SEBI SafeSpace</div>
          <div className="text-xs text-slate-500">
            Adviser Marketplace • Fraud Detection (Demo)
          </div>
        </div>
      </div>

      <div className="hidden md:flex items-center gap-6">
        <Link href="/advisers" className="text-sm hover:underline">
          Marketplace
        </Link>
        <Link href="/fraud-check/docs" className="text-sm hover:underline">
          Docs Check
        </Link>
        <Link href="/fraud-check/apps" className="text-sm hover:underline">
          App Verify
        </Link>
        <Link href="/fraud-check/tips" className="text-sm hover:underline">
          Tips Analyzer
        </Link>
      </div>
    </nav>
  );
}
