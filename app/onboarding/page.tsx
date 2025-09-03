'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Onboard() {
  const [name, setName] = useState('');
  const [regNo, setRegNo] = useState('');
  const [bio, setBio] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verified, setVerified] = useState<boolean | null>(null);

  const router = useRouter();

  async function verifyRegNo(value: string) {
    if (!value) return;
    setIsVerifying(true);
    setVerified(null);

    try {
      const resp = await fetch(
        `/api/sebi-search?q=${encodeURIComponent(value)}`
      );
      if (resp.ok) {
        const { advisers } = await resp.json();
        const match = advisers.find((a: any) => a.regNo === value);
        setVerified(!!match);
      } else {
        setVerified(false);
      }
    } catch (err) {
      console.error('Verification failed:', err);
      setVerified(false);
    } finally {
      setIsVerifying(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('submitting');

    if (verified === false) {
      setStatus('error: SEBI RegNo not found in registry');
      return;
    }

    const adviserData = { name, regNo, bio };

    const res = await fetch('/api/advisers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(adviserData),
    });

    const json = await res.json();
    if (res.ok) {
      setStatus('submitted ✅');
      // save adviser locally for demo session
      localStorage.setItem('adviser', JSON.stringify(adviserData));
      setTimeout(() => router.push('/dashboard'), 1200);
    } else {
      setStatus('error: ' + (json?.message ?? res.statusText));
    }
  }

  return (
    <div className="flex justify-center mt-10 px-4">
      <div className="bg-white p-6 rounded-xl shadow w-100">
        {/* Header */}
        <div className="flex items-center">
          <button
            onClick={() => router.back()}
            className="text-sm text-blue-600 hover:underline mr-6"
          >
            ← Back
          </button>
          <h2 className="text-2xl font-semibold">Adviser Onboarding</h2>
        </div>
        <p className="text-sm text-slate-500 mt-1">
          Provide your SEBI registration number and details. This demo validates
          RegNo against the SEBI registry (mock API).
        </p>

        {/* Form */}
        <form onSubmit={submit} className="mt-6 space-y-4">
          {/* Name */}
          <div>
            <label className="text-sm font-medium block mb-1">Full Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-sky-500"
              required
            />
          </div>

          {/* SEBI Registration Number */}
          <div>
            <label className="text-sm font-medium block mb-1">
              SEBI Registration Number
            </label>
            <div className="flex gap-2">
              <input
                value={regNo}
                onChange={(e) => setRegNo(e.target.value)}
                onBlur={(e) => verifyRegNo(e.target.value)}
                placeholder="e.g., INA000123456"
                className="flex-1 border px-3 py-2 rounded-lg focus:ring-2 focus:ring-sky-500"
                required
              />
              {isVerifying && (
                <span className="text-xs text-slate-500 mt-2">
                  Verifying...
                </span>
              )}
              {verified === true && (
                <span className="text-xs text-green-600 mt-2">✔ Verified</span>
              )}
              {verified === false && (
                <span className="text-xs text-red-600 mt-2">✘ Not Found</span>
              )}
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className="text-sm font-medium block mb-1">Short Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Describe your advisory services..."
              className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-sky-500"
              rows={4}
            />
          </div>

          {/* Submit */}
          <div className="flex gap-4 items-center">
            <button
              type="submit"
              className="px-5 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition"
            >
              Submit
            </button>
            {status && <div className="text-sm text-slate-600">{status}</div>}
          </div>
        </form>
      </div>
    </div>
  );
}
