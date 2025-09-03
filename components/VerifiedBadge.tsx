// components/VerifiedBadge.tsx
'use client';
export default function VerifiedBadge({ verified }: { verified: boolean }) {
  if (!verified)
    return (
      <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">
        Unverified
      </span>
    );
  return (
    <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
      SEBI Verified
    </span>
  );
}
