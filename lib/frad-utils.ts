// lib/fraud-utils.ts
export type Severity = 'HIGH' | 'MEDIUM' | 'LOW';

export type RedFlag = {
  code: string;
  description: string;
  severity: Severity;
  pattern: RegExp;
  regReference?: string;
  guidance?: string;
};

export type Violation = {
  code: string;
  description: string;
  severity: Severity;
  matches: string[];
  guidance?: string;
};

export const RED_FLAGS: RedFlag[] = [
  {
    code: 'GUARANTEED_RETURNS',
    description: 'Promises of guaranteed/assured profits or risk-free returns',
    severity: 'HIGH',
    pattern:
      /\b(guarantee(?:d)?|assured|sure[-\s]*shot|risk[-\s]*free|fixed[-\s]*return|capital[-\s]*protected|no[-\s]*loss|guaranteed\s+profits?)\b/gi,
    guidance:
      'SEBI requires risk disclosure and forbids guaranteed/assured returns. Avoid promises of guaranteed profit; disclose risks clearly.',
  },
  {
    code: 'INSIDER_TIPS',
    description: 'Claims of insider/privileged information or sure-shot tips',
    severity: 'HIGH',
    pattern:
      /\b(insider(?:\s+info|(?:\s+)?tips?)|inside(?:r)?\s+information|inside[-\s]*scoop|non[-\s]*public\s+information|privileged\s+info)\b/gi,
    guidance:
      'Trading on or promoting insider/non-public information is illegal. Do not offer or act on insider tips.',
  },
  {
    code: 'TELEGRAM_GROUP_TIPS',
    description: 'Directing users to Telegram/WhatsApp groups for tips',
    severity: 'MEDIUM',
    pattern:
      /\b(join|dm|message|get in touch)\b.*\b(telegram|whatsapp|tg)\b|\bt\.me\/|\btelegram\.me\b/gi,
    guidance:
      'Advice in unmonitored groups (Telegram/WhatsApp) is hard to verify. Use regulated, auditable channels and maintain records.',
  },
  {
    code: 'IPO_FIRM_ALLOTMENT',
    description: 'Promises of firm/guaranteed IPO allotment',
    severity: 'HIGH',
    pattern:
      /\b(firm\s+allotment|guarantee(?:d)?\s+allotment|guaranteed\s+ipo|guaranteed\s+allotment|firm\s+ipo\s+allotment)\b/gi,
    guidance:
      'Guaranteed IPO allotment promises are not permissible. Allotment depends on market mechanisms and cannot be guaranteed by advisers.',
  },
  {
    code: 'ACCOUNT_TAKEOVER_OR_TRADING_ON_BEHALF',
    description:
      'Offers to manage your account, request for OTP/login, or trading on your behalf',
    severity: 'HIGH',
    pattern:
      /\b(manage (?:your|client'?s) account|give (?:me|us) (?:otp|password|login)|send (?:your )?(otp|password)|we(?:'| )?ll trade on your behalf|power of attorney|share your OTP)\b/gi,
    guidance:
      'Never ask for OTPs, passwords, or login credentials. Advisers should not request direct access to client accounts without formal, auditable authorization.',
  },
  {
    code: 'PROFIT_SHARING_OR_BROKERAGE_REBATE',
    description: 'Profit sharing, revenue share, or brokerage rebate claims',
    severity: 'MEDIUM',
    pattern:
      /\b(profit[-\s]*sharing|revenue\s*share|brokerage\s*(rebate|refund))\b/gi,
    guidance:
      'Fee disclosures and conflicts of interest must be transparent. Be cautious of offers that hide or complicate fee structures.',
  },
  {
    code: 'FAUX_REGULATORY_APPROVAL',
    description: 'Vague/faux claims of SEBI/NSE/BSE approvals or letters',
    severity: 'LOW',
    pattern:
      /\b(sebi|nse|bse)\b.*\b(approved|authori[sz]ed|certified|letter|clearance|license|verified)\b/gi,
    guidance:
      'Do not make vague claims of regulatory approval. If you claim a registration/approval, provide verifiable RegNo and evidence.',
  },
  {
    code: 'MULTIBAGGER_TIMEBOUND',
    description: 'Aggressive multibagger claims on a short timeline',
    severity: 'MEDIUM',
    pattern:
      /\b(multibagger|100x|10x|huge\s+returns|massive\s+returns|double\s+your\s+money|triple\s+your\s+money|% gain in (?:\d{1,2} (?:days|weeks|months)))\b/gi,
    guidance:
      'Avoid sensational performance promises. All investments carry risk; historical performance does not guarantee future returns.',
  },
];

