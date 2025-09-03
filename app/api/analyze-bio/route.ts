// app/api/analyze-bio/route.ts
import { NextResponse } from 'next/server';

/**
 * Full updated analyze-bio route (rules-first + optional HF)
 *
 * - Flexible SEBI RegNo extraction & lookup (mock DB)
 * - Textual red-flag detection (SEBI-aligned)
 * - Optional HuggingFace zero-shot classification (if HF token present)
 * - Human-readable summary + recommendations
 *
 * IMPORTANT:
 * - Replace mockDB with a real, periodically-synced SEBI registry for production.
 * - Map each rule to an official SEBI clause in production for auditability.
 */

/* ---------------------------
   Types
   --------------------------- */
type Severity = 'HIGH' | 'MEDIUM' | 'LOW';

type RedFlag = {
  code: string;
  description: string;
  severity: Severity;
  pattern: RegExp;
  regReference?: string;
  guidance?: string;
};

type Violation = {
  code: string;
  description: string;
  severity: Severity;
  matches: string[];
  guidance?: string;
};

type HFResult =
  | {
      labels: string[];
      scores: number[];
      topLabel: string;
      topScore: number;
      scoreByLabel: Record<string, number>;
    }
  | { error: string };

/* ---------------------------
   Rules / Red flags
   --------------------------- */

const RED_FLAGS: RedFlag[] = [
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
   Helpers: flag scanning, HF parsing, HF classify (optional)
   --------------------------- */

function scanBioForFlags(bio: string): Violation[] {
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

function parseHFResult(hfJson: any): HFResult {
  try {
    const payload = Array.isArray(hfJson) ? hfJson[0] : hfJson;
    const labels: string[] = Array.isArray(payload?.labels)
      ? payload.labels
      : [];
    const scores: number[] = Array.isArray(payload?.scores)
      ? payload.scores
      : [];

    const map: Record<string, number> = {};
    labels.forEach((l, i) => (map[l] = Number(scores[i] ?? 0)));

    // top index safe
    let topIdx = 0;
    if (scores.length > 0) {
      let best = 0;
      for (let i = 1; i < scores.length; i++) {
        if ((scores[i] ?? 0) > (scores[best] ?? 0)) best = i;
      }
      topIdx = best;
    }

    return {
      labels,
      scores,
      topLabel: labels[topIdx] ?? 'unknown',
      topScore: Number(scores[topIdx] ?? 0),
      scoreByLabel: {
        legitimate: Number(map['legitimate'] ?? 0),
        misleading: Number(map['misleading'] ?? 0),
        fraudulent: Number(map['fraudulent'] ?? 0),
      },
    };
  } catch (err: any) {
    return { error: String(err?.message ?? err) };
  }
}

async function hfClassify(bio: string): Promise<HFResult> {
  // Optional: skip if disabled or token missing
  if (!process.env.HF_TOKEN) {
    return { error: 'HuggingFace disabled or HF_TOKEN missing' };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 18_000);

  try {
    const resp = await fetch(
      'https://api-inference.huggingface.co/models/facebook/bart-large-mnli',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.HF_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: bio,
          parameters: {
            candidate_labels: ['legitimate', 'fraudulent', 'misleading'],
          },
        }),
        signal: controller.signal,
      }
    );

    if (!resp.ok) {
      const txt = await resp.text().catch(() => '');
      return { error: `HF API error ${resp.status}: ${txt}` };
    }

    const json = await resp.json().catch(async () => {
      const t = await resp.text();
      return { raw: t };
    });

    return parseHFResult(json);
  } catch (e: any) {
    return { error: String(e?.message ?? e) };
  } finally {
    clearTimeout(timeout);
  }
}

/* ---------------------------
   Flexible SEBI RegNo handling
   --------------------------- */

async function checkSEBIRegistrationFlexible(
  regNoMaybe?: string | null,
  bioMaybe?: string | null
) {
  // Normalize helper
  const normalize = (s: string) => s.replace(/[^A-Z0-9]/gi, '').toUpperCase();

  // Try provided regNo first
  let token: string | null =
    typeof regNoMaybe === 'string' && regNoMaybe.trim()
      ? normalize(regNoMaybe)
      : null;
  let extractedFromBio = false;

  // If not provided, try extract from bio (pattern IN + letter + 6..10 digits)
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

  // Flexible acceptable patterns
  const PATTERNS: RegExp[] = [
    /^IN[AH]\d{8}$/i,
    /^IN[AH]\d{7,9}$/i,
    /^IN[A-Z]\d{6,10}$/i,
  ];

  // Mock DB (replace in prod)
  const mockDB = [
    { regNo: 'INA000123456', name: 'ABC Advisors', status: 'Active' },
    { regNo: 'RA000987654', name: 'XYZ Research', status: 'Suspended' },
    {
      regNo: 'INA000543210',
      name: 'Harbor Wealth Management',
      status: 'Active',
    },
    // add more prototypes as needed
  ];

  const normalizedToken = normalize(token);

  // Exact normalized DB match
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

  // If token doesn't match any acceptable pattern, try suffix-based fallback
  const patternMatched = PATTERNS.some((p) => p.test(normalizedToken));
  if (!patternMatched) {
    const numericSuffixMatch = normalizedToken.match(/(\d{5,10})$/);
    if (numericSuffixMatch) {
      const suffix = numericSuffixMatch[1];
      const suffixFound = mockDB.find((r) =>
        normalize(r.regNo).endsWith(suffix)
      );
      if (suffixFound) {
        if (String(suffixFound.status).toLowerCase() !== 'active') {
          return {
            valid: false,
            reason: `Format odd but registry suffix matched; status: ${suffixFound.status}`,
            details: suffixFound,
            extractedFromBio,
          };
        }
        return {
          valid: true,
          reason: 'Format non-standard but registry suffix matched',
          details: suffixFound,
          extractedFromBio,
        };
      }
    }

    return {
      valid: false,
      reason: `Invalid SEBI RegNo format (attempted ${normalizedToken})`,
      attempted: normalizedToken,
      extractedFromBio,
    };
  }

  // Pattern looked fine but no DB match — try numeric suffix final fallback
  const numeric = normalizedToken.match(/(\d{5,10})$/)?.[1];
  if (numeric) {
    const fallback = mockDB.find((r) => normalize(r.regNo).endsWith(numeric));
    if (fallback) {
      if (String(fallback.status).toLowerCase() !== 'active') {
        return {
          valid: false,
          reason: `Registry matched by suffix; status: ${fallback.status}`,
          details: fallback,
          extractedFromBio,
        };
      }
      return {
        valid: true,
        reason: 'Registry matched by numeric suffix (format normalized)',
        details: fallback,
        extractedFromBio,
      };
    }
  }

  // No match found in registry
  return {
    valid: false,
    reason: 'RegNo format OK but not found in SEBI mock registry',
    attempted: normalizedToken,
    extractedFromBio,
  };
}

