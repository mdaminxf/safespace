import { NextResponse } from 'next/server';
import {
  scanBioForFlags,
  checkSEBIRegistrationFlexible,
  computeRiskFromViolations,
  buildRecommendations,
  Violation,
} from '../../../lib/frad-utils';
import * as pdfjsLib from "pdfjs-dist";
import "pdfjs-dist/build/pdf.worker.entry";
import { GoogleGenAI } from '@google/genai';

/* ---------------------------
   Types
--------------------------- */
type FraudCheckResult = {
  verdict: 'HIGH_RISK' | 'MEDIUM_RISK' | 'LOW_RISK' | 'UNKNOWN';
  riskScore: number;
  sebi: any;
  redFlags: Violation[];
  ai?: any;
  documentAnalysis?: { text?: string; suspicious?: boolean; metadata?: any } | null; // <-- allow null
  summary: string;
  recommendations: string[];
};


/* ---------------------------
AI/NLP via Google GenAI
--------------------------- */
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
async function genAIClassify(text: string) {
  try {
    const client = new GoogleGenAI({ apiKey: process.env.GENAI_API_KEY });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `Classify this text for investment fraud: "${text}"\nLabels: legitimate, misleading, fraudulent`,
            },
          ],
        },
      ],
    });

    // Simple parsing: extract top label from AI output
    const outputText = response?.text || '';
    let topLabel: string = 'unknown';
    if (/fraudulent/i.test(outputText)) topLabel = 'fraudulent';
    else if (/misleading/i.test(outputText)) topLabel = 'misleading';
    else if (/legitimate/i.test(outputText)) topLabel = 'legitimate';

    return { topLabel, raw: outputText };
  } catch (err: any) {
    return { error: err.message };
  }
}

/* ---------------------------
   PDF OCR + metadata stub
--------------------------- */
async function analyzeDocument(fileBuffer: Buffer) {
  try {
    const loadingTask = pdfjsLib.getDocument({ data: fileBuffer });
    const pdf = await loadingTask.promise;
    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items.map((item: any) => item.str).join(' ');
      fullText += pageText + ' ';
    }

    const suspicious = /\b(guarantee|approved by sebi|fraud|fake)\b/i.test(
      fullText
    );
    const metadata = { size: fileBuffer.length, type: 'pdf', suspicious };
    return { text: fullText.trim(), suspicious, metadata };
  } catch (err) {
    return { error: 'Failed to parse document' };
  }
}

/* ---------------------------
   Route Handler
--------------------------- */
export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const bioRaw = formData.get('bio') as string | null;
    const regNo = formData.get('regNo') as string | null;
    const file = formData.get('file') as File | null;

    if (!bioRaw && !file) {
      return NextResponse.json(
        { error: 'Provide at least bio text or document' },
        { status: 400 }
      );
    }

    const bio = bioRaw?.trim().slice(0, 8000) ?? '';

    // 1) SEBI registration check
    const sebiCheck = await checkSEBIRegistrationFlexible(regNo, bio);

    // 2) Red-flag scan
    const violations = scanBioForFlags(bio);

    // 3) AI classification via Google GenAI
    let aiResult = null;
    if (bio) aiResult = await genAIClassify(bio);

    // 4) Document analysis
    let documentAnalysis = null;
    if (file && file.arrayBuffer) {
      const buffer = Buffer.from(await file.arrayBuffer());
      documentAnalysis = await analyzeDocument(buffer);
    }

    // 5) Compute risk & verdict
    const { riskScore, verdict } = computeRiskFromViolations(
      violations,
      sebiCheck
    );

    // 6) Build summary & recommendations
    const recs = buildRecommendations({ violations, sebiCheck });
    const summaryParts: string[] = [];
    if (violations.length > 0)
      summaryParts.push(
        `Detected text issues: ${violations
          .map((v) => v.description)
          .join('; ')}`
      );
    if (sebiCheck)
      summaryParts.push(
        `SEBI registration: ${sebiCheck.valid ? 'VALID' : 'INVALID'} (${
          sebiCheck.reason
        })`
      );
    if (aiResult?.topLabel)
      summaryParts.push(`AI classification: ${aiResult.topLabel}`);
    if (documentAnalysis?.suspicious)
      summaryParts.push(`Document analysis flagged suspicious terms.`);

    const result: FraudCheckResult = {
      verdict,
      riskScore,
      sebi: sebiCheck,
      redFlags: violations,
      ai: aiResult,
      documentAnalysis,
      summary: summaryParts.join(' '),
      recommendations: recs,
    };

    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    console.error('fraud-check error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
