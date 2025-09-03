'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ADVISERS } from '../../data/advisers';
import AdviserCard from '../../components/AdviserCard';

type Adviser = {
  id: string;
  name: string;
  regNo: string;
  entityType: string;
  bio: string;
};

export default function AdvisersPage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Adviser[]>(ADVISERS);
  const [loading, setLoading] = useState(false);

  // Live search — local + SEBI API fallback
  useEffect(() => {
    const runSearch = async () => {
      if (!query.trim()) {
        setResults(ADVISERS);
        return;
      }

      setLoading(true);

      // 1. Local search
      const local = ADVISERS.filter(
        (a) =>
          a.name.toLowerCase().includes(query.toLowerCase()) ||
          a.regNo.toLowerCase().includes(query.toLowerCase()) ||
          a.entityType.toLowerCase().includes(query.toLowerCase())
      );

      if (local.length > 0) {
        setResults(local);
        setLoading(false);
        return;
      }

      // 2. SEBI API (mock example)
      try {
        const resp = await fetch(
          `/api/sebi-search?q=${encodeURIComponent(query)}`
        );
        if (resp.ok) {
          const sebiData = await resp.json();
          setResults(sebiData.advisers || []);
        } else {
          setResults([]);
        }
      } catch (err) {
        console.error('SEBI API search failed:', err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    const timeout = setTimeout(runSearch, 400); // debounce typing
    return () => clearTimeout(timeout);
  }, [query]);

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      {/* Header */}
      <div className="max-w-6xl mx-auto flex items-center gap-4 mb-6">
        <button
          onClick={() => router.back()}
          className="text-sm text-blue-600 hover:underline"
        >
          ← Back
        </button>
        <h1 className="text-3xl font-bold text-slate-800">Browse Advisers</h1>
      </div>

      {/* Search Box */}
      <div className="max-w-6xl mx-auto mb-8 flex flex-col md:flex-row items-stretch md:items-center gap-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search advisers by name, SEBI Reg No, or entity type..."
          className="flex-1 px-4 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-sky-500"
        />
      </div>

      {/* Adviser Results */}
      <div className="max-w-6xl mx-auto">
        {loading ? (
          <p className="text-slate-500">Searching...</p>
        ) : results.length === 0 ? (
          <p className="text-red-600 font-medium">No advisers found.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {results.map((a) => (
              <AdviserCard key={a.id} adviser={a} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
