// components/AdviserCard.tsx
'use client';
import Link from 'next/link';
import VerifiedBadge from './VerifiedBadge';

export default function AdviserCard({ adviser }: { adviser: any }) {
  return (
    <div className="bg-white p-4 rounded shadow">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">{adviser.name}</h3>
          <p className="text-sm text-slate-500">{adviser.entityType}</p>
          <p className="text-xs text-slate-400">Reg: {adviser.regNo}</p>
        </div>
        <VerifiedBadge verified={adviser.verified} />
      </div>
      <p className="mt-3 text-sm">{adviser.bio ?? 'No bio yet.'}</p>
      <div className="mt-3 flex gap-2">
        <Link
          href={`/advisers/${adviser.id}`}
          className="text-sm px-3 py-1 bg-sky-600 text-white rounded"
        >
          View
        </Link>
      </div>
    </div>
  );
}
