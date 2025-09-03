// app/api/deepfake/route.ts
import { NextResponse } from 'next/server';
import { checkDeepfake } from '../../../lib/media/deepfake';

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get('content-type') || '';

    let buffer: Buffer | null = null;
    let source: string | null = null;

    if (contentType.includes('multipart/form-data')) {
      // handle file upload (FormData)
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      if (!file) {
        return NextResponse.json(
          { error: 'No file uploaded (field name must be "file")' },
          { status: 400 }
        );
      }
      const ab = await file.arrayBuffer();
      buffer = Buffer.from(ab);
      source = (file as any).name ?? 'uploaded-file';
    } else {
      // attempt JSON body with { url: 'https://...' }
      const body = await req.json().catch(() => ({}));
      const url = body?.url;
      if (!url || typeof url !== 'string') {
        return NextResponse.json(
          {
            error:
              'Expected multipart form-data with file OR JSON { "url": "https://..." }',
          },
          { status: 400 }
        );
      }

      // fetch remote video (simple fetch)
      const resp = await fetch(url);
      if (!resp.ok) {
        return NextResponse.json(
          { error: `Failed to fetch URL: ${resp.status} ${resp.statusText}` },
          { status: 400 }
        );
      }
      const ab = await resp.arrayBuffer();
      buffer = Buffer.from(ab);
      source = url;
    }

    if (!buffer) {
      return NextResponse.json(
        { error: 'No media buffer available' },
        { status: 400 }
      );
    }

    // Safety: limit size for demo (e.g., 50 MB). Adjust as needed.
    const MAX_BYTES = 50 * 1024 * 1024;
    if (buffer.length > MAX_BYTES) {
      return NextResponse.json(
        {
          error: `File too large (${Math.round(
            buffer.length / 1024 / 1024
          )} MB). Max allowed is ${MAX_BYTES / 1024 / 1024} MB.`,
        },
        { status: 413 }
      );
    }

    // Run deepfake check (heuristic). If your environment can't run ffmpeg/sharp, switch mode to 'mock'.
    const res = await checkDeepfake(buffer, {
      mode: 'heuristic',
      sampleFrames: 3,
      verbose: false,
    });

    // Attach basic source info
    const payload = {
      source,
      sizeBytes: buffer.length,
      result: res,
    };

    return NextResponse.json(payload, {
      status: 200,
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (err: any) {
    console.error('deepfake analyze error:', err);
    return NextResponse.json(
      { error: String(err?.message ?? err) },
      { status: 500 }
    );
  }
}
