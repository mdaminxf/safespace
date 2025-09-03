'use client';
import { useState } from 'react';

export default function FraudCheckTips() {
  const [tip, setTip] = useState('');
  const [result, setResult] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCheck = async () => {
    if (!tip.trim()) return;

    setLoading(true);
    setResult(null);

    try {
      const resp = await fetch('/api/analyze-tip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tip: tip }),
      });

      if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(txt || 'Server error');
      }

      const data = await resp.json();
      setResult(data.result);
    } catch (err: any) {
      setResult({ error: err.message || 'Unknown error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-slate-800 mb-4">
        Analyze Stock Tips
      </h1>
      <textarea
        className="w-full border rounded p-3 text-sm"
        rows={6}
        placeholder="Paste Telegram/WhatsApp stock tip here..."
        value={tip}
        onChange={(e) => setTip(e.target.value)}
      />
      <button
        onClick={handleCheck}
        disabled={loading || !tip.trim()}
        className={`mt-4 px-6 py-2 rounded text-white ${
          loading ? 'bg-gray-400' : 'bg-sky-600 hover:bg-sky-700'
        }`}
      >
        {loading ? 'Analyzing…' : 'Run Analysis'}
      </button>

      {result && (
        <div className="mt-4 p-4 bg-slate-100 border rounded space-y-2">
          {result.error ? (
            <p className="text-red-600">Error: {result.error}</p>
          ) : (
            <>
              <p>
                <strong>Verdict:</strong> {result.verdict} ({result.riskScore}%)
              </p>
              <p>
                <strong>Summary:</strong> {result.summary}
              </p>
              {result.recommendations?.length > 0 && (
                <div>
                  <strong>Recommendations:</strong>
                  <ul className="list-disc ml-5 text-sm">
                    {result.recommendations.map((r: string, i: number) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
              )}
              {result.disclaimer && (
                <p className="text-xs text-gray-500 mt-2">
                  {result.disclaimer}
                </p>
              )}
            </>
          )}
        </div>
      )}
    </main>
  );
}
