// lib/sebi.ts
export type SebiRecord = {
  regNo: string;
  name: string;
  entityType: 'Investment Adviser' | 'Research Analyst' | 'Broker' | 'Other';
  validTill?: string; // ISO date
};

// Simple in-memory mock database for demo / replace with real SEBI API integration.
// To integrate with real SEBI data, replace `lookupRegNo` with an actual fetch
// to an authenticated SEBI feed or your cached copy of SEBI registers.
const MOCK_DB: Record<string, SebiRecord> = {
  'IA-001': {
    regNo: 'IA-001',
    name: 'Redwood Capital Advisers',
    entityType: 'Investment Adviser',
    validTill: '2026-12-31',
  },
  'RA-100': {
    regNo: 'RA-100',
    name: 'Zenith Research LLP',
    entityType: 'Research Analyst',
    validTill: '2025-06-30',
  },
};

export async function lookupRegNo(regNo: string): Promise<SebiRecord | null> {
  // Simulate latency
  await new Promise((r) => setTimeout(r, 300));
  const r = MOCK_DB[regNo.toUpperCase()];
  return r ?? null;
}
