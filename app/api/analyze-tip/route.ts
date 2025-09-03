// app/api/analyze-tip/route.ts
import { NextResponse } from 'next/server';

/* ---------------------------
   Types
--------------------------- */
type Severity = 'HIGH' | 'MEDIUM' | 'LOW';

type RedFlag = {
  code: string;
  description: string;
  severity: Severity;
  pattern: RegExp;
  guidance?: string;
};

type Violation = {
  code: string;
  description: string;
  severity: Severity;
  matches: string[];
  guidance?: string;
};

/* ---------------------------
   SEBI-Aligned Red Flags
--------------------------- */
const RED_FLAGS: RedFlag[] = [
  {
    code: 'GUARANTEED_RETURNS',
    description: 'Promises of guaranteed or risk-free profits',
    severity: 'HIGH',
    pattern: /\b(guarantee(?:d)?|assured|risk[-\s]*free|fixed[-\s]*return)\b/gi,
    guidance:
      'Avoid tips that promise guaranteed profits; all investments carry risk.',
  },
  {
    code: 'INSIDER_TIPS',
    description: 'Claims of insider/privileged information',
    severity: 'HIGH',
    pattern: /\b(insider info|non[-\s]*public information|privileged info)\b/gi,
    guidance:
      'Do not rely on tips claiming non-public insider information; illegal to act on.',
  },
  {
    code: 'TELEGRAM_GROUP',
    description: 'Tips promoted via Telegram/WhatsApp groups',
    severity: 'MEDIUM',
    pattern: /\b(telegram|t\.me|whatsapp|join group)\b/gi,
    guidance:
      'Be cautious of tips from unregulated messaging groups; verify sources.',
  },
  {
    code: 'MULTIBAGGER_CLAIMS',
    description: 'Claims of huge short-term returns',
    severity: 'MEDIUM',
    pattern: /\b(multibagger|100x|10x|double your money|triple your money)\b/gi,
    guidance:
      'Avoid tips promising extreme returns in short timelines; high risk.',
  },
  {
    code: 'ACCOUNT_ACCESS',
    description: 'Offers to trade on your behalf / ask for OTP/password',
    severity: 'HIGH',
    pattern: /\b(trade on your behalf|share your otp|give password|login)\b/gi,
    guidance:
      'Never share account credentials or OTP; advisers should not manage accounts directly.',
  },
];

/* ---------------------------
   Helper: Scan tip for red flags
--------------------------- */
function scanTip(tip: string): Violation[] {
  const violations: Violation[] = [];

  for (const flag of RED_FLAGS) {
    const matches: string[] = [];
    let m: RegExpExecArray | null;
    const regex = new RegExp(flag.pattern.source, flag.pattern.flags);

    while ((m = regex.exec(tip)) !== null) {
      if (m[0]) matches.push(m[0]);
      if (regex.lastIndex === m.index) regex.lastIndex++; // prevent infinite loop
    }

    if (matches.length > 0) {
      violations.push({
        code: flag.code,
        description: flag.description,
        severity: flag.severity,
        matches: Array.from(new Set(matches)).slice(0, 10),
        guidance: flag.guidance,
      });
    }
  }

  return violations;
}

/* ---------------------------
   Compute risk score and verdict
--------------------------- */
function computeRisk(violations: Violation[]) {
  let score = 0;
  let hasHigh = false;

  for (const v of violations) {
    if (v.severity === 'HIGH') {
      score += 40;
      hasHigh = true;
    } else if (v.severity === 'MEDIUM') {
      score += 20;
    } else {
      score += 10;
    }
  }

  score = Math.min(100, score);

  let verdict: 'HIGH_RISK' | 'MEDIUM_RISK' | 'LOW_RISK' = 'LOW_RISK';
  if (score >= 70 || hasHigh) verdict = 'HIGH_RISK';
  else if (score >= 40) verdict = 'MEDIUM_RISK';

  return { score, verdict };
}

/* ---------------------------
   API Route
--------------------------- */
export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as any;
    const tipRaw = body?.tip;

    if (!tipRaw || typeof tipRaw !== 'string') {
      return NextResponse.json(
        { error: 'Tip text is required' },
        { status: 400 }
      );
    }

    const tip = tipRaw.trim().slice(0, 5000);

    const violations = scanTip(tip);
    const { score, verdict } = computeRisk(violations);

    const recommendations = violations.map((v) => v.guidance).filter(Boolean);
    const summary = violations.length
      ? `Detected issues: ${violations
          .map((v) => `${v.description} (${v.severity})`)
          .join('; ')}.`
      : 'No red flags detected.';
    return NextResponse.json(
      {
        input: tip,
        result: {
          verdict,
          riskScore: score,
          violations,
          recommendations,
          summary,
          disclaimer:
            'This tool flags tips based on SEBI-aligned rules. It is not legal advice.',
        },
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error('analyze-tip error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
