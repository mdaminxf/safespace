'use client';
import Link from 'next/link';

export default function MarketplacePage() {
  return (
    <main className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      <section className="bg-sky-600 text-white py-20">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-bold">
            SEBI-Verified Adviser Marketplace
          </h1>
          <p className="mt-4 md:mt-6 text-lg md:text-xl max-w-3xl mx-auto">
            Connect with SEBI-registered advisers, access verified research, and
            make investment decisions with confidence. This is a demo MVP —
            integrate official SEBI APIs for production.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/advisers"
              className="px-6 py-3 bg-white text-sky-600 font-semibold rounded-lg shadow hover:bg-slate-100 transition"
            >
              Browse Advisers
            </Link>
            <Link
              href="/onboarding"
              className="px-6 py-3 border border-white font-semibold rounded-lg hover:bg-white hover:text-sky-600 transition"
            >
              Onboard as Adviser
            </Link>
          </div>
        </div>
      </section>

      {/* Marketplace Details */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-slate-800 text-center">
          How the Marketplace Works
        </h2>
        <div className="mt-10 grid md:grid-cols-3 gap-8">
          <div className="bg-white rounded-lg shadow hover:shadow-md transition p-6">
            <h3 className="text-xl font-semibold text-slate-800">
              Browse Advisers
            </h3>
            <p className="mt-3 text-slate-600 text-sm">
              View detailed profiles of SEBI-registered advisers, including
              expertise, research reports, and client reviews. Compare and
              select trusted advisers to make informed investment decisions.
            </p>
            <Link
              href="/advisers"
              className="mt-4 inline-block text-sky-600 font-semibold hover:underline"
            >
              Browse Now →
            </Link>
          </div>
          <div className="bg-white rounded-lg shadow hover:shadow-md transition p-6">
            <h3 className="text-xl font-semibold text-slate-800">
              Onboard as Adviser
            </h3>
            <p className="mt-3 text-slate-600 text-sm">
              Join our marketplace as a verified SEBI adviser. Submit your
              registration number, upload credentials, and start offering
              advisory services securely to clients.
            </p>
            <Link
              href="/onboarding"
              className="mt-4 inline-block text-sky-600 font-semibold hover:underline"
            >
              Start Onboarding →
            </Link>
          </div>
          <div className="bg-white rounded-lg shadow hover:shadow-md transition p-6">
            <h3 className="text-xl font-semibold text-slate-800">
              Secure & Compliant
            </h3>
            <p className="mt-3 text-slate-600 text-sm">
              All advisers are verified against SEBI mock registry (replace with
              real API in production). Agreements, audit logs, and client
              interactions are stored securely. Transparency and compliance are
              at the core.
            </p>
            <Link
              href="/fraud-check/docs"
              className="mt-4 inline-block text-sky-600 font-semibold hover:underline"
            >
              Check Compliance →
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials / Stats (Optional hackathon boost) */}
      <section className="bg-slate-100 py-16">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-slate-800">
            Why Use This Marketplace?
          </h2>
          <div className="mt-10 grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h4 className="font-semibold text-sky-600 text-lg">Trust</h4>
              <p className="mt-2 text-slate-600 text-sm">
                All advisers verified against SEBI records (demo). No fake
                advisors.
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h4 className="font-semibold text-sky-600 text-lg">
                Transparency
              </h4>
              <p className="mt-2 text-slate-600 text-sm">
                Clear client reviews, research reports, and advisory history for
                informed decisions.
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h4 className="font-semibold text-sky-600 text-lg">Compliance</h4>
              <p className="mt-2 text-slate-600 text-sm">
                Agreements & audit logs stored securely; integrate real SEBI API
                in production.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
