'use client';
import { posts } from '../../data/posts';
import Navbar from '../../components/Navbar';

export default function Community() {
  return (
    <div>
      <Navbar />
      <div className="p-8 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Community Feed</h1>
        <div className="space-y-4">
          {posts.map((p) => (
            <div
              key={p.id}
              className="border rounded-lg shadow p-4 bg-white hover:shadow-lg transition"
            >
              <h2 className="font-bold">{p.user}</h2>
              <p className="mt-2">{p.text}</p>
              {p.suspicious && (
                <p className="mt-2 text-red-600 font-semibold">
                  ⚠️ Flagged as suspicious
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
