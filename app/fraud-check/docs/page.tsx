"use client";

import React, { useState } from "react";

type RedFlag = {
  description: string;
  severity: "low" | "medium" | "high" | string;
  matches: string[];
  guidance?: string;
};

type SEBIDetails = {
  registration: { valid: boolean; reason?: string };
  redFlags: RedFlag[];
};

type FraudResult = {
  verdict: "Valid" | "Invalid" | "Risky" | string;
  riskScore: number;
  sebi: SEBIDetails;
  summary: string;
  recommendations: string[];
};

export default function FraudCheckDocsPage() {
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FraudResult | null>(null);
  const [raw, setRaw] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setResult(null);
    setRaw(null);
    setError(null);
    const f = e.target.files?.[0] ?? null;
    setFile(f);
  };

  const handleClear = () => {
    setFile(null);
    setText("");
    setResult(null);
    setRaw(null);
    setError(null);
  };

  const handleCheck = async () => {
    setResult(null);
    setRaw(null);
    setError(null);

    if (!file && !text.trim()) {
      setError("Please upload a PDF or paste text before running the check.");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      if (file) formData.append("file", file);
      if (text.trim()) formData.append("text", text.trim());

      const res = await fetch("/api/analyze-doc", { method: "POST", body: formData });

      if (!res.ok) {
        const txt = await res.text();
        setError(`Server error ${res.status}: ${txt || res.statusText}`);
        return;
      }

      const data = await res.json().catch(async () => {
        const txt = await res.text();
        return { _rawTextFallback: txt };
      });

      if (data?.result) {
        setResult(data.result as FraudResult);
        return;
      }

      if (data?.raw) {
        setRaw(data.raw);
        return;
      }

      // generic fallback
      setRaw(JSON.stringify(data, null, 2));
    } catch (err: any) {
      console.error("Request failed:", err);
      setError("Request failed: " + (err?.message ?? String(err)));
    } finally {
      setLoading(false);
    }
  };

  const downloadJSON = () => {
    const payload = result ? JSON.stringify(result, null, 2) : raw ?? "";
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "fraud_analysis.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Check SEBI Documents (Gemini)</h1>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Upload PDF (preferred)</label>
        <input type="file" accept=".pdf" onChange={handleFileChange} />
        {file && (
          <div className="mt-2 text-sm text-slate-600">
            Selected: {file.name} • {(file.size / 1024).toFixed(1)} KB
            <button onClick={() => setFile(null)} className="ml-3 text-xs underline" type="button">
              Remove
            </button>
          </div>
        )}
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Or paste text</label>
        <textarea
          className="w-full border rounded p-3 text-sm"
          rows={8}
          placeholder="Paste SEBI notice / approval text here..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </div>

      <div className="flex gap-3">
        <button onClick={handleCheck} disabled={loading} className="px-5 py-2 bg-sky-600 text-white rounded">
          {loading ? "Running check..." : "Run Check"}
        </button>

        <button onClick={handleClear} disabled={loading} className="px-4 py-2 border rounded text-sm">
          Clear
        </button>

        {(result || raw) && (
          <button onClick={downloadJSON} className="px-4 py-2 border rounded text-sm">
            Download JSON
          </button>
        )}
      </div>

      {error && <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">{error}</div>}

      {result ? (
        <ResultCard result={result} downloadJSON={downloadJSON} />
      ) : raw ? (
        <section className="mt-6 bg-white p-4 rounded shadow">
          <h3 className="font-semibold mb-2">Raw output from Gemini</h3>
          <pre className="whitespace-pre-wrap text-sm">{raw}</pre>
        </section>
      ) : null}
    </main>
  );
}

/* ---------- ResultCard + helper same as earlier UI (copy/paste from prior code) ---------- */

