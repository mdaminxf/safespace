// lib/ocr/doc-check.ts
// Mock OCR + forgery detection

export async function checkDocument(buffer: Buffer) {
  // TODO: Replace with real OCR/forgery check (e.g., Tesseract + heuristics)
  const fakeText = buffer.toString('utf8').slice(0, 200); // just sample

  // Mock: flag if document text contains "SEBI Approval" or "Guarantee"
  const findings: string[] = [];
  if (/guarantee/i.test(fakeText))
    findings.push('Contains forbidden word: Guarantee');
  if (/sebi\s*approval/i.test(fakeText))
    findings.push('Fake SEBI approval reference');

  return {
    suspicious: findings.length > 0,
    findings,
    preview: fakeText,
  };
}
