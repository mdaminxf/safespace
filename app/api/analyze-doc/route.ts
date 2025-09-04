// app/api/analyze-doc/route.ts
import { NextResponse } from "next/server";
import { PdfReader } from "pdfreader";
import { GoogleGenAI } from "@google/genai";

type RedFlag = {
  description: string;
  severity: "low" | "medium" | "high" | string;
  matches: string[];
  guidance?: string;
};

type SEBIDetails = {
  registration: { valid: boolean; reason?: string };
  redFlags: RedFlag[];
};

type FraudResult = {
  verdict: "Valid" | "Invalid" | "Risky" | string;
  riskScore: number;
  sebi: SEBIDetails;
  summary: string;
  recommendations: string[];
};

async function extractTextFromBuffer(buffer: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    let text = "";
    try {
      new PdfReader().parseBuffer(buffer, (err, item) => {
        if (err) {
          reject(err);
          return;
        }
        if (!item) {
          resolve(text.trim());
          return;
        }
        if ((item as any).text) {
          text += (item as any).text + " ";
        }
      });
    } catch (e) {
      reject(e);
    }
  });
}

async function callGeminiAnalyze(ai: GoogleGenAI, model: string, text: string): Promise<{ parsed?: FraudResult; raw?: string }> {
  // Build a strong instruction to return JSON only
  const system = `You are an assistant specialized in analyzing SEBI / Indian regulatory documents for fraud/compliance risks.
Return a single JSON object that exactly matches this schema (no extra commentary):
{
  "verdict": "Valid | Invalid | Risky",
  "riskScore": 0-100,
  "sebi": {
    "registration": { "valid": boolean, "reason": "string (optional)" },
    "redFlags": [
      { "description": "string", "severity": "low|medium|high", "matches": ["matching text snippets"], "guidance": "string (optional)" }
    ]
  },
  "summary": "short summary string",
  "recommendations": ["string", ...]
}`;

  const user = `Analyze the document (DOCUMENT START) below and output only the JSON described above. DOCUMENT START:\n\n${text}\n\nDOCUMENT END.`;

  const response = await ai.models.generateContent({
    model,
    contents: [
      {
        parts: [{ text: system + "\n\n" + user }],
      },
    ],
    // keep deterministic
    config: { temperature: 0.0 },
  });

  // .text contains assembled text response (per SDK quickstart)
  const content = (response as any).text ?? "";

  // strip common fences and parse JSON
  const cleaned = content
    .trim()
    .replace(/^```(?:json)?\s*/, "")
    .replace(/```\s*$/, "");

  try {
    const parsed = JSON.parse(cleaned) as FraudResult;
    // normalize riskScore
    if (typeof parsed.riskScore !== "number") parsed.riskScore = Number((parsed as any).riskScore) || 0;
    return { parsed };
  } catch (e) {
    // parsing fail: return raw content for fallback/diagnostics
    return { raw: content };
  }
}

export async function POST(req: Request) {
  try {
    const contentType = (req.headers.get("content-type") || "").toLowerCase();
    let textToAnalyze = "";

    if (contentType.startsWith("multipart/form-data")) {
      const form = await req.formData();
      const file = form.get("file") as File | null;
      const rawText = form.get("text") as string | null;

      if (file) {
        const buf = Buffer.from(await file.arrayBuffer());
        textToAnalyze = await extractTextFromBuffer(buf);
      } else if (rawText) {
        textToAnalyze = rawText;
      }
    } else if (contentType.includes("application/json")) {
      const body = await req.json().catch(() => ({}));
      textToAnalyze = body?.text ?? "";
    } else {
      // fallback: try formData
      try {
        const form = await req.formData();
        const file = form.get("file") as File | null;
        const rawText = form.get("text") as string | null;
        if (file) {
          textToAnalyze = await extractTextFromBuffer(Buffer.from(await file.arrayBuffer()));
        } else if (rawText) {
          textToAnalyze = rawText;
        }
      } catch {
        // nothing
      }
    }

    if (!textToAnalyze || !textToAnalyze.trim()) {
      return NextResponse.json({ error: "No text or file content provided" }, { status: 400 });
    }

    // Initialize GenAI client (SDK reads GEMINI_API_KEY from env if not provided)
    const GEMINI_KEY = process.env.GEMINI_API_KEY;
    const MODEL = process.env.MODEL || "gemini-2.5-flash";

    if (!GEMINI_KEY) {
      // No key: return demo result (safe fallback)
      const demo: FraudResult = {
        verdict: "Risky",
        riskScore: 42,
        sebi: {
          registration: { valid: false, reason: "Registration not found" },
          redFlags: [
            {
              description: "Unclear fees disclosure",
              severity: "medium",
              matches: ["fee", "charge", "commission"],
              guidance: "Verify fee schedule against SEBI registry",
            },
          ],
        },
        summary: textToAnalyze.slice(0, 300) + (textToAnalyze.length > 300 ? "..." : ""),
        recommendations: ["Verify registration with SEBI", "Request clearer disclosures"],
      };
      return NextResponse.json({ result: demo }, { status: 200 });
    }

    // create client (pass apiKey explicitly or let SDK use GEMINI_API_KEY)
    const ai = new GoogleGenAI({ apiKey: GEMINI_KEY });

    // call Gemini
    let analyzeRes = await callGeminiAnalyze(ai, MODEL, textToAnalyze);

    if (analyzeRes.parsed) {
      return NextResponse.json({ result: analyzeRes.parsed }, { status: 200 });
    } else {
      // raw content fallback — return raw text and helpful message
      return NextResponse.json(
        { raw: analyzeRes.raw ?? "Model returned no parsable JSON", note: "Model output couldn't be parsed as JSON; inspect `raw` for diagnostics" },
        { status: 200 }
      );
    }
  } catch (err: any) {
    console.error("Server error in /api/analyze-doc (Gemini):", err);
    return NextResponse.json({ error: "Internal server error", details: String(err) }, { status: 500 });
  }
}