function ResultCard({ result, downloadJSON }: { result: FraudResult; downloadJSON: () => void }) {
  const riskColor = result.riskScore >= 70 ? "bg-red-500" : result.riskScore >= 40 ? "bg-yellow-500" : "bg-green-500";

  return (
    <section className="mt-6 bg-white p-6 rounded-lg shadow-lg">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span
              className={`inline-flex items-center px-3 py-1 text-sm font-semibold rounded-full ${
                result.verdict === "Valid" ? "bg-green-100 text-green-800" : result.verdict === "Invalid" ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"
              }`}
            >
              {result.verdict}
            </span>

            <div className="text-sm text-slate-600">Risk Score</div>
            <div className="ml-2 inline-flex items-center gap-2">
              <div className="w-36 bg-slate-100 rounded-full h-3 overflow-hidden">
                <div className={`h-3 rounded-full ${riskColor}`} style={{ width: `${Math.min(100, Math.max(0, result.riskScore))}%` }} />
              </div>
              <div className="text-sm font-medium w-12 text-right">{result.riskScore}/100</div>
            </div>
          </div>

          <div className="mt-3 text-sm">
            <strong>SEBI Registration:</strong>{" "}
            {result.sebi?.registration?.valid ? (
              <span className="text-green-700">VALID</span>
            ) : (
              <span className="text-red-700">INVALID{result.sebi?.registration?.reason ? ` — ${result.sebi.registration.reason}` : ""}</span>
            )}
          </div>
        </div>

        <div className="flex items-start gap-2">
          <button
            onClick={() => {
              navigator.clipboard.writeText(JSON.stringify(result, null, 2)).then(() => alert("Result copied to clipboard"));
            }}
            className="px-3 py-1 text-sm border rounded text-slate-700 hover:bg-slate-50"
          >
            Copy JSON
          </button>

          <button onClick={downloadJSON} className="px-3 py-1 text-sm bg-sky-600 text-white rounded hover:bg-sky-700">
            Download JSON
          </button>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <h3 className="font-semibold text-lg mb-2">Red flags detected</h3>

          {result.sebi?.redFlags?.length ? (
            <ul className="space-y-3">
              {result.sebi.redFlags.map((rf, idx) => (
                <li key={idx} className="border rounded p-3 bg-slate-50 hover:shadow-sm transition">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-semibold">{rf.description}</div>
                      <div className="text-xs text-slate-500 mt-1">Matches: {rf.matches?.slice(0, 5).join(", ")}</div>
                      {rf.guidance && <div className="mt-2 text-sm text-slate-600">{rf.guidance}</div>}
                    </div>

                    <div className="ml-4 flex-shrink-0">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${rf.severity === "high" ? "bg-red-100 text-red-800" : rf.severity === "medium" ? "bg-yellow-100 text-yellow-800" : "bg-green-100 text-green-800"}`}>
                        {rf.severity?.toUpperCase() ?? "N/A"}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-sm text-slate-600">No red flags detected.</div>
          )}
        </div>

        <div className="md:col-span-1">
          <h3 className="font-semibold text-lg mb-2">Summary</h3>
          <SummaryBox text={result.summary} />

          <h4 className="font-semibold mt-4 mb-2">Recommendations</h4>
          {result.recommendations?.length ? (
            <ul className="list-disc ml-5 text-sm space-y-1">
              {result.recommendations.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          ) : (
            <div className="text-sm text-slate-600">No recommendations provided.</div>
          )}
        </div>
      </div>
    </section>
  );
}

function SummaryBox({ text }: { text?: string }) {
  const [expanded, setExpanded] = React.useState(false);
  const preview = text ? text.slice(0, 240) : "";

  return (
    <div className="border rounded p-3 bg-white text-sm">
      <div className="whitespace-pre-wrap text-slate-800 mb-3">{expanded ? text : preview}
        {text && text.length > 240 && !expanded && "..."}
      </div>

      <div className="flex items-center gap-2">
        {text && text.length > 240 && (
          <button onClick={() => setExpanded((s) => !s)} className="text-sm px-3 py-1 border rounded text-slate-700 hover:bg-slate-50">
            {expanded ? "Collapse" : "Expand"}
          </button>
        )}

        <button
          onClick={() => {
            const toCopy = expanded ? text : preview;
            navigator.clipboard.writeText(toCopy ?? "").then(() => alert("Summary copied"));
          }}
          className="text-sm px-3 py-1 border rounded text-slate-700 hover:bg-slate-50"
        >
          Copy summary
        </button>
      </div>
    </div>
  );
}
