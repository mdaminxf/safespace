'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';

type Msg = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  text: string;
  time: string;
  pending?: boolean;
};

export default function Dashboard() {
  const router = useRouter();
  const [adviser, setAdviser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<
    'profile' | 'chat' | 'posts' | 'compliance' | 'notifications'
  >('profile');

  // Analysis & chat state
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);

  const defaultSuggestions = [
    'How do I verify the SEBI registration for this adviser?',
    'What questions should I ask about fees and conflicts?',
    'Do these services match my risk profile?',
  ];

  useEffect(() => {
    const stored = localStorage.getItem('adviser');
    if (stored) {
      setAdviser(JSON.parse(stored));
    } else {
      router.push('/onboarding');
    }
  }, [router]);

  const pushMessage = (m: Msg) => setMessages((p) => [...p, m]);

  async function analyzeProfile() {
    if (!adviser?.bio) return;
    setLoadingAnalysis(true);
    setAnalysis(null);
    setMessages([]);

    try {
      const mlRes = await fetch('/api/analyze-bio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bio: adviser.bio }),
      });
      const mlJson = await mlRes.json();

      const explainRes = await fetch('/api/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bio: adviser.bio,
          hfResult: mlJson.analysis,
          askSuggestions: true,
        }),
      });
      const explainJson = await explainRes.json();

      const analysisObj = {
        hfResult: mlJson.analysis,
        explanation: explainJson.explanation ?? 'No explanation generated.',
        suggestions: explainJson.suggestions ?? defaultSuggestions,
      };

      setAnalysis(analysisObj);

      pushMessage({
        id: 'ai-' + Date.now(),
        role: 'assistant',
        text: analysisObj.explanation,
        time: new Date().toLocaleTimeString(),
      });

      pushMessage({
        id: 'sugg-' + Date.now(),
        role: 'system',
        text: 'Suggestions: ' + analysisObj.suggestions.slice(0, 3).join(' • '),
        time: new Date().toLocaleTimeString(),
      });
    } catch (err) {
      console.error(err);
      pushMessage({
        id: 'err-' + Date.now(),
        role: 'system',
        text: 'Analysis failed. Try again later.',
        time: new Date().toLocaleTimeString(),
      });
    } finally {
      setLoadingAnalysis(false);
    }
  }

  async function sendMessage(text: string) {
    if (!analysis || !text.trim()) return;

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
          bio: adviser.bio,
          hfResult: analysis.hfResult,
          question: text,
        }),
      });
      const j = await resp.json();
      const assistantText = j.explanation ?? 'No reply from AI.';
      setMessages((prev) =>
        prev.map((m) =>
          m.id === pending.id
            ? { ...m, text: assistantText, pending: false }
            : m
        )
      );
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

  if (!adviser) {
    return (
      <div className="flex items-center justify-center h-screen text-slate-500">
        Loading dashboard...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 p-8">
      {/* Header */}
      <div className="max-w-6xl mx-auto flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-slate-800">
          Adviser Dashboard – {adviser.name}
        </h1>
        <button
          onClick={() => {
            localStorage.removeItem('adviser');
            router.push('/');
          }}
          className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
        >
          Logout
        </button>
      </div>

      {/* Tabs */}
      <div className="max-w-6xl mx-auto mb-6 border-b flex gap-6 text-slate-600">
        {[
          { id: 'profile', label: 'Profile & Analysis' },
          { id: 'chat', label: 'Client Chat' },
          { id: 'posts', label: 'Posts' },
          { id: 'compliance', label: 'Compliance' },
          { id: 'notifications', label: 'Notifications' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`pb-2 border-b-2 transition ${
              activeTab === tab.id
                ? 'border-sky-600 text-sky-600 font-medium'
                : 'border-transparent hover:text-sky-600'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="max-w-6xl mx-auto">
        {activeTab === 'profile' && (
          <div className="space-y-6">
            {/* Adviser Info */}
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="text-xl font-semibold text-slate-700 mb-4">
                Your Profile
              </h2>
              <p>
                <strong>SEBI Reg No:</strong> {adviser.regNo}
              </p>
              <p className="mt-2 text-slate-600">{adviser.bio}</p>
            </div>

            {/* Run Analysis */}
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="text-xl font-semibold text-slate-700 mb-4">
                AI Fraud & Risk Analysis
              </h2>
              <button
                onClick={analyzeProfile}
                disabled={loadingAnalysis}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                {loadingAnalysis ? 'Running...' : 'Run Analysis'}
              </button>

              {/* AI Chat */}
              {analysis && (
                <div className="mt-6">
                  <h3 className="font-semibold text-slate-700 mb-2">
                    Ask the AI about this adviser
                  </h3>

                  {/* Suggestions */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {(analysis.suggestions ?? defaultSuggestions)
                      .slice(0, 5)
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

                  {/* Chat Box */}
                  <div className="border rounded-lg p-4 h-[360px] overflow-y-auto mb-4 space-y-3 bg-slate-50">
                    {messages.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center">
                        AI will respond here after analysis.
                      </p>
                    ) : (
                      messages.map((m) => (
                        <div
                          key={m.id}
                          className={`flex ${
                            m.role === 'user' ? 'justify-end' : 'justify-start'
                          }`}
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

                  {/* Input */}
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
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Client Chat</h2>
            <p className="text-slate-600">
              💬 Here advisers can chat with their clients (to be integrated).
            </p>
          </div>
        )}

        {activeTab === 'posts' && (
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Posts</h2>
            <p className="text-slate-600">
              📑 Advisers can publish and manage research posts.
            </p>
          </div>
        )}

        {activeTab === 'compliance' && (
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Compliance</h2>
            <p className="text-slate-600">
              📋 Upload SEBI docs, agreements, and audit logs here.
            </p>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Notifications</h2>
            <p className="text-slate-600">
              🔔 System alerts and platform updates appear here.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
