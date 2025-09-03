// lib/rules.ts
export type RedFlag = {
  code: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  matches: string[];
};

export function scanBioForFlags(bio: string): RedFlag[] {
  const flags: RedFlag[] = [];

  // 1. Guaranteed returns
  if (/guaranteed|assured|risk[-\s]?free/i.test(bio)) {
    flags.push({
      code: 'GUARANTEED_RETURNS',
      description:
        'Promises of guaranteed/assured profits or risk-free returns',
      severity: 'HIGH',
      matches: bio.match(/guaranteed|assured|risk[-\s]?free/gi) || [],
    });
  }

  // 2. Insider tips / Telegram / WhatsApp groups
  if (/telegram|whatsapp/i.test(bio)) {
    flags.push({
      code: 'TELEGRAM_GROUP_TIPS',
      description: 'Directing users to Telegram/WhatsApp groups for tips',
      severity: 'MEDIUM',
      matches: bio.match(/telegram|whatsapp/gi) || [],
    });
  }

  // 3. Unrealistic growth claims
  if (/\b\d{2,}%\b/.test(bio)) {
    flags.push({
      code: 'UNREALISTIC_GROWTH',
      description: 'Unrealistic growth or returns claims',
      severity: 'MEDIUM',
      matches: bio.match(/\b\d{2,}%\b/g) || [],
    });
  }

  return flags;
}