/* ---------------------------
   Scan text for red flags
--------------------------- */
export function scanBioForFlags(bio: string): Violation[] {
  const found: Violation[] = [];

  for (const rf of RED_FLAGS) {
    const rx = new RegExp(rf.pattern.source, rf.pattern.flags);
    const matches: string[] = [];
    let m: RegExpExecArray | null;
    while ((m = rx.exec(bio)) !== null) {
      if (m[0]) matches.push(m[0].trim());
      if (rx.lastIndex === m.index) rx.lastIndex++;
    }
    if (matches.length > 0) {
      found.push({
        code: rf.code,
        description: rf.description,
        severity: rf.severity,
        matches: Array.from(new Set(matches)).slice(0, 10),
        guidance: rf.guidance,
      });
    }
  }

  return found;
}

/* ---------------------------
   Flexible SEBI RegNo check (mock)
--------------------------- */
export async function checkSEBIRegistrationFlexible(
  regNoMaybe?: string | null,
  bioMaybe?: string | null
) {
  const normalize = (s: string) => s.replace(/[^A-Z0-9]/gi, '').toUpperCase();
  let token: string | null =
    typeof regNoMaybe === 'string' && regNoMaybe.trim()
      ? normalize(regNoMaybe)
      : null;
  let extractedFromBio = false;

  if (!token && bioMaybe && typeof bioMaybe === 'string') {
    const found = bioMaybe.match(/\bIN[A-Z]\d{6,10}\b/gi);
    if (found && found.length > 0) {
      token = normalize(found[0]);
      extractedFromBio = true;
    }
  }

  if (!token) {
    return {
      valid: false,
      reason: 'No SEBI RegNo provided or found in bio',
      attempted: null,
    };
  }

  const PATTERNS: RegExp[] = [
    /^IN[AH]\d{8}$/i,
    /^IN[AH]\d{7,9}$/i,
    /^IN[A-Z]\d{6,10}$/i,
  ];

  const mockDB = [
    { regNo: 'INA000123456', name: 'ABC Advisors', status: 'Active' },
    { regNo: 'RA000987654', name: 'XYZ Research', status: 'Suspended' },
    {
      regNo: 'INA000543210',
      name: 'Harbor Wealth Management',
      status: 'Active',
    },
  ];

  const normalizedToken = normalize(token);
  const exact = mockDB.find((r) => normalize(r.regNo) === normalizedToken);
  if (exact) {
    if (String(exact.status).toLowerCase() !== 'active') {
      return {
        valid: false,
        reason: `RegNo found but status: ${exact.status}`,
        details: exact,
        extractedFromBio,
      };
    }
    return {
      valid: true,
      reason: extractedFromBio
        ? 'Extracted RegNo from bio and matched registry'
        : 'SEBI verified (matched registry)',
      details: exact,
      extractedFromBio,
    };
  }

  const patternMatched = PATTERNS.some((p) => p.test(normalizedToken));
  if (!patternMatched) {
    return {
      valid: false,
      reason: `Invalid SEBI RegNo format (attempted ${normalizedToken})`,
      attempted: normalizedToken,
      extractedFromBio,
    };
  }

  return {
    valid: false,
    reason: 'RegNo format OK but not found in SEBI mock registry',
    attempted: normalizedToken,
    extractedFromBio,
  };
}

/* ---------------------------
   Compute risk & verdict
--------------------------- */
export function computeRiskFromViolations(
  violations: Violation[],
  sebiCheck: any | null
) {
  let score = 0;
  let hasHigh = false;

  for (const v of violations) {
    if (v.severity === 'HIGH') {
      score += 40;
      hasHigh = true;
    } else if (v.severity === 'MEDIUM') {
      score += 18;
    } else {
      score += 6;
    }
  }

  if (sebiCheck) {
    if (!sebiCheck.valid) score += 40;
    else score = Math.max(0, score - 8);
  }

  score = Math.min(100, Math.max(0, score));

  if (hasHigh) score = Math.max(score, 70);
  if (sebiCheck && sebiCheck.valid === false) score = Math.max(score, 75);

  let verdict: 'HIGH_RISK' | 'MEDIUM_RISK' | 'LOW_RISK' | 'UNKNOWN' = 'UNKNOWN';
  if (typeof score === 'number') {
    if (score >= 70) verdict = 'HIGH_RISK';
    else if (score >= 40) verdict = 'MEDIUM_RISK';
    else verdict = 'LOW_RISK';
  }

  return { riskScore: score, verdict };
}

/* ---------------------------
   Build user-friendly recommendations
--------------------------- */
export function buildRecommendations({
  violations,
  sebiCheck,
}: {
  violations: Violation[];
  sebiCheck: { valid?: boolean; reason?: string } | null | undefined;
}) {
  const recs: string[] = [];

  if (sebiCheck?.valid === false) {
    recs.push(
      'Avoid engaging: SEBI registration appears invalid/not found/suspended.'
    );
  } else if (!sebiCheck) {
    recs.push(
      'Verify the adviser’s SEBI registration on the official registry.'
    );
  }

  for (const v of violations) {
    if (v.guidance && !recs.includes(v.guidance)) recs.push(v.guidance);
  }

  if (recs.length === 0)
    recs.push(
      'Request written disclosures of risks, fees, and conflicts of interest.'
    );

  return recs.slice(0, 8);
}
