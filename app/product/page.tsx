// app/products/page.tsx
import Link from 'next/link';

const SAMPLE_PRODUCTS = [
  {
    id: 'p1',
    title: 'Quarterly Sector Report',
    adviser: 'Zenith Research LLP',
    price: 1999,
  },
  {
    id: 'p2',
    title: 'Custom Portfolio Review (1 hour)',
    adviser: 'Redwood Capital Advisers',
    price: 4999,
  },
];

export default function Products() {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Paid Research & Services</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {SAMPLE_PRODUCTS.map((p) => (
          <div key={p.id} className="bg-white p-4 rounded shadow">
            <h3 className="font-semibold">{p.title}</h3>
            <p className="text-sm text-slate-500">By {p.adviser}</p>
            <p className="mt-2 font-medium">₹{p.price}</p>
            <div className="mt-3">
              <Link
                href="#"
                className="px-3 py-1 bg-sky-600 text-white rounded"
              >
                Buy (escrow demo)
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
