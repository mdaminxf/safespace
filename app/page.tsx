// app/page.tsx
'use client';

import Link from 'next/link';
export default function Home(): JSX.Element {
  const features = [
    {
      title: 'Rules-first engine',
      descr:
        'Regex + heuristics detect clear fraud signals (guaranteed returns, insider tips, OTP requests).',
    },
    {
      title: 'SEBI RegNo Verification',
      descr:
        'Flexible extraction + mock registry; production: integrate official SEBI registry.',
    },
    {
      title: 'Document OCR & Analysis',
      descr:
        'PDF text extraction, suspicious-term scanning, and metadata checks.',
    },
    {
      title: 'App Whitelist Check',
      descr:
        'Compare submitted app names against trusted brokers & warn for unknown apps.',
    },
    {
      title: 'Explainable Risk Scoring',
      descr:
        'Transparent score + human-readable recommendations for each result.',
    },
    {
      title: 'Optional ML Layer',
      descr:
        'Zero-shot / classification (HuggingFace/GenAI) as a heuristic, non-blocking.',
    },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900">
      {/* HERO */}
      <header className="max-w-6xl mx-auto px-6 text-center mt-6">
        <h1 className="text-3xl md:text-4xl leading-tight">
          Protect retail investors — detect fraudulent advisers, fake SEBI
          letters & scam apps instantly
        </h1>
        <p className="mt-4 max-w-3xl mx-auto text-lg text-slate-600">
          Demo MVP: combine rules-first detection, OCR document analysis, SEBI
          registration checks and explainable risk scoring. Built for rapid demo
          — production-ready with SEBI API integration and enhanced OCR/visual
          checks.
        </p>

        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center items-center">
          <a
            href="/marketplace"
            target="_blank"
            rel="noreferrer"
            className="px-6 py-3 bg-orange-500 text-white rounded-md font-semibold shadow hover:bg-orange-600"
          >
            Marketplace
          </a>
          <a
            href="/fraud-check/docs"
            target="_blank"
            rel="noreferrer"
            className="px-6 py-3 border rounded-md font-semibold hover:bg-slate-50"
          >
            Analyze a Doc
          </a>
        </div>

        <div className="mt-6 flex justify-center gap-4">
          <span className="text-xs bg-green-50 text-green-700 px-3 py-1 rounded-full">
            Demo-ready
          </span>
          <span className="text-xs bg-sky-50 text-sky-700 px-3 py-1 rounded-full">
            Rules + ML
          </span>
          <span className="text-xs bg-yellow-50 text-yellow-700 px-3 py-1 rounded-full">
            Explainable
          </span>
        </div>
      </header>

      {/* TOOLS (side-by-side) */}
      <section className="max-w-6xl mx-auto px-6 mt-12">
        <h2 className="text-2xl font-bold">Core Tools</h2>
        <p className="mt-2 text-sm text-slate-600">
          Each tool has its own page — click to open and run. Cards highlight
          the key capabilities you can demo to judges.
        </p>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Documents */}
          <article className="bg-white p-5 rounded-xl shadow hover:shadow-lg transition">
            <div className="flex items-center gap-3">
              <svg
                className="w-10 h-10 text-sky-600"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden
              >
                <path
                  d="M7 2h6l6 6v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div>
                <h3 className="font-semibold">Check Documents</h3>
                <div className="text-xs text-slate-500">
                  OCR + rules scan to detect fake SEBI letters, approvals and
                  suspicious text.
                </div>
              </div>
            </div>

            <ul className="mt-4 text-sm text-slate-600 space-y-2">
              <li>• Extract text from PDF & detect suspicious terms</li>
              <li>• Flag: "approved by SEBI", "guaranteed allotment", etc.</li>
              <li>
                • Returns extracted text, suspicious flag, recommendations
              </li>
            </ul>

            <div className="mt-4 flex gap-2">
              <a
                href="/fraud-check/docs"
                target="_blank"
                rel="noreferrer"
                className="px-3 py-2 bg-sky-600 text-white rounded-md text-sm"
              >
                Open Docs
              </a>
              <button
                onClick={() => window.open('/fraud-check/docs', '_blank')}
                className="px-3 py-2 border rounded-md text-sm"
              >
                One-click Demo
              </button>
            </div>
          </article>
          {/* Deepfake / Media Analysis */}
          <article className="bg-white p-5 rounded-xl shadow hover:shadow-lg transition">
            <div className="flex items-center gap-3">
              <svg
                className="w-10 h-10 text-purple-600"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden
              >
                <path
                  d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10
        10-4.48 10-10S17.52 2 12 2z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M2 12h20"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
              <div>
                <h3 className="font-semibold">Deepfake / Media Analysis</h3>
                <div className="text-xs text-slate-500">
                  Upload videos or provide URLs. Check for synthetic/deepfake
                  media using heuristic detection (demo/mock).
                </div>
              </div>
            </div>

            <ul className="mt-4 text-sm text-slate-600 space-y-2">
              <li>• Upload local video file or provide public URL</li>
              <li>
                • Heuristic deepfake detection (file size, frame analysis)
              </li>
              <li>• Returns suspicious flag, notes, and analysis summary</li>
            </ul>

            <div className="mt-4 flex gap-2">
              <a
                href="/fraud-check/deepfake"
                target="_blank"
                rel="noreferrer"
                className="px-3 py-2 bg-purple-600 text-white rounded-md text-sm"
              >
                Open Deepfake Tool
              </a>
              <button
                onClick={() => window.open('/fraud-check/deepfake', '_blank')}
                className="px-3 py-2 border rounded-md text-sm"
              >
                One-click Demo
              </button>
            </div>
          </article>

          {/* Apps */}
          <article className="bg-white p-5 rounded-xl shadow hover:shadow-lg transition">
            <div className="flex items-center gap-3">
              <svg
                className="w-10 h-10 text-green-600"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden
              >
                <rect
                  x="3"
                  y="3"
                  width="18"
                  height="18"
                  rx="3"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
              </svg>
              <div>
                <h3 className="font-semibold">Verify Trading Apps</h3>
                <div className="text-xs text-slate-500">
                  Whitelist checks, UI/branding similarity detection
                  (prototype), and app verification warnings.
                </div>
              </div>
            </div>

            <ul className="mt-4 text-sm text-slate-600 space-y-2">
              <li>• Whitelist of trusted brokers (demo)</li>
              <li>• Warn and recommend not to install unknown apps</li>
              <li>
                • Easy to extend by adding metadata & app signature checks
              </li>
            </ul>

            <div className="mt-4 flex gap-2">
              <a
                href="/fraud-check/apps"
                target="_blank"
                rel="noreferrer"
                className="px-3 py-2 bg-green-600 text-white rounded-md text-sm"
              >
                Open App Verifier
              </a>
              <button
                onClick={() => window.open('/fraud-check/apps', '_blank')}
                className="px-3 py-2 border rounded-md text-sm"
              >
                One-click Demo
              </button>
            </div>
          </article>

          {/* Tips */}
          <article className="bg-white p-5 rounded-xl shadow hover:shadow-lg transition">
            <div className="flex items-center gap-3">
              <svg
                className="w-10 h-10 text-orange-500"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden
              >
                <path
                  d="M21 15a2 2 0 0 1-2 2H8l-5 3V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div>
                <h3 className="font-semibold">Analyze Stock Tips</h3>
                <div className="text-xs text-slate-500">
                  Paste Telegram/WhatsApp tips, run red-flag scan and optional
                  ML classification, get verdict & recommendations.
                </div>
              </div>
            </div>

            <ul className="mt-4 text-sm text-slate-600 space-y-2">
              <li>• Detect "guaranteed", "inside info", group invites</li>
              <li>• Produce risk score, red-flag matches & guidance</li>
              <li>• Integrate market anomaly checks (future)</li>
            </ul>

            <div className="mt-4 flex gap-2">
              <a
                href="/fraud-check/tips"
                target="_blank"
                rel="noreferrer"
                className="px-3 py-2 bg-orange-500 text-white rounded-md text-sm"
              >
                Open Tips
              </a>
              <button
                onClick={() => window.open('/fraud-check/tips', '_blank')}
                className="px-3 py-2 border rounded-md text-sm"
              >
                One-click Demo
              </button>
            </div>
          </article>
        </div>
      </section>

      {/* WORKING / DETAILS */}
      <section className="max-w-6xl mx-auto px-6 mt-12 grid gap-6 md:grid-cols-2">
        <div className="bg-white p-6 rounded-xl shadow">
          <h3 className="text-lg font-bold">How it works (technical)</h3>
          <ol className="mt-4 list-decimal pl-5 text-sm text-slate-600 space-y-2">
            <li>
              <strong>Input:</strong> advisor bio, tip text, or PDF upload.
            </li>
            <li>
              <strong>Rules engine:</strong> regex scans for SEBI-aligned red
              flags (guarantees, insider tips, OTP requests).
            </li>
            <li>
              <strong>SEBI check:</strong> flexible RegNo extraction + lookup
              (mock DB). Replace with SEBI feed for production.
            </li>
            <li>
              <strong>Document analysis:</strong> {`pdfjs OCR -> extract text ->
              apply rules. For scanned PDFs add Tesseract/Cloud OCR.`}
            </li>
            <li>
              <strong>ML layer (optional):</strong> zero-shot classification
              (HF/GenAI) for nuanced text, non-blocking to rules-first result.
            </li>
            <li>
              <strong>Output:</strong> riskScore, verdict (LOW/MEDIUM/HIGH),
              red-flag list, recommendations, and evidence.
            </li>
          </ol>
        </div>

        <div className="bg-white p-6 rounded-xl shadow">
          <h3 className="text-lg font-bold">Security & Production Checklist</h3>
          <ul className="mt-4 text-sm text-slate-600 list-disc pl-5 space-y-2">
            <li>
              Integrate official SEBI registry & cache results for quick lookup.
            </li>
            <li>
              Harden file uploads (scan for malware, limit sizes) and store
              securely.
            </li>
            <li>
              Use robust OCR for images (Tesseract / Google Vision) to handle
              scanned letters.
            </li>
            <li>
              Visual checks: logo template matching, metadata verification for
              PDF authenticity.
            </li>
            <li>
              Logging & audit trail for every verification (immutable logs for
              regulator review).
            </li>
            <li>
              Explainability: persist matched rules & ML scores for appeals or
              takedowns.
            </li>
          </ul>
        </div>
      </section>

      {/* OTHER DETAILS / CALL TO ACTION */}
      <section className="max-w-6xl mx-auto px-6 mt-12">
        <div className="bg-white p-6 rounded-xl shadow flex flex-col md:flex-row gap-6 items-center justify-between">
          <div>
            <h3 className="text-lg font-bold">Demo tips for judges</h3>
            <p className="text-sm text-slate-600 mt-2">
              Suggested 3-step demo: (1) Run a Tip Analyzer preset, (2) Upload a
              fake SEBI-like PDF, (3) Verify an unlisted app. Explain the risk
              score and show evidence panel.
            </p>
          </div>
          <div className="flex gap-3">
            <a
              href="/fraud-check/tips"
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 bg-orange-500 text-white rounded-md"
            >
              Run Tips Demo
            </a>
            <a
              href="/fraud-check/docs"
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 border rounded-md"
            >
              Upload Doc
            </a>
            <a
              href="/fraud-check/apps"
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 border rounded-md"
            >
              Verify App
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
