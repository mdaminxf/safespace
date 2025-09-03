// lib/db.ts
type Adviser = {
  regNo: string;
  name: string;
  status: 'Active' | 'Suspended' | 'Revoked';
};

const MOCK_ADVISERS: Adviser[] = [
  { regNo: 'INA000123456', name: 'Redwood Capital Advisers', status: 'Active' },
  { regNo: 'RA000987654', name: 'Zenith Research LLP', status: 'Active' },
  { regNo: 'INA000543210', name: 'Harbor Wealth Management', status: 'Active' },
  { regNo: 'RA000112233', name: 'BlueSky Equity Research', status: 'Active' },
  {
    regNo: 'INA000999999',
    name: 'Suspicious Advisor Ltd',
    status: 'Suspended',
  },
];

export function lookupRegNo(regNo: string) {
  return (
    MOCK_ADVISERS.find((a) => a.regNo.toUpperCase() === regNo.toUpperCase()) ||
    null
  );
}
