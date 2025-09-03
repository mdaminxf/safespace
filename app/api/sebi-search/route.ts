import { NextResponse } from 'next/server';

// Mock SEBI DB search
const SEBI_DB = [
  {
    id: 'sebi-1',
    name: 'Global Investments LLP',
    regNo: 'INA000123456',
    entityType: 'LLP',
    bio: 'Registered SEBI adviser providing wealth advisory services.',
  },
  {
    id: 'sebi-2',
    name: 'Safe Wealth Advisors',
    regNo: 'INA000654321',
    entityType: 'Individual',
    bio: 'Specializes in retail investors and safe, compliant advice.',
  },
];

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q')?.toLowerCase() || '';

  const matches = SEBI_DB.filter(
    (a) =>
      a.name.toLowerCase().includes(q) ||
      a.regNo.toLowerCase().includes(q) ||
      a.entityType.toLowerCase().includes(q)
  );

  return NextResponse.json({ advisers: matches });
}
