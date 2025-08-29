import { NextRequest, NextResponse } from 'next/server';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const form = await request.formData();
    const audio = form.get('audio') as unknown as File | null;
    if (!audio) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    const arrayBuf = await audio.arrayBuffer();
    const buffer = Buffer.from(arrayBuf);
    const recordingsDir = path.join(process.cwd(), 'knowledge', 'recordings');
    await mkdir(recordingsDir, { recursive: true });

    const filename = (audio as any).name || `user_recording_${Date.now()}.wav`;
    const filePath = path.join(recordingsDir, filename);
    await writeFile(filePath, buffer);

    return NextResponse.json({ success: true, filename, path: filePath });
  } catch (e) {
    console.error('Upload audio failed', e);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}

