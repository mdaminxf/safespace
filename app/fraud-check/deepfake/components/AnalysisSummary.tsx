// inside app/fraud-check/deepfake/page.tsx (or a new file imported here)
// Ensure this file is inside a 'use client' context

import { useState } from 'react';

type EvidenceItem = {
  type?: string;
  file?: string;
  ocr_text?: string;
  details?: any;
};

export default function AnalysisSummary({ result }: { result: any }) {
  const [open, setOpen] = useState(true);
  const [showRaw, setShowRaw] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!result) return null;

  const suspicious = Boolean(result.suspicious);
  const score = typeof result.score === 'number' ? result.score : null;
  const evidence: Record<string, any> | EvidenceItem[] = result.evidence ?? result.evidence ?? [];

  const downloadJson = () => {
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analysis-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const copyJson = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(result, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const prettyKey = (k: string) =>
    k
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="mt-3 bg-white p-4 rounded shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <button
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="p-2 bg-slate-100 rounded hover:bg-slate-200"
            title={open ? 'Collapse' : 'Expand'}
          >
            <svg
              className={`w-5 h-5 transform ${open ? 'rotate-90' : ''}`}
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M6 4L14 10L6 16V4Z" fill="currentColor" />
            </svg>
          </button>

          <div>
            <div className="text-sm font-semibold">Summary</div>
            <div className="text-xs text-slate-500">Concise analysis & evidence</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-xs text-slate-500 mr-2">View</div>
          <button
            onClick={() => setShowRaw(false)}
            className={`px-2 py-1 rounded text-xs ${!showRaw ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-700'}`}
          >
            Pretty
          </button>
          <button
            onClick={() => setShowRaw(true)}
            className={`px-2 py-1 rounded text-xs ${showRaw ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-700'}`}
          >
            Raw
          </button>

          <button
            onClick={copyJson}
            className="ml-2 px-2 py-1 bg-slate-100 rounded text-xs hover:bg-slate-200"
            title="Copy JSON"
          >
            {copied ? 'Copied' : 'Copy'}
          </button>
          <button
            onClick={downloadJson}
            className="ml-1 px-2 py-1 bg-slate-100 rounded text-xs hover:bg-slate-200"
            title="Download JSON"
          >
            Download
          </button>
        </div>
      </div>

      {open && (
        <div className="mt-4">
          {/* header badges */}
          <div className="flex items-center gap-3">
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${suspicious ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                {suspicious ? (
                  <path d="M12 2L2 22H22L12 2Z" fill="currentColor" />
                ) : (
                  <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                )}
              </svg>
              {suspicious ? 'SUSPICIOUS' : 'No major red flags'}
            </div>

            {score !== null && (
              <div className="text-xs text-slate-600">
                Score: <span className="font-semibold">{score}</span>
              </div>
            )}

            {/* small quick summary */}
            {result.summary && (
              <div className="ml-2 text-xs text-slate-500">{result.summary}</div>
            )}
          </div>

          {/* body */}
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {/* Left column: key fields */}
            <div>
              <h4 className="text-sm font-semibold mb-2">Key Findings</h4>
              <div className="space-y-2 text-sm text-slate-700">
                {result.ad_required_fields && (
                  <div className="bg-slate-50 p-3 rounded">
                    <div className="text-xs text-slate-500 mb-1">Ad Required Fields</div>
                    <div className="flex gap-2 flex-wrap">
                      {Object.entries(result.ad_required_fields).map(([k, v]) => (
                        <div key={k} className="px-2 py-1 bg-white border rounded text-xs flex items-center gap-2">
                          <span className="font-medium">{prettyKey(k)}:</span>
                          <span className="text-slate-600">{String(v)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {result.ad_violations && result.ad_violations.length > 0 && (
                  <div className="bg-red-50 border border-red-100 p-3 rounded">
                    <div className="text-xs text-red-700 font-semibold">Violations</div>
                    <ul className="list-disc pl-5 mt-2 text-xs text-red-800">
                      {result.ad_violations.map((v: string, i: number) => (
                        <li key={i}>{v}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* citations */}
                {result.citations && result.citations.length > 0 && (
                  <div className="bg-slate-50 p-3 rounded text-xs">
                    <div className="text-xs text-slate-500 mb-1">Citations</div>
                    <ul className="list-disc pl-5 text-xs text-slate-700">
                      {result.citations.map((c: any, i: number) => (
                        <li key={i}>
                          <strong>{c.rule}:</strong> <span className="text-slate-600">{c.ref}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* actions */}
                {result.actions && (
                  <div className="bg-slate-50 p-3 rounded text-xs">
                    <div className="text-xs text-slate-500 mb-1">Suggested Actions</div>
                    <div className="flex gap-2 flex-wrap">
                      {result.actions.map((a: string, i: number) => (
                        <div key={i} className="px-2 py-1 bg-white border rounded text-xs">
                          {a}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right column: Evidence or Raw */}
            <div>
              <h4 className="text-sm font-semibold mb-2">Evidence</h4>

              {!showRaw ? (
                <>
                  <div className="space-y-3">
                    {Array.isArray(evidence) && evidence.length === 0 && (
                      <div className="text-xs text-slate-500">No evidence items found.</div>
                    )}

                    {Array.isArray(evidence) &&
                      evidence.map((it: any, idx: number) => (
                        <details key={idx} className="group bg-slate-50 p-3 rounded">
                          <summary className="cursor-pointer list-none text-sm flex justify-between items-center">
                            <div className="flex items-center gap-3">
                              <div className="text-xs font-medium">{it.type ?? `Frame ${idx + 1}`}</div>
                              <div className="text-xs text-slate-500">{it.file ?? it.id ?? ''}</div>
                            </div>
                            <div className="text-xs text-slate-400 group-open:text-slate-600">Show</div>
                          </summary>

                          <div className="mt-2 text-xs text-slate-700">
                            {it.ocr_text ? (
                              <div>
                                <div className="text-xs text-slate-500 mb-1">OCR</div>
                                <div className="whitespace-pre-wrap bg-white p-2 rounded border text-xs">{it.ocr_text}</div>
                              </div>
                            ) : null}

                            {it.hf ? (
                              <div className="mt-2">
                                <div className="text-xs text-slate-500 mb-1">ML Evidence</div>
                                <pre className="text-xs bg-white p-2 rounded border overflow-auto">{JSON.stringify(it.hf, null, 2)}</pre>
                              </div>
                            ) : null}

                            {it.details && (
                              <div className="mt-2">
                                <div className="text-xs text-slate-500 mb-1">Details</div>
                                <pre className="text-xs bg-white p-2 rounded border overflow-auto">{JSON.stringify(it.details, null, 2)}</pre>
                              </div>
                            )}
                          </div>
                        </details>
                      ))}
                  </div>
                </>
              ) : (
                <pre className="mt-2 overflow-auto bg-slate-50 p-3 rounded text-xs text-slate-700">
                  {JSON.stringify(result, null, 2)}
                </pre>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
