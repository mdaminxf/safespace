// lib/types.ts
export type RegCheck = { valid: boolean; reason: string; details?: any };
export type Violation = {
  code: string;
  description: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  matches: string[];
  guidance?: string;
};
export type AnalyzeResult = {
  verdict: 'HIGH_RISK' | 'MEDIUM_RISK' | 'LOW_RISK' | 'UNKNOWN';
  riskScore: number;
  violations: Violation[];
  sebi: { registration?: RegCheck };
  ml?: any;
  mediaCheck?: { deepfakeProbability?: number; notes?: string };
  docCheck?: { suspicious?: boolean; findings?: string[] };
  appCheck?: { trusted?: boolean; reason?: string };
};
