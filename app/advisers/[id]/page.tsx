'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ADVISERS } from '../../../data/advisers';
import ReactMarkdown from 'react-markdown';

type Msg = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  text: string;
  time: string;
  pending?: boolean;
};

type AdviserChatMsg = {
  id: string;
  from: 'user' | 'adviser';
  text: string;
  time: string;
};

export default function AdviserDetail({ params }: { params: { id: string } }) {
  const router = useRouter();
  const adviser = ADVISERS.find((a) => a.id === params.id);

  // AI/ML analysis state
  const [analysis, setAnalysis] = useState<any>(null);
  const [mlRaw, setMlRaw] = useState<any>(null);
  const [aiRaw, setAiRaw] = useState<any>(null);
  const [loadingML, setLoadingML] = useState(false);
  const [loadingAI, setLoadingAI] = useState(false);

  // AI assistant chat messages
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);

  // Adviser direct chat (persistent localStorage)
  const storageKey = `chat_adviser_${params.id}`;
  const [adviserMessages, setAdviserMessages] = useState<AdviserChatMsg[]>(
    () => {
      try {
        if (typeof window === 'undefined') return [];
        const raw = localStorage.getItem(storageKey);
        return raw ? JSON.parse(raw) : [];
      } catch {
        return [];
      }
    }
  );
  const [adviserInput, setAdviserInput] = useState('');
  const [adviserSending, setAdviserSending] = useState(false);
  const [showAdviserChat, setShowAdviserChat] = useState(false);

  const [showMlJson, setShowMlJson] = useState(false);
  const [showAiJson, setShowAiJson] = useState(false);
  const [showFullExplanation, setShowFullExplanation] = useState(false);

  useEffect(() => {
    // reset when switching advisers
    setMessages([]);
    setAnalysis(null);
    setMlRaw(null);
    setAiRaw(null);
    setInput('');
    setShowMlJson(false);
    setShowAiJson(false);
    setShowFullExplanation(false);
    setAdviserInput('');
    setAdviserSending(false);
    // reload adviserMessages from storage in case it changed externally
    try {
      if (typeof window !== 'undefined') {
        const raw = localStorage.getItem(storageKey);
        setAdviserMessages(raw ? JSON.parse(raw) : []);
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  useEffect(() => {
    // persist adviser messages
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(storageKey, JSON.stringify(adviserMessages));
      }
    } catch {}
  }, [adviserMessages, storageKey]);

  if (!adviser)
    return (
      <div className="p-6 text-red-600 font-semibold">Adviser not found</div>
    );

  const pushMessage = (m: Msg) => setMessages((p) => [...p, m]);

  const defaultSuggestions = [
    'How do I verify the SEBI registration for this adviser?',
    'What questions should I ask about fees and conflicts?',
    'Do these services match my risk profile?',
  ];

  // ===== Helper functions to create user-friendly AI output =====
  function shortSummary(text: string | undefined) {
    if (!text) return 'No short summary available.';
    const sentences = text.split(/(?<=[.?!])\s+/).filter(Boolean);
    return sentences.slice(0, 2).join(' ').trim();
  }

  function extractRecommendations(aiJson: any, explanationText?: string) {
    if (
      Array.isArray(aiJson?.recommendations) &&
      aiJson.recommendations.length
    ) {
      return aiJson.recommendations;
    }
    if (explanationText) {
      const lines = explanationText.split('\n').map((l) => l.trim());
      const bullets = lines
        .filter((l) => /^[-*•]\s+/.test(l) || /^\d+\./.test(l))
        .map((l) => l.replace(/^[-*•]\s+/, '').replace(/^\d+\.\s*/, ''));
      if (bullets.length) return bullets.slice(0, 6);
    }
    return [];
  }

  function makeAssistantMarkdown(aiJson: any) {
    const full = aiJson?.explanation ?? aiJson?.answer ?? aiJson?.text ?? '';
    const summary = shortSummary(full);
    const recs = extractRecommendations(aiJson, full);
    let md = `**Summary:** ${summary}\n\n`;
    md += `**Quick recommendations:**\n`;
    if (recs.length > 0) {
      md += recs.map((r: string) => `- ${r}`).join('\n') + '\n\n';
    } else {
      md += `- Ask for more details or run ML check to enrich analysis.\n\n`;
    }
    md += `*(Tip: click "Show full explanation" to read the full AI output.)*`;
    return { markdown: md, full };
  }

  // ===== ML helpers (unchanged) =====
  function extractMlFromResponse(resp: any) {
    if (!resp) return null;
    if (resp.analysis && resp.analysis.labels) {
      return {
        labels: resp.analysis.labels,
        scores: resp.analysis.scores,
        scoreByLabel: {
          legitimate:
            (resp.analysis.scores[resp.analysis.labels.indexOf('legitimate')] ??
              0) ||
            0,
          misleading:
            (resp.analysis.scores[resp.analysis.labels.indexOf('misleading')] ??
              0) ||
            0,
          fraudulent:
            (resp.analysis.scores[resp.analysis.labels.indexOf('fraudulent')] ??
              0) ||
            0,
        },
        topLabel:
          resp.analysis.labels[
            resp.analysis.scores.indexOf(Math.max(...resp.analysis.scores))
          ],
      };
    }
    if (resp.result && resp.result.ml && resp.result.ml.labels) {
      return {
        labels: resp.result.ml.labels,
        scores: resp.result.ml.scores,
        scoreByLabel: resp.result.ml.scoreByLabel ?? {},
        topLabel: resp.result.ml.topLabel ?? resp.result.ml.labels[0],
      };
    }
    if (resp.labels && resp.scores) {
      return {
        labels: resp.labels,
        scores: resp.scores,
        scoreByLabel: resp.scoreByLabel ?? {},
        topLabel: resp.topLabel ?? resp.labels[0],
      };
    }
    return null;
  }

  // ===== ML / AI functions (unchanged behaviour) =====
  async function runMLCheck() {
    setLoadingML(true);
    setMlRaw(null);
    setAnalysis((s: any) => ({ ...s, ml: null }));
    try {
      const res = await fetch('/api/analyze-bio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bio: adviser?.bio, regNo: adviser?.regNo }),
      });
      const j = await res.json();
      setMlRaw(j);
      const ml = extractMlFromResponse(j);
      setAnalysis((prev: any) => ({
        ...(prev ?? {}),
        ml,
        rawMl: j,
        sebi: j.result?.sebi ?? j.sebi ?? j.result?.sebi ?? null,
      }));
      pushMessage({
        id: 'sys-ml-' + Date.now(),
        role: 'system',
        text: `ML pattern check completed (${ml?.topLabel ?? 'unknown'})`,
        time: new Date().toLocaleTimeString(),
      });
    } catch (err) {
      console.error('ML check failed', err);
      pushMessage({
        id: 'err-ml-' + Date.now(),
        role: 'system',
        text: 'ML check failed. Try again later.',
        time: new Date().toLocaleTimeString(),
      });
    } finally {
      setLoadingML(false);
    }
  }

  async function runAICheck() {
    setLoadingAI(true);
    setAiRaw(null);
    try {
      const body: any = { bio: adviser?.bio, askSuggestions: true };
      if (analysis?.ml) body.hfResult = analysis.ml;

      const res = await fetch('/api/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const j = await res.json();
      setAiRaw(j);

      const friendly = makeAssistantMarkdown(j);
      setAnalysis((prev: any) => ({
        ...(prev ?? {}),
        ai: {
          explanation: j.explanation ?? j.summary ?? null,
          suggestions: j.suggestions ?? defaultSuggestions,
          recommendations: j.recommendations ?? j.recs ?? null,
          raw: j,
          fullExplanation: friendly.full,
          lastFriendlyMd: friendly.markdown,
          usedHF: j.usedHF ?? false,
        },
      }));

      pushMessage({
        id: 'ai-' + Date.now(),
        role: 'assistant',
        text: friendly.markdown,
        time: new Date().toLocaleTimeString(),
      });

      if (j.suggestions) {
        pushMessage({
          id: 'sugg-' + Date.now(),
          role: 'system',
          text:
            'Suggestions: ' +
            (j.suggestions.slice?.(0, 3).join(' • ') ??
              j.suggestions.join(' • ')),
          time: new Date().toLocaleTimeString(),
        });
      }
      setShowFullExplanation(false);
    } catch (err) {
      console.error('AI check failed', err);
      pushMessage({
        id: 'err-ai-' + Date.now(),
        role: 'system',
        text: 'AI check failed. Try again later.',
        time: new Date().toLocaleTimeString(),
      });
    } finally {
      setLoadingAI(false);
    }
  }

  async function runBoth() {
    await runMLCheck();
    await runAICheck();
  }

  // ===== AI chat sendMessage (keeps previous behavior) =====
  async function sendMessage(text: string) {
    if (!adviser || !text.trim()) return;

    const userMsg: Msg = {
      id: 'u-' + Date.now(),
      role: 'user',
      text,
      time: new Date().toLocaleTimeString(),
    };
    pushMessage(userMsg);
    setInput('');
    setSending(true);

    const pending: Msg = {
      id: 'p-' + Date.now(),
      role: 'assistant',
      text: 'Thinking...',
      time: new Date().toLocaleTimeString(),
      pending: true,
    };
    pushMessage(pending);

    try {
      const resp = await fetch('/api/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bio: adviser?.bio,
          hfResult: analysis?.ml ?? undefined,
          question: text,
        }),
      });
      const j = await resp.json();
      setAiRaw(j);

      const friendly = makeAssistantMarkdown(j);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === pending.id
            ? { ...m, text: friendly.markdown, pending: false }
            : m
        )
      );

      setAnalysis((prev: any) => ({
        ...(prev ?? {}),
        ai: {
          ...prev?.ai,
          raw: j,
          lastAnswer: friendly.full,
          lastFriendlyMd: friendly.markdown,
          usedHF: j.usedHF ?? false,
        },
      }));
      setShowFullExplanation(false);
    } catch (err) {
      console.error(err);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === pending.id
            ? { ...m, text: 'AI reply failed. Try again.', pending: false }
            : m
        )
      );
    } finally {
      setSending(false);
    }
  }

  // ===== Adviser chat functions (persistent local chat) =====
  function simulateAdviserReply(userText: string) {
    setTimeout(() => {
      const reply: AdviserChatMsg = {
        id: 'a-' + Date.now(),
        from: 'adviser',
        text: `Thanks for your question: "${userText}". (Demo reply — replace with real adviser backend.)`,
        time: new Date().toLocaleTimeString(),
      };
      setAdviserMessages((p) => [...p, reply]);
    }, 900 + Math.random() * 1000);
  }

  function sendAdviserMessage() {
    if (!adviserInput.trim()) return;
    const msg: AdviserChatMsg = {
      id: 'u-' + Date.now(),
      from: 'user',
      text: adviserInput.trim(),
      time: new Date().toLocaleTimeString(),
    };
    setAdviserMessages((p) => [...p, msg]);
    setAdviserInput('');
    setAdviserSending(true);
    simulateAdviserReply(msg.text);
    setTimeout(() => setAdviserSending(false), 1200);
  }

  const scoreToPct = (n: number) => Math.round((n ?? 0) * 100);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header + action buttons */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <button
            onClick={() => router.back()}
            className="text-sm text-blue-600 hover:underline mb-2"
          >
            ← Back
          </button>
          <h1 className="text-3xl font-bold">{adviser.name}</h1>
          <p className="text-gray-600 mt-1">
            Reg No: <span className="font-mono">{adviser.regNo}</span> • Type:{' '}
            {adviser.entityType}
          </p>
        </div>

        <div className="flex gap-2 items-center">
          {/* <button
            onClick={runMLCheck}
            disabled={loadingML || loadingAI}
            className={`px-4 py-2 rounded font-semibold text-white transition ${
              loadingML
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
            title="Run only ML pattern classifier"
          >
            {loadingML ? 'Profile check…' : 'Run ML Check'}
          </button>

          <button
            onClick={runAICheck}
            disabled={loadingAI || loadingML}
            className={`px-4 py-2 rounded font-semibold text-white transition ${
              loadingAI
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700'
            }`}
            title="Run only AI reasoning"
          >
            {loadingAI ? 'Running AI…' : 'Run AI Check'}
          </button> */}

          <button
            onClick={() => router.push(`/advisers/${adviser.id}/chat`)}
            className="px-4 py-2 bg-gray-100 text-zinc-800 border border-gray-300 rounded hover:bg-gray-200 font-semibold"
            title="Open full adviser chat page"
          >
            Open full chat
          </button>

          <button
            onClick={runBoth}
            disabled={loadingML || loadingAI}
            className={`px-4 py-2 rounded font-semibold text-white transition ${
              loadingML || loadingAI
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
            title="Run ML then AI"
          >
            {loadingML || loadingAI ? 'Analyzing…' : 'Analyze Profile'}
          </button>
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Profile + AI assistant panel */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold">Profile</h2>
            <p className="text-gray-700 mt-2">{adviser.bio}</p>
          </div>

          {/* AI Chat & messages */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">AI Explanation</h3>
              <div className="flex items-center gap-2">
                {analysis?.ai?.usedHF && (
                  <div className="text-xs px-2 py-1 bg-indigo-50 text-indigo-700 rounded-full">
                    ML used
                  </div>
                )}
                <button
                  onClick={() => setShowFullExplanation((s) => !s)}
                  className="text-xs underline text-gray-600"
                >
                  {showFullExplanation
                    ? 'Hide full explanation'
                    : 'Show full explanation'}
                </button>
              </div>
            </div>

            <div className="prose max-w-full mb-3">
              <ReactMarkdown>
                {analysis?.ai?.lastFriendlyMd ??
                  analysis?.ai?.explanation ??
                  aiRaw?.explanation ??
                  'Run the AI check to get an explanation here.'}
              </ReactMarkdown>
            </div>

            {showFullExplanation && (
              <div className="mb-3 p-3 bg-slate-50 rounded text-sm text-gray-700 border">
                <div className="font-semibold mb-2">Full AI explanation</div>
                <div className="whitespace-pre-wrap text-sm">
                  {analysis?.ai?.fullExplanation ??
                    aiRaw?.explanation ??
                    'Full explanation not available.'}
                </div>
              </div>
            )}

            {analysis?.ai?.recommendations && (
              <div className="mb-3">
                <h4 className="font-semibold">Recommendations</h4>
                <ul className="list-disc ml-5 mt-1 text-sm text-gray-700">
                  {(analysis.ai.recommendations ?? analysis.ai.recs ?? []).map(
                    (r: string, i: number) => (
                      <li key={i}>{r}</li>
                    )
                  )}
                </ul>
              </div>
            )}

            <div className="flex flex-wrap gap-2 mb-3">
              {(analysis?.ai?.suggestions ?? defaultSuggestions)
                .slice(0, 6)
                .map((s: string, i: number) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(s)}
                    className="text-sm px-3 py-1 rounded-full border bg-slate-50 hover:bg-slate-100"
                  >
                    {s}
                  </button>
                ))}
            </div>

            {/* AI chat history */}
            <div className="border rounded-lg p-4 h-[260px] overflow-y-auto mb-3 bg-slate-50">
              {messages.length === 0 ? (
                <p className="text-sm text-gray-500 text-center">
                  AI will respond here after you ask a question.
                </p>
              ) : (
                messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex ${
                      m.role === 'user' ? 'justify-end' : 'justify-start'
                    } mb-2`}
                  >
                    <div
                      className={`max-w-[75%] px-4 py-2 rounded-2xl shadow-sm ${
                        m.role === 'user'
                          ? 'bg-blue-600 text-white rounded-br-none'
                          : 'bg-white text-gray-900 rounded-bl-none'
                      }`}
                    >
                      <div className="text-sm leading-relaxed">
                        <ReactMarkdown>{m.text}</ReactMarkdown>
                      </div>
                      <div className="text-[10px] mt-1 opacity-60 text-right">
                        {m.time}
                        {m.pending ? ' • …' : ''}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage(input);
                  }
                }}
                placeholder="Ask the AI about this adviser..."
                disabled={sending}
                className="flex-1 border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={sending || !input.trim()}
                className={`px-5 py-2 rounded-lg font-semibold text-white transition ${
                  sending
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {sending ? 'Sending…' : 'Send'}
              </button>
            </div>

            <div className="mt-3 text-sm">
              <button
                onClick={() => setShowAiJson((s) => !s)}
                className="underline text-gray-600"
              >
                {showAiJson ? 'Hide AI JSON' : 'Show AI JSON'}
              </button>
              {showAiJson && (
                <pre className="mt-2 max-h-48 overflow-auto bg-black text-white text-xs p-3 rounded">
                  {JSON.stringify(aiRaw ?? analysis?.ai?.raw ?? {}, null, 2)}
                </pre>
              )}
            </div>
          </div>

          {/* Inline Adviser Chat (collapsible) */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">Chat with Adviser</h3>
              <div className="flex items-center gap-3">
                <div className="text-xs text-gray-500">Stored locally</div>
                <button
                  onClick={() => setShowAdviserChat((s) => !s)}
                  className="text-sm underline text-gray-600"
                >
                  {showAdviserChat ? 'Hide' : 'Open'}
                </button>
              </div>
            </div>

            {showAdviserChat ? (
              <>
                <div className="h-48 overflow-y-auto mb-3 space-y-3">
                  {adviserMessages.length === 0 ? (
                    <div className="text-gray-500 text-sm text-center">
                      No messages yet. Start the conversation!
                    </div>
                  ) : (
                    adviserMessages.map((m) => (
                      <div
                        key={m.id}
                        className={`flex ${
                          m.from === 'user' ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div
                          className={`max-w-[80%] p-3 rounded ${
                            m.from === 'user'
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          <div className="text-sm whitespace-pre-line">
                            {m.text}
                          </div>
                          <div className="text-[10px] mt-2 opacity-60 text-right">
                            {m.time}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="flex gap-2">
                  <input
                    value={adviserInput}
                    onChange={(e) => setAdviserInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendAdviserMessage();
                      }
                    }}
                    className="flex-1 border rounded px-3 py-2"
                    placeholder="Message the adviser..."
                  />
                  <button
                    onClick={sendAdviserMessage}
                    disabled={!adviserInput.trim() || adviserSending}
                    className={`px-4 py-2 rounded font-semibold text-white ${
                      adviserSending
                        ? 'bg-gray-400'
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    {adviserSending ? 'Sending...' : 'Send'}
                  </button>
                </div>

                <div className="mt-3 text-xs text-gray-500">
                  This demo stores chat locally. Use the "Open full chat" button
                  to go to the dedicated chat page.
                </div>
              </>
            ) : (
              <div className="text-sm text-gray-600">
                Click{' '}
                <button
                  onClick={() => setShowAdviserChat(true)}
                  className="underline"
                >
                  Open
                </button>{' '}
                to chat inline, or use the full chat page.
              </div>
            )}
          </div>
        </div>

        {/* Right: ML results + SEBI flags */}
        <div className="space-y-4">
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-semibold">Regulatory Checks & Flags</h3>

            {!analysis?.sebi && !mlRaw?.result?.sebi && !mlRaw?.sebi ? (
              <p className="mt-3 text-sm text-gray-500">
                No SEBI checks found. Your /api/analyze-bio should return `sebi`
                if available.
              </p>
            ) : (
              <div className="mt-3 space-y-3 text-sm text-gray-700">
                <div>
                  <div className="font-semibold">SEBI Registration</div>
                  <div className="mt-1">
                    {analysis?.sebi?.registration?.valid === true ||
                    mlRaw?.result?.sebi?.registration?.valid === true ? (
                      <div className="text-sm text-green-700">
                        Verified: Active
                      </div>
                    ) : analysis?.sebi?.registration?.valid === false ||
                      mlRaw?.result?.sebi?.registration?.valid === false ? (
                      <div className="text-sm text-red-700">
                        Invalid / Not found —{' '}
                        {analysis?.sebi?.registration?.reason ??
                          mlRaw?.result?.sebi?.registration?.reason ??
                          ''}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-600">
                        Not provided / unknown
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <div className="font-semibold">Red Flags (textual)</div>
                  <div className="mt-2 space-y-2">
                    {(
                      analysis?.sebi?.redFlags ??
                      mlRaw?.result?.sebi?.redFlags ??
                      mlRaw?.sebi?.redFlags ??
                      []
                    ).length === 0 ? (
                      <div className="text-sm text-gray-600">
                        No textual red flags detected.
                      </div>
                    ) : (
                      (
                        analysis?.sebi?.redFlags ??
                        mlRaw?.result?.sebi?.redFlags ??
                        mlRaw?.sebi?.redFlags ??
                        []
                      ).map((f: any, i: number) => (
                        <div key={i} className="border rounded p-2">
                          <div className="flex justify-between items-center">
                            <div className="font-semibold text-sm">
                              {f.description}
                            </div>
                            <div
                              className={`px-2 py-0.5 rounded text-xs ${
                                f.severity === 'HIGH'
                                  ? 'bg-red-100 text-red-700'
                                  : f.severity === 'MEDIUM'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-green-100 text-green-700'
                              }`}
                            >
                              {f.severity}
                            </div>
                          </div>
                          {f.matches?.length > 0 && (
                            <div className="mt-2 text-xs text-gray-700">
                              <div className="font-semibold">Matches:</div>
                              <div className="mt-1 space-y-1">
                                {f.matches
                                  .slice(0, 5)
                                  .map((m: string, k: number) => (
                                    <div
                                      key={k}
                                      className="text-[13px] bg-slate-50 px-2 py-1 rounded"
                                    >
                                      {m}
                                    </div>
                                  ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {(
                  analysis?.sebi?.recommendations ??
                  mlRaw?.result?.recommendations ??
                  mlRaw?.recommendations ??
                  []
                ).length > 0 && (
                  <div>
                    <div className="font-semibold">Recommendations</div>
                    <ul className="list-disc ml-5 mt-1">
                      {(
                        analysis?.sebi?.recommendations ??
                        mlRaw?.result?.recommendations ??
                        mlRaw?.recommendations ??
                        []
                      ).map((r: string, idx: number) => (
                        <li key={idx} className="text-sm text-gray-700">
                          {r}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {(analysis?.sebi || mlRaw?.result?.sebi || mlRaw?.sebi) && (
              <div className="mt-3 text-sm">
                <button
                  onClick={() =>
                    window.alert(
                      JSON.stringify(
                        analysis?.sebi ??
                          mlRaw?.result?.sebi ??
                          mlRaw?.sebi ??
                          {},
                        null,
                        2
                      )
                    )
                  }
                  className="underline text-gray-600"
                >
                  View raw SEBI JSON
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
