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

  async function fakeAnalyze(source: string) {
    setLoading(true);
    setError(null);
    setResult(null);

    // Simulate delay
    await new Promise((res) => setTimeout(res, 1500));

    // Demo output (mocked result)
    setResult({
      source,
      sizeBytes: file?.size ?? 123456,
      result: {
        suspicious: Math.random() > 0.5,
        score: Math.round(Math.random() * 100),
        evidence: {
          "frame-glitches": Math.random() > 0.3,
          "audio-sync": Math.random() > 0.4,
          "metadata": { codec: "h264", container: "mp4" },
        },
      },
    });

    setLoading(false);
  }

  function analyzeUpload() {
    if (!file) {
      setError('Please select a video file.');
      return;
    }
    fakeAnalyze(`Uploaded file: ${file.name}`);
  }

  function analyzeUrl() {
    if (!url.trim()) {
      setError('Please enter a video URL.');
      return;
    }
    fakeAnalyze(`URL: ${url.trim()}`);
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-slate-800">
          Deepfake / Media Analysis (Demo)
        </h1>
        <p className="text-sm text-slate-600 mt-2">
          This is a <strong>demo-only</strong> interface. The results below are
          <em> simulated</em> for demonstration purposes.
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
              accept="video/*"
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
            Provide a public URL. The server will fetch the media and analyze it
            (simulated).
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
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
