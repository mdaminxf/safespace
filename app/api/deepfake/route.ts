import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import os from 'os';
import path from 'path';
import fetch from 'node-fetch';
import ffmpegPath from '@ffmpeg-installer/ffmpeg';
import { promisify } from 'util';
import { exec as execCb } from 'child_process';

const exec = promisify(execCb);
export const runtime = 'nodejs';

const TMP_DIR = path.join(os.tmpdir(), 'deepfake-analyze');
if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });

const GEMINI_KEY = process.env.GEMINI_API_KEY ?? '';
const ai = GEMINI_KEY ? new GoogleGenAI({ apiKey: GEMINI_KEY }) : null;

async function downloadToTmp(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch media: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const filename = path.join(TMP_DIR, `remote_${Date.now()}.mp4`);
  await fs.promises.writeFile(filename, buf);
  return { path: filename, size: buf.length };
}

async function extractAudioAndFrames(inputPath: string, prefix: string) {
  const audioPath = path.join(TMP_DIR, `${prefix}_audio.wav`);
  const framesDir = path.join(TMP_DIR, `${prefix}_frames`);
  await fs.promises.mkdir(framesDir, { recursive: true });
  await exec(`"${ffmpegPath.path}" -hide_banner -loglevel error -y -i "${inputPath}" -ar 16000 -ac 1 "${audioPath}"`);
  await exec(`"${ffmpegPath.path}" -hide_banner -loglevel error -y -i "${inputPath}" -vf "fps=1,scale=640:-1" "${path.join(framesDir, 'frame_%04d.jpg')}"`);
  const files = (await fs.promises.readdir(framesDir)).map(f => path.join(framesDir, f));
  return { audioPath, frameFiles: files };
}

async function callHuggingFaceForFrame(framePath: string) {
  const HF_TOKEN = process.env.HUGGINGFACE_TOKEN;
  const HF_MODEL = process.env.HUGGINGFACE_MODEL;
  if (!HF_TOKEN || !HF_MODEL) throw new Error('Missing HF config');
  const body = await fs.promises.readFile(framePath);
  const resp = await fetch(`https://api-inference.huggingface.co/models/${HF_MODEL}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${HF_TOKEN}`, 'Content-Type': 'application/octet-stream' },
    body,
  });
  if (!resp.ok) throw new Error(`HF error ${resp.status}`);
  return resp.json();
}

function heuristicAggregate(frameResults: any[]) {
  const fakeScores = frameResults.flatMap(r =>
    Array.isArray(r)
      ? r.filter((it: any) => /fake/i.test(it.label)).map((it: any) => it.score)
      : []
  );
  const avg = fakeScores.length ? fakeScores.reduce((a, b) => a + b, 0) / fakeScores.length : 0;
  const score = Math.round(avg * 100);
  return { score, suspicious: score >= 35 };
}

async function callGeminiAggregate(params: {
  audioPath: string;
  sampleFrames: string[];
  hfEvidence: any[];
  heuristic: { score: number; suspicious: boolean };
}) {
  if (!ai) throw new Error('Gemini not configured');

  const prompt = `
You are a compliance + deepfake detection assistant...
Return ONLY valid JSON with keys:
{summary, suspicious, score, ad_required_fields, ad_violations, citations, evidence, actions, notes}
Heuristic score: ${params.heuristic.score}, suspicious: ${params.heuristic.suspicious}
`;

  const parts: any[] = [{ text: prompt }];
  if (fs.existsSync(params.audioPath)) {
    parts.push({ inlineData: { mimeType: 'audio/wav', data: fs.readFileSync(params.audioPath).toString('base64') } });
  }
  params.sampleFrames.slice(0, 6).forEach(f =>
    parts.push({ inlineData: { mimeType: 'image/jpeg', data: fs.readFileSync(f).toString('base64') } })
  );
  parts.push({ text: `HF_EVIDENCE_JSON:\n${JSON.stringify(params.hfEvidence.slice(0, 10))}` });

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-preview-04-17',
    contents: { parts },
    config: { responseMimeType: 'application/json' },
  });
  const raw = response.text ?? '';
  const jsonStr = raw.replace(/^```(?:json)?\n/, '').replace(/\n```$/, '');
  try {
    return JSON.parse(jsonStr);
  } catch {
    return { summary: 'parse error', raw };
  }
}

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') ?? '';
    const prefix = `deepfake_${Date.now()}`;
    let localFilePath: string, sizeBytes = 0, source = 'upload';

    if (contentType.includes('multipart/form-data')) {
      const fd = await req.formData();
      const file = fd.get('file') as Blob | null;
      if (!file) return NextResponse.json({ error: 'File is required' }, { status: 400 });
      const buf = Buffer.from(await file.arrayBuffer());
      sizeBytes = buf.length;
      const filepath = path.join(TMP_DIR, `${prefix}_upload`);
      await fs.promises.writeFile(filepath, buf);
      localFilePath = filepath;
    } else if (contentType.includes('application/json')) {
      const { url } = await req.json();
      if (!url) return NextResponse.json({ error: 'Missing url' }, { status: 400 });
      const dl = await downloadToTmp(url);
      localFilePath = dl.path;
      sizeBytes = dl.size;
      source = url;
    } else {
      return NextResponse.json({ error: 'Unsupported content type' }, { status: 400 });
    }

    const { audioPath, frameFiles } = await extractAudioAndFrames(localFilePath, prefix);
    const sampled = frameFiles.slice(0, Math.min(6, frameFiles.length));
    const hfResults = await Promise.all(sampled.map(f => callHuggingFaceForFrame(f).catch(e => ({ error: String(e) }))));
    const heuristic = heuristicAggregate(hfResults);
    const gemini = await callGeminiAggregate({ audioPath, sampleFrames: sampled, hfEvidence: hfResults, heuristic });

    return NextResponse.json({
      source,
      sizeBytes,
      result: {
        suspicious: heuristic.suspicious || gemini.suspicious,
        score: gemini.score ?? heuristic.score,
        hf_summary: { frameCount: sampled.length },
        gemini,
      },
    });
  } catch (err: any) {
    console.error('deepfake api error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
