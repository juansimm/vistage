export const runtime = "nodejs";

import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("audio");
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ ok: false, error: "Missing audio file" }, { status: 400 });
    }

    const buf = Buffer.from(await file.arrayBuffer());
    const safeName = String(file.name || `user_recording_${Date.now()}.wav`).replace(/[^a-zA-Z0-9_.-]/g, "_");
    const dir = path.join(process.cwd(), "public", "recordings");
    await fs.mkdir(dir, { recursive: true });
    const full = path.join(dir, safeName);
    await fs.writeFile(full, buf);

    const publicPath = `/recordings/${safeName}`;
    return NextResponse.json({ ok: true, path: publicPath });
  } catch (e: any) {
    console.error("/api/upload-audio error", e);
    return NextResponse.json({ ok: false, error: e?.message || "Unknown error" }, { status: 500 });
  }
}

