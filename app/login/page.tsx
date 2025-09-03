'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../../components/Navbar';

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState('client');
  const [username, setUsername] = useState('');

  const handleLogin = () => {
    if (!username) {
      alert('Please enter a username');
      return;
    }
    if (role === 'client') {
      router.push('/dashboard/client');
    } else if (role === 'trader') {
      router.push('/dashboard/trader');
    } else {
      router.push('/dashboard/analyst');
    }
  };

  return (
    <div>
      <Navbar />
      <div className="flex justify-center items-center h-[80vh]">
        <div className="border rounded p-8 shadow-lg w-96 text-black">
          <h1 className="text-2xl font-bold mb-6 text-center">Login</h1>

          <label className="block mb-2">Username</label>
          <input
            type="text"
            placeholder="Enter your name"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="border p-2 rounded w-full mb-4"
          />

          <label className="block mb-2">Select Role</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="border p-2 rounded w-full mb-6"
          >
            <option value="client">Client</option>
            <option value="trader">Trader</option>
            <option value="analyst">Analyst</option>
          </select>

          <button
            onClick={handleLogin}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          >
            Login
          </button>
        </div>
      </div>
    </div>
  );
}
