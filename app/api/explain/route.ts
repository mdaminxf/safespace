// app/api/explain/route.ts
import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const GEMINI_KEY = process.env.GEMINI_API_KEY ?? '';

const ai = GEMINI_KEY ? new GoogleGenAI({ apiKey: GEMINI_KEY }) : null;

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const bio: string | undefined = body?.bio;
    const hfResult = body?.hfResult ?? body?.hfresult ?? null;
    const question: string | undefined = body?.question;

    if (!bio || typeof bio !== 'string' || bio.trim().length === 0) {
      return NextResponse.json(
        { error: 'Bio (advisor profile text) is required' },
        { status: 400 }
      );
    }

    const usedHF = !!hfResult;

    // Build a clear, guarded prompt. Only include hfResult if present.
    const hfBlock = usedHF
      ? `\n\nML Analysis: ${JSON.stringify(hfResult)}`
      : '';
    const prompt = question
      ? `You are an AI assistant helping a retail investor. Answer the question concisely and in simple language, aligned with SEBI compliance and consumer protection.\n\nBio: "${bio}"${hfBlock}\n\nQuestion: ${question}`
      : `You are an AI assistant helping a retail investor. Read the advisor bio and provide a short, plain-language assessment (risky vs safe), highlight main concerns, and give 3 short recommendations aligned with SEBI-style compliance.\n\nBio: "${bio}"${hfBlock}\n\nProvide the answer as a human-friendly paragraph and a short recommendations list.`;

    // Suggestions for quick UI chat buttons
    const suggestions = [
      'How do I verify SEBI registration?',
      'What questions should I ask about fees and conflicts?',
      'Do these services match my risk profile?',
    ];

    // If Gemini key not present, return a graceful demo response
    if (!ai) {
      const demoExplanation = usedHF
        ? `Demo mode — GEMINI_API_KEY not set. Would have used ML analysis: ${JSON.stringify(
            hfResult
          )}`
        : 'Demo mode — GEMINI_API_KEY not set. Provide a GEMINI_API_KEY to enable real AI explanations.';
      return NextResponse.json({
        bio,
        hfResult: hfResult ?? null,
        usedHF,
        explanation: demoExplanation,
        suggestions,
        raw: null,
        note: 'GEMINI_API_KEY missing — returned demo response',
      });
    }

    // Call GenAI
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      });

      // response.text is used in your client previously — try common locations
      const explanation =
        (response as any)?.text ??
        (response as any)?.outputText ??
        JSON.stringify(response ?? {});
      return NextResponse.json({
        bio,
        hfResult: hfResult ?? null,
        usedHF,
        explanation,
        suggestions,
        raw: response,
      });
    } catch (apiErr: any) {
      console.error('Gemini API call failed:', apiErr);
      // Return partial useful info to UI so demo doesn't break
      return NextResponse.json(
        {
          bio,
          hfResult: hfResult ?? null,
          usedHF,
          explanation:
            'AI request failed — see server logs. You can still run ML checks.',
          suggestions,
          raw: { error: String(apiErr?.message ?? apiErr) },
        },
        { status: 200 }
      );
    }
  } catch (error: any) {
    console.error('explain route error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
