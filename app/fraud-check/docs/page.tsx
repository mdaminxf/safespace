'use client';
import { useState } from 'react';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.entry';
import * as pdfjsLib from 'pdfjs-dist/webpack';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

type FraudResult = {
  verdict: string;
  riskScore: number;
  sebi: {
    registration: { valid: boolean; reason?: string };
    redFlags: {
      description: string;
      severity: string;
      matches: string[];
      guidance?: string;
    }[];
  };
  summary: string;
  recommendations: string[];
};

export default function FraudCheckDocs() {
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<FraudResult | null>(null);
  const [loading, setLoading] = useState(false);

  
  const extractTextFromPDF = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  
    let text = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const strings = content.items.map((item: any) => item.str);
      text += strings.join(' ') + '\n';
    }
  
    return text;
  };
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    if (f && f.type === 'application/pdf') {
      const extractedText = await extractTextFromPDF(f);
      setText(extractedText);
    }
  };

  const handleCheck = async () => {
    if (!text.trim()) return alert('Paste text or upload a PDF first');
    setLoading(true);

    try {
      const res = await fetch('/api/analyze-doc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      setResult(data.result ?? data); // handle demo or real endpoint
    } catch (err) {
      console.error(err);
      alert('Error checking document');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-slate-800 mb-4">
        Check SEBI Documents
      </h1>

      <input
        type="file"
        accept=".pdf,.txt"
        onChange={handleFileChange}
        className="mb-4"
      />
      <textarea
        className="w-full border rounded p-3 text-sm"
        rows={6}
        placeholder="Paste SEBI notice / approval text here..."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      <button
        onClick={handleCheck}
        disabled={loading}
        className="mt-4 px-6 py-2 bg-sky-600 text-white rounded hover:bg-sky-700 disabled:opacity-50"
      >
        {loading ? 'Checking...' : 'Run Check'}
      </button>

      {result && (
        <div className="mt-6 bg-white p-4 rounded shadow">
          <h2 className="font-bold text-lg mb-2">Analysis Result</h2>
          <p>
            <strong>Verdict:</strong> {result.verdict} |{' '}
            <strong>Risk Score:</strong> {result.riskScore}
          </p>
          <p>
            <strong>SEBI Registration:</strong>{' '}
            {result.sebi.registration.valid
              ? 'VALID'
              : `INVALID (${result.sebi.registration.reason})`}
          </p>

          <h3 className="mt-3 font-semibold">Red Flags Detected:</h3>
          {result.sebi.redFlags.length > 0 ? (
            <ul className="list-disc ml-5 text-sm">
              {result.sebi.redFlags.map((rf, idx) => (
                <li key={idx}>
                  <strong>{rf.description}</strong> ({rf.severity})<br />
                  Matches: {rf.matches.join(', ')}
                  {rf.guidance && (
                    <div className="text-slate-500">{rf.guidance}</div>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p>No red flags detected</p>
          )}

          <h3 className="mt-3 font-semibold">Summary:</h3>
          <p className="text-sm">{result.summary}</p>

          <h3 className="mt-3 font-semibold">Recommendations:</h3>
          <ul className="list-disc ml-5 text-sm">
            {result.recommendations.map((r, idx) => (
              <li key={idx}>{r}</li>
            ))}
          </ul>
        </div>
      )}
    </main>
  );
}
