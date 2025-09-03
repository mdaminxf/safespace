// app/advisers/[id]/chat/page.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ADVISERS } from '../../../../data/advisers';

type ChatMsg = {
  id: string;
  from: 'user' | 'adviser' | 'system';
  text: string;
  time: string;
  meta?: any;
};

export default function AdviserChatPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const adviser = ADVISERS.find((a) => a.id === params.id);
  const storageKey = `chat_adviser_${params.id}`;
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const [messages, setMessages] = useState<ChatMsg[]>(() => {
    try {
      if (typeof window === 'undefined') return [];
      const raw = localStorage.getItem(storageKey);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [aiDrafting, setAiDrafting] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  const SUGGESTIONS = [
    'Please share your SEBI registration and proof of registration.',
    'How are your fees structured? Any conflicts of interest?',
    'What is your process for handling client money and custody?',
  ];

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(storageKey, JSON.stringify(messages));
      }
    } catch {}

    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, storageKey]);

  if (!adviser)
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="text-red-600 font-semibold">Adviser not found</div>
        <button
          onClick={() => router.push('/advisers')}
          className="mt-4 underline text-blue-600"
        >
          Back to advisers
        </button>
      </div>
    );

  const nowTime = () => new Date().toLocaleTimeString();

  function simulateAdviserReply(userText: string) {
    setTimeout(() => {
      const reply: ChatMsg = {
        id: 'a-' + Date.now(),
        from: 'adviser',
        text: `Thanks for your question: "${userText}".\n\n(Reply is simulated)`,
        time: nowTime(),
      };
      setMessages((p) => [...p, reply]);
    }, 900 + Math.random() * 900);
  }

  function send() {
    if (!input.trim()) return;
    const msg: ChatMsg = {
      id: 'u-' + Date.now(),
      from: 'user',
      text: input.trim(),
      time: nowTime(),
    };
    setMessages((p) => [...p, msg]);
    setInput('');
    setSending(true);
    simulateAdviserReply(msg.text);
    setTimeout(() => setSending(false), 1200);
  }

  function clearChat() {
    if (!confirm('Clear this chat?')) return;
    setMessages([]);
    try {
      localStorage.removeItem(storageKey);
    } catch {}
  }

  function exportChat() {
    const payload = {
      adviser: { id: adviser?.id, name: adviser?.name, regNo: adviser?.regNo },
      exportedAt: new Date().toISOString(),
      messages,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat_${adviser?.id}_${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function draftWithAI() {
    if (!input.trim()) {
      alert('Type an instruction first.');
      return;
    }
    setAiDrafting(true);
    const userPrompt = input.trim();
    try {
      const resp = await fetch('/api/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bio: adviser?.bio ?? '',
          hfResult: null,
          question: userPrompt,
        }),
      });
      const j = await resp.json();
      const draftText = j?.explanation ?? j?.answer ?? j?.text;
      if (draftText) {
        const draftMsg: ChatMsg = {
          id: 's-' + Date.now(),
          from: 'system',
          text: `AI draft:\n\n${draftText}`,
          time: nowTime(),
        };
        setMessages((p) => [...p, draftMsg]);
      } else {
        setMessages((p) => [
          ...p,
          {
            id: 's-' + Date.now(),
            from: 'system',
            text: 'AI did not return a draft.',
            time: nowTime(),
          },
        ]);
      }
    } catch (err: any) {
      console.error(err);
      setMessages((p) => [
        ...p,
        {
          id: 's-' + Date.now(),
          from: 'system',
          text: `AI request failed: ${err?.message}`,
          time: nowTime(),
        },
      ]);
    } finally {
      setAiDrafting(false);
    }
  }

  function copyMessageText(text: string) {
    if (!navigator.clipboard) return alert('Copy not supported');
    navigator.clipboard.writeText(text).then(() => {
      setMessages((p) => [
        ...p,
        {
          id: 's-' + Date.now(),
          from: 'system',
          text: 'Message copied to clipboard',
          time: nowTime(),
        },
      ]);
    });
  }

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      {/* header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4 sm:gap-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="text-sm text-blue-600 hover:underline"
          >
            ← Back
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-xl font-semibold text-slate-700">
              {adviser?.name
                .split(' ')
                .map((s) => s[0])
                .slice(0, 2)
                .join('')}
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold leading-tight">
                {adviser?.name}
              </h1>
              <div className="text-xs sm:text-sm text-gray-600">
                {adviser?.entityType ?? 'Adviser'} • RegNo:{' '}
                <span className="font-mono">{adviser?.regNo ?? '—'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="relative flex gap-2 items-center">
          <button
            onClick={() => setShowOptions((s) => !s)}
            className="px-3 py-2 text-sm border rounded hover:bg-slate-50"
          >
            Options
          </button>
          {showOptions && (
            <div className="absolute right-0 top-full mt-1 p-3 bg-white border rounded shadow-md z-20 min-w-[180px]">
              <button
                onClick={exportChat}
                className="block w-full text-left text-sm px-2 py-1 hover:bg-slate-50"
              >
                Export chat
              </button>
              <button
                onClick={clearChat}
                className="block w-full text-left text-sm px-2 py-1 hover:bg-slate-50 text-red-600"
              >
                Clear chat
              </button>
              <button
                onClick={() => alert('Connect to backend')}
                className="block w-full text-left text-sm px-2 py-1 hover:bg-slate-50"
              >
                Connect to backend
              </button>
            </div>
          )}
        </div>
      </div>

      {/* layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* left panel */}
        <aside className="lg:col-span-1 bg-white rounded shadow p-4 flex flex-col gap-4">
          <div>
            <h2 className="font-semibold mb-2">Adviser profile</h2>
            <p className="text-sm text-gray-700 whitespace-pre-line">
              {adviser?.bio ?? 'No bio provided.'}
            </p>
          </div>

          <div className="space-y-1 text-sm">
            <div>
              <strong>SEBI RegNo:</strong>{' '}
              <span className="font-mono">{adviser?.regNo ?? '—'}</span>
            </div>
            <div>
              <strong>Entity:</strong> {adviser?.entityType ?? '—'}
            </div>
           
          </div>

          <div>
            <h3 className="font-medium text-sm mb-2">Quick questions</h3>
            <div className="flex flex-col gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setInput(s);
                    setTimeout(
                      () =>
                        document
                          .querySelector<HTMLInputElement>('#chat-input')
                          ?.focus(),
                      60
                    );
                  }}
                  className="text-left px-3 py-2 text-sm border rounded hover:bg-slate-50"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="text-xs text-gray-500 mt-auto">
            Demo chat UI. Messages stored locally. For production, use secure
            backend.
          </div>
        </aside>

        {/* right panel */}
        <section className="lg:col-span-3 bg-white rounded shadow p-4 flex flex-col h-[70vh] sm:h-[80vh]">
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto mb-4 space-y-3 px-1"
          >
            {messages.length === 0 && (
              <div className="text-center text-sm text-gray-500 py-8">
                No messages yet — start the conversation.
              </div>
            )}

            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex ${
                  m.from === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`${
                    m.from === 'user'
                      ? 'bg-blue-600 text-white rounded-bl-2xl rounded-tl-2xl rounded-br-none'
                      : m.from === 'adviser'
                      ? 'bg-gray-100 text-gray-900 rounded-br-2xl rounded-tr-2xl rounded-bl-none'
                      : 'bg-yellow-50 text-zinc-900 rounded-2xl'
                  } max-w-[85%] p-3`}
                >
                  <div className="whitespace-pre-wrap text-sm">{m.text}</div>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <div className="text-[10px] opacity-60">{m.time}</div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => copyMessageText(m.text)}
                        className="text-[10px] opacity-60 hover:opacity-100"
                      >
                        Copy
                      </button>
                      {m.from !== 'system' && (
                        <button
                          onClick={() =>
                            setMessages((p) => p.filter((x) => x.id !== m.id))
                          }
                          className="text-[10px] text-red-500"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* composer */}
          <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
            <input
              id="chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder="Write your message..."
              className="flex-1 border rounded px-3 py-2 w-full"
            />
            <button
              onClick={send}
              disabled={!input.trim() || sending}
              className={`px-4 py-2 rounded font-semibold text-white ${
                sending ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {sending ? 'Sending...' : 'Send'}
            </button>
            <button
              onClick={draftWithAI}
              disabled={!input.trim() || aiDrafting}
              title="Ask AI to draft a message"
              className={`px-3 py-2 rounded border text-sm ${
                aiDrafting
                  ? 'opacity-60 cursor-not-allowed'
                  : 'hover:bg-slate-50'
              }`}
            >
              {aiDrafting ? 'Drafting…' : 'Draft with AI'}
            </button>
            <button
              onClick={exportChat}
              title="Export chat JSON"
              className="px-3 py-2 rounded border text-sm hover:bg-slate-50"
            >
              Export
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
