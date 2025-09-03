// app/fraud-check/deepfake/page.tsx
'use client';
import { useState } from 'react';

export default function DeepfakePage() {
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setResult(null);
    setError(null);
    const f = e.target.files?.[0] ?? null;
    setFile(f);
  };

  async function analyzeUpload() {
    setError(null);
    setResult(null);
    if (!file) {
      setError('Please select a video file to upload.');
      return;
    }

    setLoading(true);
    try {
      const form = new FormData();
      form.append('file', file);

      const res = await fetch('/api/deepfake', {
        method: 'POST',
        body: form,
      });

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`Server error ${res.status}: ${text}`);
      }
      const json = await res.json();
      setResult(json);
    } catch (err: any) {
      setError(String(err?.message ?? err));
    } finally {
      setLoading(false);
    }
  }

  async function analyzeUrl() {
    setError(null);
    setResult(null);
    if (!url.trim()) {
      setError('Please enter a video URL to analyze.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/deepfake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`Server error ${res.status}: ${text}`);
      }
      const json = await res.json();
      setResult(json);
    } catch (err: any) {
      setError(String(err?.message ?? err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-slate-800">
          Deepfake / Media Analysis (Demo)
        </h1>
        <p className="text-sm text-slate-600 mt-2">
          Upload a video file or provide a public video URL. The server runs a
          heuristic deepfake check and returns suspicious indicators.
        </p>

        {/* File upload */}
        <section className="mt-6 bg-white p-4 rounded shadow">
          <h2 className="font-semibold">Upload Video</h2>
          <p className="text-xs text-slate-500 mt-1">
            Supported: mp4, mov, webm. Max demo size: 50 MB.
          </p>

          <div className="mt-3 flex gap-3 items-center">
            <input
              type="file"
              accept="video/*,audio/*,image/*"
              onChange={handleFileChange}
            />
            <button
              onClick={analyzeUpload}
              className="px-4 py-2 bg-sky-600 text-white rounded"
              disabled={loading || !file}
            >
              {loading ? 'Analyzing...' : 'Analyze Upload'}
            </button>
            <div className="text-sm text-slate-600">
              {file
                ? `${file.name} (${Math.round(file.size / 1024)} KB)`
                : 'No file selected'}
            </div>
          </div>
        </section>

        {/* URL analyze */}
        <section className="mt-6 bg-white p-4 rounded shadow">
          <h2 className="font-semibold">Analyze by URL</h2>
          <p className="text-xs text-slate-500 mt-1">
            Provide a public URL (CORS permitting). The server will fetch the
            media and analyze it.
          </p>

          <div className="mt-3 flex gap-3">
            <input
              type="url"
              placeholder="https://example.com/video.mp4"
              className="flex-1 border rounded px-3 py-2"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <button
              onClick={analyzeUrl}
              className="px-4 py-2 bg-sky-600 text-white rounded"
              disabled={loading}
            >
              {loading ? 'Analyzing...' : 'Analyze URL'}
            </button>
          </div>
        </section>

        {/* Result / error */}
        <section className="mt-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700">
              {error}
            </div>
          )}

          {result && (
            <div className="mt-4 bg-white p-4 rounded shadow">
              <h3 className="font-semibold">Analysis Result</h3>
              <p className="text-sm text-slate-600 mt-1">
                Source:{' '}
                <code className="text-xs bg-slate-100 px-1 rounded">
                  {result.source}
                </code>
              </p>
              <p className="text-sm text-slate-600">
                Size: {Math.round((result.sizeBytes ?? 0) / 1024)} KB
              </p>

              <div className="mt-3">
                <strong>Summary:</strong>
                <pre className="mt-2 overflow-auto bg-slate-50 p-3 rounded text-xs text-slate-700">
                  {JSON.stringify(result.result, null, 2)}
                </pre>
              </div>

              {/* Quick verdict */}
              <div className="mt-3">
                <strong>Quick verdict:</strong>{' '}
                {result.result?.suspicious ? (
                  <span className="text-red-700 font-semibold ml-2">
                    SUSPICIOUS
                  </span>
                ) : (
                  <span className="text-green-700 font-semibold ml-2">
                    No major red flags
                  </span>
                )}
                <div className="text-xs text-slate-500 mt-1">
                  Score (heuristic): {result.result?.score ?? 'n/a'}
                </div>
              </div>

              {/* Evidence (key fields) */}
              {result.result?.evidence && (
                <div className="mt-3">
                  <strong>Evidence:</strong>
                  <ul className="list-disc pl-5 text-sm mt-2 text-slate-700">
                    {Object.entries(result.result.evidence).map(([k, v]) => (
                      <li key={k}>
                        <span className="font-medium">{k}:</span>{' '}
                        {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