/* ---------------------------
   Combine rules -> risk score -> verdict
   --------------------------- */

function computeRiskFromViolations(
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
    if (!sebiCheck.valid) {
      score += 40;
    } else {
      score = Math.max(0, score - 8);
    }
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
   Recommendations builder
   --------------------------- */

function buildRecommendations({
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

/* ---------------------------
   Route Handler
   --------------------------- */

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as any;
    const bioRaw = body?.bio;
    const regNo = body?.regNo ?? body?.regno ?? null;

    if (!bioRaw || typeof bioRaw !== 'string') {
      return NextResponse.json({ error: 'Bio is required' }, { status: 400 });
    }

    const bio = bioRaw.trim().slice(0, 8000);

    // 1) SEBI reg check (flexible) + red-flag detection
    const [sebiCheck, violations] = await Promise.all([
      checkSEBIRegistrationFlexible(regNo, bio),
      Promise.resolve(scanBioForFlags(bio)),
    ]);

    // If no contact info AND no valid reg => add UNVERIFIABLE_IDENTITY violation
    const contactInfoPresent =
      /\b(email|@|phone|tel:|\+91|contact\b|call\b|website\b|www\.|http)/i.test(
        bio
      );
    if ((!sebiCheck || !sebiCheck.valid) && !contactInfoPresent) {
      violations.push({
        code: 'UNVERIFIABLE_IDENTITY',
        description:
          'No verifiable registration or contact information present',
        severity: 'MEDIUM',
        matches: [],
        guidance:
          'Provide verifiable registration (RegNo) and official contact details (email, phone, website) to establish credibility.',
      });
    }

    // 2) Optional HF classification
    let mlResult: HFResult | null = null;
    try {
      mlResult = await hfClassify(bio);
    } catch (e: any) {
      mlResult = { error: String(e?.message ?? e) };
    }

    // 3) Compute risk verdict (rules-first but includes ml-derived heuristic if HF available)
    // We'll feed computeRiskFromViolations only rules + sebi; but you can incorporate ML later if desired.
    const { riskScore, verdict } = computeRiskFromViolations(
      violations,
      sebiCheck
    );

    // 4) Build summary & recommendations
    const summaryParts: string[] = [];
    if (violations.length > 0) {
      const top = violations
        .slice()
        .sort(
          (a, b) =>
            (a.severity === 'HIGH' ? -1 : 1) - (b.severity === 'HIGH' ? -1 : 1)
        )
        .slice(0, 5)
        .map((v) => `${v.description} (${v.severity})`);
      summaryParts.push(`Detected issues: ${top.join('; ')}.`);
    } else {
      summaryParts.push('No textual red flags detected.');
    }

    if (sebiCheck) {
      summaryParts.push(
        `SEBI registration: ${sebiCheck.valid ? 'VALID' : 'INVALID'} (${
          sebiCheck.reason
        }).`
      );
    } else {
      summaryParts.push('SEBI registration: Not provided.');
    }

    if (mlResult && 'error' in mlResult && mlResult.error) {
      summaryParts.push(`ML classification: unavailable (${mlResult.error}).`);
    } else if (mlResult && 'topLabel' in mlResult) {
      const ml = mlResult as Exclude<HFResult, { error: string }>;
      summaryParts.push(
        `ML pattern check: ${ml.topLabel} (legit=${(
          ml.scoreByLabel?.legitimate ?? 0
        ).toFixed(2)}, mis=${(ml.scoreByLabel?.misleading ?? 0).toFixed(
          2
        )}, fraud=${(ml.scoreByLabel?.fraudulent ?? 0).toFixed(2)}).`
      );
    }

    const recommendations = buildRecommendations({ violations, sebiCheck });

    // 5) Response payload
    const payload = {
      input: { bio, regNo: regNo ?? null },
      result: {
        verdict,
        riskScore,
        ml: mlResult,
        sebi: {
          registration: sebiCheck,
          redFlags: violations,
        },
        summary: summaryParts.join(' '),
        recommendations,
        disclaimer:
          'This tool performs automated text-based compliance checks. It is not legal advice. For formal compliance, consult SEBI or authorized legal counsel.',
      },
    };

    return NextResponse.json(payload, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    console.error('analyze-bio error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
