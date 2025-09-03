'use client';
import { useState } from 'react';
import { ADVISERS } from '../../data/advisers';
import Navbar from '../../components/Navbar';

export default function Verify() {
  const [input, setInput] = useState('');
  const [result, setResult] = useState<string | null>(null);

  const handleCheck = () => {
    const found = ADVISERS.find((a) => a.regNo === input);
    if (found && found.verified) {
      setResult(`✅ ${found.name} is SEBI Verified`);
    } else {
      setResult('❌ Not Found in SEBI database (dummy check)');
    }
  };

  return (
    <div>
      <Navbar />
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Verify Advisor</h1>
        <input
          type="text"
          placeholder="Enter SEBI Reg. No"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="border p-2 rounded w-64"
        />
        <button
          onClick={handleCheck}
          className="ml-2 px-4 py-2 bg-green-600 text-white rounded"
        >
          Check
        </button>
        {result && <p className="mt-4 text-lg">{result}</p>}
      </div>
    </div>
  );
}
