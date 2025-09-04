'use client';
import { useState } from 'react';
import { TRUSTED_APPS, checkAppByName } from '../../../lib/app/whitelist';

export default function FraudCheckApps() {
  const [search, setSearch] = useState('');
  const [appName, setAppName] = useState('');
  const [checkResult, setCheckResult] = useState<string | null>(null);

  // Filter apps for display
  const filteredApps = TRUSTED_APPS.filter((app: any) =>
    app.toLowerCase().includes(search.toLowerCase())
  );

  const handleCheck = () => {
    if (!appName.trim()) return setCheckResult(null);
    const result = checkAppByName(appName.trim());
    setCheckResult(`${result.trusted ? '✅' : '❌'} ${result.notes}`);
  };

  return (
    <main className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-slate-800 mb-4">
        Verify & Browse Trading Apps
      </h1>

      
      {/* List of trusted apps */}
      <div>
        <h2 className="text-xl font-semibold text-slate-800 mb-3">
          Trusted Apps (Whitelist)
        </h2>
        <input
          type="text"
          placeholder="Search apps..."
          className="w-full border rounded p-2 mb-4 text-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {filteredApps.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {filteredApps.map((app) => (
              <div
                key={app}
                className="flex items-center p-3 bg-green-50 border border-green-200 rounded hover:bg-green-100 transition cursor-pointer"
              >
                {/* Placeholder icon */}
                <div className="w-10 h-10 bg-green-200 rounded-full flex items-center justify-center mr-3">
                  <span className="text-green-700 font-bold text-lg">
                    {app.charAt(0)}
                  </span>
                </div>

                {/* App name */}
                <div className="text-slate-800 font-medium">{app}</div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-red-500">No apps match your search.</p>
        )}
      </div>
    </main>
  );
}
