// lib/media/deepfake.ts
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { fileTypeFromBuffer } from 'file-type';
import tmp from 'tmp-promise';
import sharp from 'sharp';

export type DeepfakeResult = {
  suspicious: boolean;
  score?: number; // 0..100 heuristic score (higher = more suspicious)
  notes: string[];
  metadata?: any;
  evidence?: {
    frameCount?: number;
    avgVariance?: number;
    durationSec?: number;
    hasAudio?: boolean;
    sha256?: string;
    size?: number;
    mime?: string;
    ffprobe?: any;
  } | undefined;
};

/**
 * Options
 * mode: 'mock' (very fast), 'heuristic' (local analysis), 'provider' (call external API via providerFn)
 * providerFn: optional function to call external detection API (accepts buffer, returns DeepfakeResult)
 */
export async function checkDeepfake(
  buffer: Buffer,
  opts?: {
    mode?: 'mock' | 'heuristic' | 'provider';
    providerFn?: (buffer: Buffer) => Promise<DeepfakeResult>;
    minSizeBytes?: number;
    sampleFrames?: number;
    verbose?: boolean;
  }
): Promise<DeepfakeResult> {
  const mode = opts?.mode ?? 'heuristic';

  // quick hash
  const sha256 = crypto.createHash('sha256').update(buffer).digest('hex');

  // very small files are suspicious in general (mock fallback)
  const minSizeBytes = opts?.minSizeBytes ?? 12_000; // 12 KB
  if (mode === 'mock') {
    const suspicious = buffer.length < minSizeBytes;
    return {
      suspicious,
      score: suspicious ? 80 : 10,
      notes: [
        suspicious
          ? 'Mock: file too small — likely not a genuine full-length media.'
          : 'Mock: no issues detected by heuristic.',
      ],
      evidence: { sha256, size: buffer.length },
    };
  }

  if (mode === 'provider') {
    if (!opts?.providerFn) {
      return {
        suspicious: false,
        score: 0,
        notes: ['Provider mode selected but providerFn not supplied'],
        evidence: { sha256, size: buffer.length },
      };
    }
    // delegate to provider
    try {
      const res = await opts.providerFn(buffer);
      // attach sha and size
      return {
        ...res,
        evidence: { ...(res.evidence ?? {}), sha256, size: buffer.length },
      };
    } catch (err: any) {
      return {
        suspicious: false,
        score: 0,
        notes: ['Provider call failed: ' + String(err?.message ?? err)],
        evidence: { sha256, size: buffer.length },
      };
    }
  }

  // ===== Heuristic local analysis =====
  const notes: string[] = [];
  let score = 0;
  const evidence: any = { sha256, size: buffer.length };

  // detect mime-type using file-type
  let ft: { ext?: string; mime?: string } | null = null;
  try {
    ft = await fileTypeFromBuffer(buffer).catch(() => null);
  } catch {
    ft = null;
  }
  const mime = ft?.mime ?? 'application/octet-stream';
  evidence.mime = mime;
  if (opts?.verbose) notes.push(`Detected mime: ${mime}`);

  // too small: suspicious
  if (buffer.length < minSizeBytes) {
    notes.push(
      `File size ${buffer.length} bytes is very small (<${minSizeBytes}) — suspicious.`
    );
    score += 50;
  }

  // If it's an image, run image heuristics
  if (mime.startsWith('image/')) {
    try {
      const img = sharp(buffer).greyscale().resize(256, 256, { fit: 'inside' });
      const raw = await img.raw().toBuffer({ resolveWithObject: true });
      const pixels = raw.data;
      const channels = raw.info.channels || 1;

      // compute mean and variance for luminance channel
      let sum = 0;
      const n = pixels.length / channels;
      for (let i = 0; i < pixels.length; i += channels) {
        sum += pixels[i];
      }
      const mean = sum / n;
      let varSum = 0;
      for (let i = 0; i < pixels.length; i += channels) {
        const v = pixels[i] - mean;
        varSum += v * v;
      }
      const variance = varSum / n;
      evidence.avgVariance = variance;
      if (variance < 50) {
        notes.push(
          'Image appears overly smooth / low variance — possible synthetic or heavily filtered image.'
        );
        score += 40;
      } else {
        notes.push('Image variance looks normal.');
      }
    } catch (err: any) {
      notes.push('Image heuristic failed: ' + String(err?.message ?? err));
    }

    const suspicious = score >= 50;
    return {
      suspicious,
      score: Math.min(100, score),
      notes,
      evidence,
    };
  }

  // If it's a video/audio container (heuristic)
  if (
    mime.startsWith('video/') ||
    mime.startsWith('audio/') ||
    mime === 'application/octet-stream'
  ) {
    // attempt to dynamically load fluent-ffmpeg and ffprobe-static
    let ffmpeg: any = null;
    let ffprobeStatic: any = null;
    try {
      // dynamic import so builds that can't install native deps don't fail at module load
      ffmpeg = (await import('fluent-ffmpeg')).default ?? (await import('fluent-ffmpeg'));
      ffprobeStatic = (await import('ffprobe-static')).default ?? (await import('ffprobe-static'));
      // set ffprobe path if available
      if (ffprobeStatic && ffmpeg && ffmpeg.setFfprobePath) {
        ffmpeg.setFfprobePath(ffprobeStatic.path);
      }
    } catch (err: any) {
      // If ffmpeg/ffprobe not available in runtime, return a graceful fallback
      notes.push(
        'ffmpeg/ffprobe not available in this runtime — video heuristics skipped.'
      );
      return {
        suspicious: false,
        score: Math.min(100, score),
        notes,
        evidence,
      };
    }

    // write buffer to temp file and run ffprobe
    const tmpDir = await tmp.dir({ unsafeCleanup: true });
    const tmpfile = path.join(tmpDir.path, `upload_${Date.now()}`);
    try {
      await fs.writeFile(tmpfile, buffer);

      // run ffprobe to get streams/duration
      const ffprobeInfo = await new Promise<any>((resolve, reject) => {
        ffmpeg.ffprobe(tmpfile, (err: any, data: any) => {
          if (err) reject(err);
          else resolve(data);
        });
      });

      evidence.ffprobe = ffprobeInfo;

      // duration check
      const format = ffprobeInfo?.format;
      const duration = Number(format?.duration ?? 0);
      evidence.durationSec = duration;
      if (!duration || duration < 2) {
        notes.push(`Video duration short (${duration}s) — suspicious for deepfake claim content.`);
        score += 40;
      } else {
        notes.push(`Video duration: ${duration}s`);
      }

      // audio presence
      const hasAudio = (ffprobeInfo?.streams ?? []).some((s: any) => s.codec_type === 'audio');
      evidence.hasAudio = Boolean(hasAudio);
      if (!hasAudio) {
        notes.push('No audio track detected — absence of audio can be a weak signal of manipulation.');
        score += 10;
      }

      // sample frames extraction
      const sampleFrames = opts?.sampleFrames ?? 3;
      const framesDir = path.join(tmpDir.path, 'frames');
      await fs.mkdir(framesDir);

      // compute timestamps to extract
      const timesToExtract: number[] = [];
      if (duration > 0) {
        for (let i = 1; i <= sampleFrames; i++) {
          timesToExtract.push((duration * i) / (sampleFrames + 1));
        }
      }

      const frameFiles: string[] = [];
      // extract frames using fluent-ffmpeg screenshots
      for (let i = 0; i < timesToExtract.length; i++) {
        const t = timesToExtract[i];
        const out = path.join(framesDir, `frame_${i}.png`);
        await new Promise<void>((resolve, reject) => {
          // note: fluent-ffmpeg `.screenshots()` may spawn ffmpeg binary in runtime
          ffmpeg(tmpfile)
            .screenshots({
              timestamps: [t],
              filename: path.basename(out),
