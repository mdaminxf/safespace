// lib/apps/whitelist.ts

// Mock whitelist of legitimate trading apps
export const TRUSTED_APPS = [
  'Zerodha Kite',
  'Groww',
  'Upstox',
  'Angel One',
  'ICICI Direct',
  'HDFC Securities',
];

/**
 * Check if a given app name is in the trusted whitelist
 * @param appName string - name of the trading app
 * @returns { trusted: boolean, notes: string }
 */
export function checkAppByName(appName: string) {
  const lower = appName.toLowerCase();
  const trusted = TRUSTED_APPS.some((a) => lower.includes(a.toLowerCase()));
  return {
    trusted,
    notes: trusted
      ? 'App appears in trusted whitelist'
      : 'App not in whitelist (possible fake)',
  };
}
